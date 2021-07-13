import React, {useState, useEffect} from 'react';
import {TextInput} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import firebase from '@react-native-firebase/app';
import {useDispatch, useSelector} from 'react-redux';
import {FontAwesomeIcon} from 'src/icons';
import ViewPager from 'react-native-pager-view';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import {voteEntry, unvoteEntry,feedVideoViewed} from 'services/social';
import VideoFeed from 'components/VideoFeed/VideoFeed';
import {searchFeeds, searchFeedsFromAlgolia} from 'src/redux/reducers/actions';

import {
  VUView,
  VUText,
  SafeAreaView,
  HorizontalView,
  VerticalView,
  View,
  VUTouchableOpacity,
} from 'common-components';
import {Overlay, ActivityIndicator} from 'common-components';

const CompetitionVideos = ({route}) => {
  const {videoId = '', videoType} = route.params;
  const navigation = useNavigation();
  const [videoDetails, setVideoDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const dispatch = useDispatch();
  const focused = useIsFocused();
  const feeds = useSelector((state) => state.feeds.feeds);

  useEffect(() => {
    const loadVideoDetails = async (_videoId) => {
      setLoading(true);
      const snapshot = await firestore()
        .collection(videoType)
        .doc(_videoId)
        .get();

      if (snapshot.exists) {
        setVideoDetails({id: _videoId, ...snapshot.data()});
        setLoading(false);
      }
    };
    loadVideoDetails(videoId);
  }, [videoId, videoType]);

  const handleVoting = async (item) => {
    const user = firebase.auth().currentUser;
    await voteEntry(user, item);
  };
  const handlingViewCount = async(item) => {
    const user = firebase.auth().currentUser;
    await feedVideoViewed(user, item);
  };

  const handleCommenting = () => {
    setCommenting(true);
  };

  const handleUnvoting = async (item) => {
    const user = firebase.auth().currentUser;
    await unvoteEntry(user, item);
  };

  const handleBacktToHome = () => {
    navigation.navigate('VayyUp');
  };

  if (loading) {
    return (
      <Overlay>
        <ActivityIndicator animating={loading} />
      </Overlay>
    );
  }

  return (
    <SafeAreaView>
      <VerticalView>
        <VideoFeed
          type={videoType === 'entries' ? 'competition' : null}
          key={videoDetails.id}
          item={videoDetails}
          index={0}
          focused={focused}
          active={true}
          load={true}
          onVoting={handleVoting}
          onUnvoting={handleUnvoting}
          onCommenting={handleCommenting}
          OnViewCount={handlingViewCount}
        />
        <VUView width="95%" justifyContent="flex-start" mt={15} mx={10}>
          <VUTouchableOpacity onPress={handleBacktToHome}>
            <VUView flexDirection="row">
              <FontAwesomeIcon size={16} color="#000" name="chevron-left" />
              <VUText ml={1} color="#FFF" fontSize={16}>
                Back
              </VUText>
            </VUView>
          </VUTouchableOpacity>
        </VUView>
      </VerticalView>
    </SafeAreaView>
  );
};

export default CompetitionVideos;
