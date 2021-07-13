import React, {useState, useEffect, useRef} from 'react';
import {TouchableOpacity, Dimensions, Animated} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import firebase from '@react-native-firebase/app';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigation, useIsFocused} from '@react-navigation/native';
import storage from '@react-native-firebase/storage';
import ImagePicker from 'react-native-image-crop-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GridImageView from 'react-native-grid-image-viewer';
import {IonIcon, FontAwesomeIcon, FontAwesome5Icon} from 'src/icons';
import {followUser, unfollowUser} from 'src/services/social';
import {numFormatter} from 'src/services/numFormatter'
import {
  setMyCompetitionVideosAction,
  setMyLocalVideos,
} from 'src/redux/reducers/video.actions';
import {ConnectionTab} from 'screens/Connections';
import {Title, AvatarContainer, Avatar} from './styles';
import {createNullCache} from '@algolia/cache-common';
import {RESET_ACTION} from 'redux/reducers/action.types';
import {
  deleteVideo,
  getVideosList,
  updateSyncedVideo,
  updateVideo,
} from '../../models/queries';
import {
  VUView,
  VUScrollView,
  VUText,
  VUImage,
  VUTouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  VUVideo,
} from 'common-components';
import {AppStyles} from 'src/AppStyles';
import Award from 'common-components/icons/Award';
import AwardGray from 'common-components/icons/AwardGray';
import ProfileImg from 'common-components/icons/Profile';
import ProfileGray from 'common-components/icons/ProfileGray';

const algoliasearch = require('algoliasearch');
const client = algoliasearch('JE3MQ03MQJ', 'eba71ea01813acfc254ee71414050f15', {
  responsesCache: createNullCache(), // Disable Cache
});

const algoliaVideoIndex = client.initIndex('videos');
const algoliaCompetitonIndex = client.initIndex('entries');
const {width} = Dimensions.get('window');
const windowDimensions = Dimensions.get('window');

const ProfileTabs = {
  Feeds: 0,
  Competitions: 1,
  Certificates: 2,
};
const Profile = ({route = {}}) => {
  const {params = {}} = route;
  const {showBack = false} = params;
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [userFollowing, setUserFollowing] = useState(false);
  const [user, setUser] = useState({});
  const [certificates, setCertificates] = useState([]);
  const [myVideosFeeds, setMyVideosFeeds] = useState([]);
  const [myCompetitionsVideo, setMyCompetitionVideos] = useState([]);
  const [currentUser, following] = useSelector(state => [
    state.auth.user,
    state.social.following,
  ]);
  const [feeds, setFeeds] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  let localFeedLsit = useSelector(state =>
    state.videos.localVideos.hasOwnProperty('localVideos')
      ? state.videos.localVideos.localVideos
      : [],
  );

  const [tab, setTab] = useState(ProfileTabs.Feeds);
  const isFocused = useIsFocused();
  const dispatch = useDispatch();

  useEffect(() => {
    if (following && user) {
      const alreadyFollowing = following.find(obj => obj.id === user.id);
      setUserFollowing(alreadyFollowing);
    }
  }, [user, following]);

  useEffect(() => {
    if (params.user && params.user.id) {
      const loadData = async () => {
        try {
          //setLoading(true);
          const userDoc = await firebase
            .firestore()
            .collection('users')
            .doc(params.user.id)
            .get();
          if (!userDoc.empty) {
            setUser({
              ...userDoc.data(),
              id: params.user.id,
              uid: params.user.id,
            });
          }
          setLoading(false);
        } catch (error) {}
      };
      loadData();
    } else {
      setUser(currentUser);
    }
  }, [params.user, currentUser]);

  useEffect(async () => {
    const loadFeeds = async () => {
      const {videos = 0} = user;
      const response = await algoliaVideoIndex.search(user.id, {
        restrictSearchableAttributes: ['uid'],
        hitsPerPage: parseInt(videos),
        filters: currentUser.id === user.id ? '' : 'isPublished:true',
      });
      const responseComVideos = await algoliaCompetitonIndex.search(user.id, {
        restrictSearchableAttributes: ['uid'],
        hitsPerPage: 100,
        filters: currentUser.id === user.id ? '' : 'isPublished:true',
      });
      setFeeds(await response.hits.filter(hit => hit.url));
      setCompetitions(await responseComVideos.hits.filter(hit => hit.url));
      await dispatch(
        setMyCompetitionVideosAction(
          await responseComVideos.hits.filter(hit => hit.url),
        ),
      );
      setLoading(false);
    };
    if (isFocused && user.hasOwnProperty('id')) {
      dispatch(setMyLocalVideos(await getVideosList()));
      setLoading(true);
      const {certificates = []} = user;
      setCertificates(certificates);
      loadFeeds();
    }
  }, [isFocused, user]);

  useEffect(() => {
    if (user.hasOwnProperty('id')) {
      let myVideosFeeds = feeds.filter(feed => feed.uid === user.id);

      setMyVideosFeeds(myVideosFeeds);
    }
  }, [feeds]);

  useEffect(() => {
    if (user.hasOwnProperty('id')) {
      let myCompetitionsVideo = competitions.filter(com => com.uid === user.id);
      setMyCompetitionVideos(myCompetitionsVideo);
    }
  }, [competitions]);

  useEffect(() => {
    console.log(
      'UpdatingMyFeeds and competition',
      myVideosFeeds,
      myCompetitionsVideo,
    );
  }, [myVideosFeeds, myCompetitionsVideo]);

  const handleLogout = async () => {
    await firebase.auth().signOut();
    dispatch({type: RESET_ACTION});
    // await AsyncStorage.removeItem('first-time');
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleOnTabChange = tabIndex => {
    setTab(tabIndex);
  };

  const handleUploadPhoto = () => {
    if (currentUser.id !== user.id) {
      return;
    }
    ImagePicker.openPicker({
      width: 600,
      height: 600,
      compressImageMaxHeight: 600,
      compressImageMaxWidth: 600,
      maxFiles: 1,
      mediaType: 'photo',
      cropping: true,
    }).then(async response => {
      const {path: uri} = response;
      setLoading(true);
      try {
        const filePage = 'profiles/' + uri.split('/').pop();
        const reference = storage().ref(filePage);
        await reference.putFile(uri);
        const loggedInUser = firebase.auth().currentUser;
        const url = await reference.getDownloadURL();
        await firestore()
          .collection('users')
          .doc(loggedInUser.uid)
          .update({
            profile: url,
          });
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    });
  };

  const handleOnFollowPressed = () => {
    setLoading(true);
    const {
      id: userId = '',
      fullname: userFullname = '',
      profile: userProfile = '',
    } = user;
    const {
      id: currentUserId = '',
      fullname: currentUserFullname = '',
      profile: currentUserProfile = '',
    } = currentUser;
    followUser(
      {id: userId, name: userFullname, profile: userProfile},
      {
        id: currentUserId,
        name: currentUserFullname,
        profile: currentUserProfile,
      },
    );
    setUser({...user, followers: user.followers + 1});
    setLoading(false);
  };

  const handleOnUnfollowPressed = () => {
    setLoading(true);
    const {
      id: userId = '',
      fullname: userFullname = '',
      profile: userProfile = '',
    } = user;
    const {
      id: currentUserId = '',
      fullname: currentUserFullname = '',
      profile: currentUserProfile = '',
    } = currentUser;
    unfollowUser(
      {id: userId, name: userFullname, profile: userProfile},
      {
        id: currentUserId,
        name: currentUserFullname,
        profile: currentUserProfile,
      },
    );
    setUser({...user, followers: user.followers - 1});
    setLoading(false);
  };

  const handleOnFollowingPressed = tabName => {
    navigation.navigate('Connections', {
      user: {id: user.id, name: user.name},
      tabName,
    });
  };

  const handleBackPressed = () => {
    navigation.goBack();
  };

  const handleImagePressed = (item, index, type) => {
    switch (item.isPublished) {
      case false:
        console.log('HandleImagePressedForDraft', item);
        navigation.navigate('Preview', {
          item,
          type,
        });
        break;
      default:
        if (item.playback) {
          const validVideos =
            type === 'myCompetitionVideos'
              ? myCompetitionsVideo.filter(obj => obj.playback)
              : myVideosFeeds.filter(obj => obj.playback);
          const filteredindex = validVideos.findIndex((filterItem, index) => {
            if (filterItem.id === item.id) {
              return index;
            }
          });

          navigation.navigate('UserVideos', {
            user: {...user, uid: user.id},
            item,
            type,
            index: filteredindex,
          });
        }

        break;
    }
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleLocalURI = item => {
    switch (item.status) {
      case 'Failed':
        handleUploadVideo(item);
        break;
    }
  };

  const handleUploadVideo = async item => {
    const {
      id,
      finalVideo,
      videoUri,
      userId,
      user_name,
      user_profile,
      title,
      description,
      startDateTime,
      endDateTime,
      competitionId,
      status,
      type,
    } = item;
    updateSyncedVideo(id, 'Synced', finalVideo);
    // setUploading(true);
    // setPreviewPlaying(false);
    const filename = finalVideo.split('/').pop();
    const filePath = `videos/${userId}/${filename}`;
    const reference = storage()
      .ref()
      .child(filePath);
    var UploadStarted = false;
    reference.putFile(`file://${finalVideo}`).on(
      storage.TaskEvent.STATE_CHANGED,
      async snapshot => {
        if (snapshot.state === storage.TaskState.SUCCESS && !UploadStarted) {
          UploadStarted = true;
          const url = await reference.getDownloadURL().catch(error => {
            console.log(error);
          });

          // Clean up cache
          RNFS.unlink(videoUri);
          RNFS.unlink(finalVideo);

          const {fullname = '', profile = '', location = ''} = user;
          const collectionName = competitionId ? 'entries' : 'videos';
          const document = {
            video: filePath,
            videoFileName: filename,
            url: url,
            votes: 0,
            uid: userId,
            watermarked: true,
            title,
            user: {
              name: user_name,
              profile: user_profile == 'null' ? '' : user_profile,
              location: location,
            },

            date: firebase.firestore.FieldValue.serverTimestamp(),
          };
          // Add competition details, if it is for competition
          if (competitionId) {
            document.competition = {
              title,
              description,
              startDateTime,
              endDateTime,
            };
            document.competitionId = id;
          }
          deleteVideo(id);
          await firestore()
            .collection(collectionName)
            .add(document);
          // setUploading(false);
          navigation.navigate('VideoSubmitted', {competitionId});
        }
      },
      function(error) {
        // insertVideo(finalMP4Location, video.uri,"failed")
        console.log('ErrorOnUploading theVideo', error);
        updateVideo(id, 'Failed');
      },
    );
  };

  const handleUploadCertificates = async () => {
    ImagePicker.openPicker({
      mediaType: 'photo',
      multiple: true,
      compressImageMaxHeight: 600,
      compressImageQuality: 0.8,
    }).then(async selectedImages => {
      var images = [...selectedImages.map(image => image.path)];

      setLoading(true);
      try {
        const {certificates = []} = user;
        const uploadedImages = await Promise.all(
          images
            .filter(image => !certificates.includes(image))
            .map(async image => {
              const filePage = 'users/' + image.split('/').pop();
              const reference = storage().ref(filePage);
              await reference.putFile(image);
              return reference.getDownloadURL();
            }),
        );
        const loggedInUser = firebase.auth().currentUser;
        await firestore()
          .collection('users')
          .doc(loggedInUser.uid)
          .update({
            certificates: [...certificates, ...uploadedImages],
          });
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
      // setImages([...images, ...selectedImages.map((image) => image.path)]);
    });
  };

  const renderImage = (item, index) => {
    const imageWidth = (width - 20) / 3;
    return (
      <VUTouchableOpacity
        key={item.id}
        mt="5px"
        ml="5px"
        onPress={handleImagePressed.bind(this, item, index, 'myVideos')}>
        <VUView height={200} bg="black" alignItems="center" width={imageWidth}>
          <VUImage
            source={{uri: item.thumbnail}}
            width={imageWidth}
            height={200}
            resizeMode="cover"
          />
          <VUView
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            justifyContent="flex-end"
            style={{margin: 5}}>
            <VUView flexDirection="row">
              <IonIcon name="play-outline" size={18} color="#FFF" />
              <VUText color="#FFF">
                {numFormatter(
                  parseInt(item.views != undefined ? item.views : 0),
                )}
              </VUText>
            </VUView>
          </VUView>
          {!item.playback ? (
            <VUView
              position="absolute"
              top={0}
              left={0}
              right={0}
              alignItems="center"
              bg="rgba(52, 52, 52, 0.8)">
              <VUView flexDirection="row">
                <VUText fontSize={14} fontWeigh="bold" color="#fff">
                  Processing
                </VUText>
              </VUView>
            </VUView>
          ) : null}
          {item.isPublished == false ? (
            <VUView
              position="absolute"
              top={0}
              left={0}
              right={0}
              alignItems="center"
              bg="rgba(52, 52, 52, 0.8)">
              <VUView flexDirection="row">
                <VUText fontSize={14} fontWeigh="bold" color="#fff">
                  Draft
                </VUText>
              </VUView>
            </VUView>
          ) : null}
        </VUView>
      </VUTouchableOpacity>
    );
  };
  const renderLocalUri = item => {
    const imageWidth = (width - 20) / 3;
    return (
      <VUTouchableOpacity
        key={item.id}
        onPress={handleLocalURI.bind(this, item)}>
        <VUView key={item.id} mt="5px" ml="5px" width={imageWidth} height={200}>
          <VUVideo
            flex={1}
            source={{
              uri: item.status === 'Syncing' ? item.videoUri : item.finalVideo,
              codec: 'mp4',
            }}
            volume={0}
            width={imageWidth}
            height={200}
            resizeMode="cover"
            repeat={true}
            paused={true}
          />
          <VUView
            position="absolute"
            top={0}
            left={0}
            right={0}
            alignItems="center"
            bg="rgba(52, 52, 52, 0.8)">
            <VUView flexDirection="row">
              {item.status === 'Syncing' ? (
                <VUText fontSize={14} fontWeigh="bold" color="#fff">
                  Syncing
                </VUText>
              ) : item.status === 'Synced' ? (
                <VUText fontSize={14} fontWeigh="bold" color="#fff">
                  Uploading
                </VUText>
              ) : item.status === 'Failed' ? (
                <VUText fontSize={14} fontWeigh="bold" color="#fff">
                  Failed
                </VUText>
              ) : (
                <VUText fontSize={14} fontWeigh="bold" color="#fff">
                  Syncing
                </VUText>
              )}
            </VUView>
          </VUView>
          <VUView
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            justifyContent="flex-end"
            style={{margin: 5}}>
            <VUView
              height={10}
              width="100%"
              borderColor="#ed1f2b"
              borderWidth={2}
              borderRadius={5}>
              <Animated.View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  margin: 0.5,
                  borderRadius: 5,
                  backgroundColor: '#ed1f2b',
                  width: `${50}%`,
                }}
              />
            </VUView>
          </VUView>
        </VUView>
      </VUTouchableOpacity>
    );
  };
  const renderCompetitionsImage = (item, index) => {
    const imageWidth = (width - 20) / 3;
    return (
      <VUTouchableOpacity
        key={item.id}
        mt="5px"
        ml="5px"
        onPress={handleImagePressed.bind(
          this,
          item,
          index,
          'myCompetitionVideos',
        )}>
        <VUView width={imageWidth} height={200} bg="black">
          <VUImage
            source={{uri: item.thumbnail}}
            width={imageWidth}
            height={200}
            resizeMode="cover"
          />
          <VUView
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            justifyContent="flex-end"
            style={{margin: 5}}>
            <VUView flexDirection="row">
              <IonIcon name="play-outline" size={18} color="#FFF" />
              <VUText color="#FFF">
                {numFormatter(
                  parseInt(item.views != undefined ? item.views : 0),
                )}
              </VUText>
            </VUView>
          </VUView>
        </VUView>
      </VUTouchableOpacity>
    );
  };

  const tileWidth = (windowDimensions.width - 4) / 3;

  // const myVideosFeeds = feeds
  //   .filter((feed) => feed.uid === user.id)
  //   .map((feed, index) => ({...feed, uri: feed.thumbnail, index}));

  // const myCompetitionsVideo = competitions
  //   .filter((com) => com.uid === user.id)
  //   .map((com, index) => ({...com, uri: com.thumbnail, index}));

  // const myCompetitionsVideo = competitions
  //   .filter((com) => com.uid === user.id)
  //   .map((com, index) => ({ ...com, uri: com.thumbnail, index }));
  return (
    <SafeAreaView>
      <VUView bg={AppStyles.color.bgColor} flex={1}>
        <VUView flexDirection="column" bg={AppStyles.color.bgColor}>
          <VUView width="100%" alignItems="center">
            <VUView
              pr={2}
              mt={3}
              width="100%"
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between">
              {/* <Title/> */}

              <VUView
                width="100%"
                // px={3}
                // py={2}
                flexDirection="row"
                justifyContent="space-between">
                {showBack ? (
                  <VUTouchableOpacity onPress={handleBackPressed}>
                    <IonIcon
                      name="arrow-back-outline"
                      size={36}
                      color={AppStyles.color.btnColor}
                    />
                  </VUTouchableOpacity>
                ) : (
                  <VUView />
                )}
                {currentUser.id === user.id && (
                  <TouchableOpacity onPress={handleSettings}>
                    <IonIcon name="settings" size={26} color="#FFF" />
                  </TouchableOpacity>
                )}
              </VUView>
            </VUView>
            <VUView
              alignItems="center"
              flexDirection="row"
              justifyContent="space-between"
              width="100%">
              <TouchableOpacity onPress={handleUploadPhoto}>
                {user.profile ? (
                  <AvatarContainer>
                    <Avatar source={{uri: user.profile}} resizeMode="contain" />
                  </AvatarContainer>
                ) : (
                  <IonIcon
                    name="person-circle-outline"
                    size={100}
                    color="#bbb"
                  />
                )}
                {currentUser.id === user.id && (
                  <VUView
                    top={user.profile ? -30 : -40}
                    alignItems="flex-end"
                    mb={-15}>
                    <VUView
                      width={24}
                      height={24}
                      bg="#E9326D"
                      borderRadius={14}
                      justifyContent="center"
                      alignItems="center"
                      pl="2px">
                      <FontAwesome5Icon name="plus" size={16} color="#fff" />
                    </VUView>
                  </VUView>
                )}
              </TouchableOpacity>
              <VUView flex={1} justifyContent="center">
                <VUView ml={20} mb={10}>
                  <VUText
                    fontSize={16}
                    color={AppStyles.color.white}
                    fontFamily={AppStyles.fontName.poppinsBold}>
                    {user.fullname || user.name}
                  </VUText>
                </VUView>
                <VUView
                  flexDirection="row"
                  ml={20}
                  width="70%"
                  justifyContent="space-between"
                  flex={1}>
                  <VUView mr={25}>
                    <VUTouchableOpacity
                      alignItems="center"
                      onPress={handleOnFollowingPressed.bind(
                        this,
                        ConnectionTab.Following,
                      )}>
                      <VUText
                        fontSize={16}
                        color={AppStyles.color.white}
                        fontFamily={AppStyles.fontName.poppinsSemiBold}>
                        {user.following || 0}
                      </VUText>
                      <VUText
                        fontSize={12}
                        fontFamily={AppStyles.fontName.poppins}
                        color={AppStyles.color.white}>
                        Following
                      </VUText>
                    </VUTouchableOpacity>
                  </VUView>
                  <VUView alignItems="center">
                    <VUTouchableOpacity
                      alignItems="center"
                      onPress={handleOnFollowingPressed.bind(
                        this,
                        ConnectionTab.Followers,
                      )}>
                      <VUText
                        fontSize={16}
                        color={AppStyles.color.white}
                        fontFamily={AppStyles.fontName.poppinsSemiBold}>
                        {user.followers || 0}
                      </VUText>

                      <VUText
                        fontSize={12}
                        fontFamily={AppStyles.fontName.poppins}
                        color={AppStyles.color.white}>
                        Followers
                      </VUText>
                    </VUTouchableOpacity>
                  </VUView>
                  <VUView alignItems="center">
                    {/* <Title>{user.videos || 0}</Title>
                    <VUText>Videos</VUText> */}
                  </VUView>
                </VUView>
              </VUView>
            </VUView>
          </VUView>

          {/* {currentUser.id === user.id && (
            <VUView
              my={1}
              mb={2}
              pb={2}
              flexDirection="row"
              width="100%"
              justifyContent="center">
              {loading ? (
                <ActivityIndicator animating={loading} />
              ) : (
                  <VUTouchableOpacity
                    onPress={handleEditProfile}
                    px={3}
                    py={2}
                    borderWidth={1}
                    borderColor="#E9326D"
                    borderRadius={30}
                    width="90%">
                    <VUText color="#E9326D" textAlign="center">
                      Edit Profile
                  </VUText>
                  </VUTouchableOpacity>
                )}
            </VUView>
          )} */}
          {currentUser.id !== user.id && (
            <>
              <VUView
                mt={3}
                pb={2}
                flexDirection="row"
                width="100%"
                justifyContent="center"
                alignItems="center">
                {loading ? (
                  <ActivityIndicator animating={loading} />
                ) : userFollowing ? (
                  <VUTouchableOpacity
                    onPress={handleOnUnfollowPressed}
                    px={3}
                    py={1}
                    borderWidth={1}
                    borderColor={AppStyles.color.white}
                    borderRadius={24}>
                    <VUText color={AppStyles.color.white}>Unfollow</VUText>
                  </VUTouchableOpacity>
                ) : (
                  <VUTouchableOpacity
                    onPress={handleOnFollowPressed}
                    px={3}
                    py={1}
                    borderWidth={1}
                    borderColor={AppStyles.color.white}
                    borderRadius={24}>
                    <VUText color={AppStyles.color.white}>Follow</VUText>
                  </VUTouchableOpacity>
                )}
              </VUView>
            </>
          )}
        </VUView>
        <VUView flexDirection="row" width="100%">
          <VUTouchableOpacity
            flex={1}
            borderBottomWidth={2}
            borderBottomColor={
              tab === ProfileTabs.Feeds ? AppStyles.color.white : '#878080'
            }
            pb={2}
            onPress={handleOnTabChange.bind(this, ProfileTabs.Feeds)}>
            <VUView
              flexDirection="row"
              justifyContent="center"
              alignItems="center">
              <FontAwesome5Icon
                name="th"
                size={24}
                color={
                  tab === ProfileTabs.Feeds ? AppStyles.color.white : '#878080'
                }
              />
              <VUText
                fontSize={16}
                ml={1}
                fontFamily={AppStyles.fontName.poppins}
                color={
                  tab === ProfileTabs.Feeds ? AppStyles.color.white : '#878080'
                }>
                ({myVideosFeeds.length})
              </VUText>
            </VUView>
          </VUTouchableOpacity>
          <VUTouchableOpacity
            flex={1}
            pb={2}
            borderBottomWidth={2}
            borderBottomColor={
              tab === ProfileTabs.Competitions
                ? AppStyles.color.white
                : '#878080'
            }
            alignItems="center"
            onPress={handleOnTabChange.bind(this, ProfileTabs.Competitions)}>
            <VUView
              flexDirection="row"
              justifyContent="center"
              alignItems="center">
              {tab === ProfileTabs.Competitions ? (
                <Award
                  size={28}
                  color={
                    tab === ProfileTabs.Competitions
                      ? AppStyles.color.white
                      : '#878080'
                  }
                />
              ) : (
                <AwardGray size={28} />
              )}
              <VUText
                fontSize={16}
                ml={1}
                fontFamily={AppStyles.fontName.poppins}
                color={
                  tab === ProfileTabs.Competitions
                    ? AppStyles.color.white
                    : '#878080'
                }>
                ({myCompetitionsVideo.length})
              </VUText>
            </VUView>

            {/* <FontAwesome5Icon
              name="award"
              size={24}
              color={tab === ProfileTabs.Competitions ? AppStyles.color.btnColor : '#878080'}
            /> */}
          </VUTouchableOpacity>
          <VUTouchableOpacity
            flex={1}
            pb={2}
            borderBottomWidth={2}
            borderBottomColor={
              tab === ProfileTabs.Certificates
                ? AppStyles.color.white
                : '#878080'
            }
            alignItems="center"
            onPress={handleOnTabChange.bind(this, ProfileTabs.Certificates)}>
            <VUView
              flexDirection="row"
              justifyContent="center"
              alignItems="center">
              {tab === ProfileTabs.Certificates ? (
                <ProfileImg
                  size={28}
                  color={
                    tab === ProfileTabs.Certificates
                      ? AppStyles.color.white
                      : '#878080'
                  }
                />
              ) : (
                <ProfileGray size={28} />
              )}
              <VUText
                fontSize={16}
                ml={1}
                fontFamily={AppStyles.fontName.poppins}
                color={
                  tab === ProfileTabs.Certificates
                    ? AppStyles.color.white
                    : '#878080'
                }>
                ({certificates.length})
              </VUText>
            </VUView>

            {/* <FontAwesome5Icon
              name="award"
              size={24}
              
              color={tab === ProfileTabs.Certificates ? AppStyles.color.white : '#878080'}
            /> */}
          </VUTouchableOpacity>
        </VUView>
        {tab === ProfileTabs.Feeds && (
          <VUView flex={1} flexDirection="column">
            {loading ? (
              <ActivityIndicator animating={true} />
            ) : myVideosFeeds.length > 0 || localFeedLsit.length > 0 ? (
              <VUScrollView flex={1}>
                <VUView
                  flex={1}
                  flexDirection="row"
                  flexWrap="wrap"
                  justifyContent="flex-start">
                  {currentUser.id === user.id
                    ? localFeedLsit.map(item => renderLocalUri(item))
                    : null}
                  {myVideosFeeds.map((item, index) => renderImage(item, index))}

                  {/* <MasonryList
                  spacing={0.1}
                  columns={3}
                  onPressImage={handleImagePressed}
                  images={myVideosFeeds}
                /> */}
                </VUView>
              </VUScrollView>
            ) : (
              <VUView
                justifyContent="center"
                flex={1}
                alignItems="center"
                width="100%">
                <VUText color="#888" fontSize={14} fontWeight="100">
                  No vides uploaded yet.
                </VUText>
              </VUView>
            )}
          </VUView>
        )}
        {tab === ProfileTabs.Competitions && (
          <VUView flex={1} flexDirection="column">
            {loading ? (
              <ActivityIndicator animating={true} />
            ) : competitions.length > 0 ? (
              <VUScrollView flex={1}>
                <VUView
                  flex={1}
                  flexDirection="row"
                  flexWrap="wrap"
                  justifyContent="flex-start">
                  {myCompetitionsVideo.map((item, index) =>
                    renderCompetitionsImage(item, index),
                  )}
                </VUView>
              </VUScrollView>
            ) : (
              <VUView
                justifyContent="center"
                flex={1}
                alignItems="center"
                width="100%">
                <VUText color="#888" fontSize={14} fontWeight="100">
                  No competitions videos uploaded yet.
                </VUText>
              </VUView>
            )}
          </VUView>
        )}
        {/* {tab === ProfileTabs.Competitions && (
          <VUView flex={1} flexDirection="column">
            {loading ? (
              <ActivityIndicator animating={true} />
            ) : competitions.length > 0 ? (
              <VUScrollView flex={1}>
                <VUView
                  flex={1}
                  flexDirection="row"
                  flexWrap="wrap"
                  justifyContent="flex-start">
                  {myCompetitionsVideo.map((item,index) =>
                    renderCompetitionsImage(item,index),
                  )}
                </VUView>
              </VUScrollView>
            ) : (
              <VUView
                justifyContent="center"
                flex={1}
                alignItems="center"
                width="100%">
                <VUText color="#888" fontSize={14} fontWeight="100">
                  No competitions videos uploaded yet.
                </VUText>
              </VUView>
            )}
          </VUView>
        )} */}
        {tab === ProfileTabs.Certificates && (
          <VUView flex={1} flexDirection="column">
            {currentUser.id === user.id &&
              (loading ? (
                <ActivityIndicator animating={loading} />
              ) : (
                <VUView p={2}>
                  <VUTouchableOpacity onPress={handleUploadCertificates}>
                    <VUImage
                      width={40}
                      height={40}
                      resizeMode="contain"
                      source={require('src/../assets/photo.png')}
                    />
                  </VUTouchableOpacity>
                </VUView>
              ))}

            {certificates.length > 0 ? (
              <VUView flex={1}>
                <GridImageView data={certificates} />
              </VUView>
            ) : (
              <VUView
                justifyContent="center"
                flex={1}
                alignItems="center"
                width="100%">
                <VUText color="#888" fontSize={14} fontWeight="100">
                  No Images uploaded
                </VUText>
              </VUView>
            )}
          </VUView>
        )}
      </VUView>
    </SafeAreaView>
  );
};

export default Profile;
