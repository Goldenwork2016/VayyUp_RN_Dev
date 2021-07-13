import React, {useState, useEffect, useCallback} from 'react';
import {FlatList, Dimensions} from 'react-native';
import firebase from '@react-native-firebase/app';
import {useDispatch, useSelector} from 'react-redux';
import {useDebouncedCallback} from 'use-debounce';
import {useIsFocused} from '@react-navigation/native';
import Feed from 'screens/Home/Feed';
import {AppStyles} from '../../AppStyles';
import {searchVideos, setActiveVideo} from 'src/redux/reducers/video.actions';
import {
  Text,
  View,
  Overlay,
  ActivityIndicator,
  VUView,
} from 'common-components';
import {voteVideo, unvoteVideo,feedVideoViewed} from 'services/social';
import {RecyclerListView, DataProvider, LayoutProvider} from 'recyclerlistview'

const {height, width} = Dimensions.get('window');
function Home() {
  const dispatch = useDispatch();
  const videos = useSelector((state) => state.videos.hasOwnProperty('videos') ? state.videos.videos : []);
  const [search, setSearch] = useState('');
  const [videoHeight, setVideoHeight] = useState(height);
  const [dataProvider,setDataProvider] = useState(new DataProvider((r1,r2)=> r1 !== r2))
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const focused = useIsFocused();

  const debounced = useDebouncedCallback(
    // function
    (value) => {
      setSearchTerm(value);
      dispatch(searchVideos(value));
    },
    // delay in ms
    1000,
  );

  const handleChangeSearch = (text) => {
    setSearch(text);
    debounced.callback(text);
  };

  const handleClearSearch = () => {
    dispatch(searchVideos(''));
    setSearchTerm('');
    setSearch('');
  };

  const handleRefresh = () => {
    dispatch(searchVideos(searchTerm, 0));
  };

  const layoutProvider = new LayoutProvider(
    index => {
      return "VSEL"
    },
    (type,dim)=>{
      switch (type) {
        case 'VSEL':
          dim.width = width;
          dim.height = videoHeight;
          break;
      
        default:
          break;
      }
    }
  )
  useEffect(() => {
    dispatch(searchVideos(searchTerm));
  }, []);
  useEffect(() => {
    if (focused) {
      if (!commenting) {
        // dispatch(searchVideos(searchTerm));
      }
      setCommenting(false);
    }
  }, [focused, commenting, dispatch, searchTerm]);

  useEffect(() => {
    if (videos.length > 0) {
      setDataProvider(dataProvider.cloneWithRows(videos))
      setLoading(false);
    }
  }, [videos]);

  const handleCommenting = () => {
    setCommenting(true);
  };
  const handlingViewCount = async(item) => {
    const user = firebase.auth().currentUser;
  await feedVideoViewed(user, item);
  
  };

  const handleVoting = async (item) => {
    const user = firebase.auth().currentUser;
    await voteVideo(user, item);
  };

  const handleUnvoting = async (item) => {
    const user = firebase.auth().currentUser;
    await unvoteVideo(user, item);
  };

  const handleViewableItemsChanged = useCallback(
    ({viewableItems, changed}) => {
      const viewable =
        changed.find((obj) => obj.isViewable) ||
        viewableItems.find((obj) => obj.isViewable);
      if (viewable) {
        dispatch(setActiveVideo(viewable.key));
      }
    },
    [dispatch],
  );

  const handleLayoutChanged = (e) => {
    if (videoHeight === height) {
      setVideoHeight(e.nativeEvent.layout.height);
    }
  };

  const handleOnEndReached = () => {
    dispatch(searchVideos(searchTerm));
  };

  const getItemLayout = (data, index) => ({
    length: videoHeight,
    offset: videoHeight * index,
    index,
  });
  // const activeVideoId = useSelector(({ videos }) => videos.active.id);
  const renderVideo = ({item, index}) => {
    // console.log("Active", activeVideoId === item.id ? true : false);
    // item.active = activeVideoId === item.id ? true : false
    return (
      <VUView height={`${videoHeight}px`}>
        <Feed
          key={item.id}
          item={item}
          index={index}
          focused={focused}
          onVoting={handleVoting}
          onUnvoting={handleUnvoting}
          onCommenting={handleCommenting}
          OnViewCount={handlingViewCount}
          // onRefresh={handleRefresh}
        />
      </VUView>
    );
  };

  if (loading) {
    return (
      <Overlay>
        <ActivityIndicator animating={loading} />
      </Overlay>
    );
  }

  // const validVideos = videos.filter((obj) => obj.playback);
  return (
    <VUView flex={1}>
      {/* <View padding={10}>
          <View
            backgroundColor="#fff"
            radius={30}
            padding={5}
            style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <FontAwesomeIcon name="search" color="#666" />
            <TextInput
              placeholder="Search"
              style={{padding: 5, flex: 1}}
              value={search}
              onChangeText={handleChangeSearch}
            />
            {search.length > 0 && (
              <FontAwesomeIcon
                name="times-circle"
                color="#666"
                onPress={handleClearSearch}
              />
            )}
          </View>
        </View> */}

      <VUView flex={1} onLayout={handleLayoutChanged}>
        {videos.length > 0 ? (
           <FlatList
           onViewableItemsChanged={handleViewableItemsChanged}
           onRefresh={handleRefresh}
           refreshing={loading}
           data={videos}
           renderItem={renderVideo}
           keyExtractor={(item) => item.id}
           initialNumToRender={0}
           windowSize={10}
           pagingEnabled={true}
           removeClippedSubviews={true}
           viewabilityConfig={{
             minimumViewTime: 100,
             itemVisiblePercentThreshold: 80,
           }}
           onEndReached={handleOnEndReached}
           onEndReachedThreshold={0.1}
           getItemLayout={getItemLayout}
           debug={false}
         />
        ) : (
          <View flex={1}>
            <Text color="#000" fontSize={18} textAlign="center">
              No results found.
            </Text>
          </View>
        )}
      </VUView>
    </VUView>
  );
}

export default Home;
