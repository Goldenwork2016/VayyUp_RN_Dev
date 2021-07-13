import React, {useState, useEffect, useCallback} from 'react';
import {
  TextInput,
  Dimensions,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import firebase from '@react-native-firebase/app';
import {useDispatch, useSelector} from 'react-redux';
import {FontAwesomeIcon} from 'src/icons';
import ViewPager from 'react-native-pager-view';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import {voteEntry, unvoteEntry,competitionVideoViewed} from 'services/social';
import Feed from 'screens/Home/Feed';
// import VideoFeed from 'components/VideoFeed/VideoFeed';
import {searchFeeds,setActiveVideo, searchFeedsFromAlgolia} from 'src/redux/reducers/actions';

import {
  Text,
  SafeAreaView,
  HorizontalView,
  VerticalView,
  View,
  VUTouchableOpacity,
  VUView,
} from 'common-components';
import {Overlay, ActivityIndicator} from 'common-components';
import {useDebouncedCallback} from 'use-debounce';
const {height} = Dimensions.get('window');

function CompetitionVideos({route}) {
  const {competition = ''} = route.params;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState(0);
  const [videoHeight, setVideoHeight] = useState(height);
  const [searchBarHeight, setSearchBarHeight] = useState(60);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const dispatch = useDispatch();
  const focused = useIsFocused();
  const feeds = useSelector((state) => state.feeds.feeds);

  

  useFocusEffect(
    React.useCallback(() => {
      // Do something when the screen is focused
      if (!commenting) {
        // dispatch(searchFeeds(competition.id, search));
      }
      setCommenting(false);
      return () => {
        // Do something when the screen is unfocused
        // Useful for cleanup functions
      };
    }, [commenting, dispatch, competition.id]),
  );
  useFocusEffect(
    React.useCallback(() => {
      async function fetchData() {
        await dispatch(searchFeeds(competition.id, search));
        setLoading(false)
      }
      fetchData()
    }, []),
  );
  const debounced = useDebouncedCallback(
    // function
    (value) => {
      // setSearchTerm(value);
      dispatch(searchFeeds(competition.id, search));
    },
    // delay in ms
    1000,
  );

  const handleChangeSearch = (text) => {
    setSearch(text);
    debounced(text);
  };

  const handleClearSearch = () => {
    dispatch(searchFeeds(competition.id, search));
    setSearch('');
  };

  const handleVoting = async (item) => {
    const user = firebase.auth().currentUser;
    await voteEntry(user, item);
  };
  const handlingViewCount = async(item) => {
    const user = firebase.auth().currentUser;
    await competitionVideoViewed(user, item);
   
  };

  const handleCommenting = () => {
    setCommenting(true);
  };

  const handleBacktToCompetitions = () => {
    navigation.goBack();
  };

  const handleUnvoting = async (item) => {
    const user = firebase.auth().currentUser;
    await unvoteEntry(user, item);
  };
  const handleLayoutChanged = (e) => {
    if (videoHeight === height) {
      setVideoHeight(e.nativeEvent.layout.height);
    }
  };
  const handleVieweableItemsChanged = useCallback(
    ({viewableItems, changed}) => {
      const viewable =
        changed.find((obj) => obj.isViewable) ||
        viewableItems.find((obj) => obj.isViewable);
      if(viewable){
        dispatch(setActiveVideo(viewable.key));
      }
      // Since it has no dependencies, this function is created only once
    },
    [],
  );
  if (loading) {
    return (
      <Overlay>
        <ActivityIndicator animating={loading} />
      </Overlay>
    );
  }
  const getItemLayout = (data, index) => ({
    length: videoHeight,
    offset: videoHeight * index,
    index,
  });
  const renderVideo = ({item, index}) => {
    return (
      <VUView height={videoHeight}>
        <Feed
          type="competition"
          key={item.id}
          item={item}
          index={index}
          focused={focused}
          onVoting={handleVoting}
          onUnvoting={handleUnvoting}
          onCommenting={handleCommenting}
          OnViewCount={handlingViewCount}
        />
      </VUView>
    );
  };

  return (
    <VUView
      flex={1}
      pt={insets.top}
      pb={insets.bottom}>
      {/* <StatusBar barStyle="light-content" hidden={false} /> */}
      <View padding={10} top={0} bottom = {0}>
        <View flexDirection="row">
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: '8%',
            }}>
            <VUTouchableOpacity onPress={handleBacktToCompetitions}>
              <FontAwesomeIcon size={16} color="#666" name="chevron-left" />
            </VUTouchableOpacity>
          </View>
          <View
            backgroundColor="#fff"
            radius={30}
            padding={5}
            width="90%"
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginLeft: 4,
            }}>
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
        </View>
      </View>
      <VUView onLayout={handleLayoutChanged}>
        {feeds.length > 0 ? (
          <FlatList
            data={feeds}
            onViewableItemsChanged={handleVieweableItemsChanged}
            renderItem={renderVideo}
            keyExtractor={(item) => item.id}
            initialNumToRender={10}
            windowSize={10}
            pagingEnabled={true}
            removeClippedSubviews={true}
            getItemLayout={getItemLayout}
            viewabilityConfig={{
              minimumViewTime: 100,
              itemVisiblePercentThreshold: 80,
            }}
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

export default CompetitionVideos;
