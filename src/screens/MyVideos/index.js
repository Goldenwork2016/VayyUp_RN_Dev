import React, {useState, useEffect, useCallback} from 'react';

import {useNavigation} from '@react-navigation/native';
import firebase from '@react-native-firebase/app';
import {useDispatch, useSelector} from 'react-redux';
import {FlatList, Dimensions} from 'react-native';
import ViewPager from 'react-native-pager-view';
import firestore from '@react-native-firebase/firestore';
import Feed from '../Home/Feed';
import VideoFeed from 'components/VideoFeed/VideoFeed';
import {searchMyVideos, setActiveVideo} from 'src/redux/reducers/video.actions';
import {
  voteVideo,
  unvoteVideo,
  feedVideoViewed,
  voteEntry,
  unvoteEntry,
  competitionVideoViewed,
} from 'services/social';

import {
  VUView,
  VUText,
  SafeAreaView,
  HorizontalView,
  VerticalView,
  PrimaryButton,
} from 'common-components';
import {Overlay, ActivityIndicator} from 'common-components';
import {AppStyles} from 'src/AppStyles';
const {height} = Dimensions.get('window');
const MyVideos = ({route}) => {
  const {user = firebase.auth().currentUser, index = 0, type = 'myVideos'} =
    route.params || {};
  const isMyVideo = user.uid === firebase.auth().currentUser.uid;
  const navigation = useNavigation();
  // if (!isMyVideo) {
  //   navigation.setOptions({title: user.fullname});
  // }

  const dispatch = useDispatch();
  const feeds = useSelector(state =>
    state.videos.myVideos.filter(video =>
      user ? video.uid === user.uid : false,
    ),
  );
  let competitionVideos = useSelector(state =>
    state.videos.competitionVideos.hasOwnProperty('competitionVideos')
      ? state.videos.competitionVideos.competitionVideos
      : [],
  );
  const filteredFeeds = feeds.filter(obj => obj);
  const [active, setActive] = useState(0);
  const [videoHeight, setVideoHeight] = useState(height);
  const [activeIndex, setActiveIndex] = useState(index);
  const [focused, setFocused] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showViewPager, setShowViewPager] = useState(true);
  useEffect(() => {
    setLoading(false);
  }, [feeds]);

  useEffect(() => {
    const handleFocus = () => {
      dispatch(searchMyVideos(user.uid, isMyVideo));
      setFocused(true);
    };
    const unsubscribeFocus = navigation.addListener('focus', handleFocus);
    const unsubscribeBlur = navigation.addListener('blur', () => {
      setFocused(false);
    });
    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [user.uid, navigation, dispatch]);

  useEffect(() => {
    dispatch(searchMyVideos(user.uid, isMyVideo));
  }, [dispatch, user.uid]);

  const handleOnDelete = () => {
    // setShowViewPager(false);
    // if (activeIndex > 0) {
    //   setActiveIndex(activeIndex - 1);
    // } else {
    //   if (feeds.length === 1) {
    //     setActiveIndex(-1);
    //   }
    // }
    // setLoading(true)
    setTimeout(() => {
      dispatch(searchMyVideos(user.uid, isMyVideo));
      // setLoading(false)
    }, 10000);
    // setShowViewPager(
    //   type === 'myCompetitionVideos'
    //     ? competitionVideos.length > 0
    //     : filteredFeeds.length > 0,
    // );
  };

  const handleVoting = async item => {
    const user = firebase.auth().currentUser;
    if (type === 'myCompetitionVideos') {
      await voteEntry(user, item);
    } else {
      await voteVideo(user, item);
    }
  };

  const handleUnvoting = async item => {
    const user = firebase.auth().currentUser;
    if (type === 'myCompetitionVideos') {
      await unvoteEntry(user, item);
    } else {
      await unvoteVideo(user, item);
    }
  };
  const handlingViewCount = async item => {
    const user = firebase.auth().currentUser;
    if (type === 'myCompetitionVideos') {
      await competitionVideoViewed(user, item);
    } else {
      await feedVideoViewed(user, item);
    }
  };
  const handleLayoutChanged = e => {
    if (videoHeight === height) {
      setVideoHeight(e.nativeEvent.layout.height);
    }
  };
  const handleUpload = () => {
    navigation.navigate('Record');
  };
  const handleVieweableItemsChanged = useCallback(
    ({viewableItems, changed}) => {
      const viewable =
        changed.find(obj => obj.isViewable) ||
        viewableItems.find(obj => obj.isViewable);
      if (viewable) {
        dispatch(setActiveVideo(viewable.key));
        setActive({
          id: viewable.item.id,
          index: viewable.index,
        });
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
      <VUView height={`${videoHeight}px`}>
        <Feed
          type={
            type === 'myCompetitionVideos' ? 'myCompetitionVideos' : 'myVideos'
          }
          key={item.id}
          item={item}
          index={index}
          focused={focused}
          isMyVideos={isMyVideo}
          onDelete={handleOnDelete}
          onVoting={handleVoting}
          onUnvoting={handleUnvoting}
          OnViewCount={handlingViewCount}
        />
      </VUView>
    );
  };
  return (
    <VUView flex={1} onLayout={handleLayoutChanged}>
      {showViewPager &&
      (competitionVideos.length > 0 || filteredFeeds.length > 0) &&
      videoHeight != height ? (
        <VUView flex={1}>
          <FlatList
            data={
              type === 'myCompetitionVideos' ? competitionVideos : filteredFeeds
            }
            onViewableItemsChanged={handleVieweableItemsChanged}
            viewabilityConfig={{
              minimumViewTime: 300,
              itemVisiblePercentThreshold: 80,
            }}
            renderItem={renderVideo}
            keyExtractor={item => item.id}
            initialScrollIndex={activeIndex}
            windowSize={25}
            pagingEnabled={true}
            removeClippedSubviews={true}
            getItemLayout={getItemLayout}
          />
        </VUView>
      ) : (
        <VUView
          flex={1}
          alignItems="center"
          justifyContent="center"
          bg={AppStyles.color.bgColor}
          p={3}>
          <VUText
            color={AppStyles.color.btnColor}
            fontWeight="bold"
            fontSize={25}
            textAlign="center"
            mb={3}>
            No Videos uploaded
          </VUText>
          {isMyVideo && (
            <>
              <VUText
                color={AppStyles.color.white}
                fontSize={18}
                textAlign="center"
                mb={5}>
                You will see all your videos here. Please upload a video using
                upload below.
              </VUText>
              <PrimaryButton marginTop={0} onPress={handleUpload}>
                Upload{'  '}
              </PrimaryButton>
            </>
          )}
        </VUView>
      )}
    </VUView>
  );
};

export default MyVideos;
