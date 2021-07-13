import React, {memo, useEffect, useState, useRef} from 'react';
import {
  Platform,
  TouchableOpacity,
  StyleSheet,
  PermissionsAndroid,
  View,
  Alert,
} from 'react-native';
import {useSelector} from 'react-redux';
import Share from 'react-native-share';
import {useNavigation} from '@react-navigation/core';
import Toast from 'react-native-simple-toast';
import {numFormatter} from 'src/services/numFormatter'
import { FontAwesomeIcon, FeatherIcon } from 'src/icons';
import { AntDesignIcon } from 'src/icons';
import { IonIcon } from 'src/icons';
import { FontAwesome5Icon } from 'src/icons';
import { followUser, unfollowUser } from 'src/services/social';
import firebase from '@react-native-firebase/app';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import CameraRoll from '@react-native-community/cameraroll';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {
  VUView,
  VUText,
  VUImage,
  VUVideo,
  VUTouchableOpacity,
  Overlay,
  ActivityIndicator,
  PLAYER_STATES,
} from 'common-components';
import ActionSheet from 'react-native-actions-sheet';

import {
  Header,
  Controls,
  Actions,
  BoxAction,
  TextAction,
  ContentWrapper,
} from './styles';
import RNFetchBlob from 'rn-fetch-blob';
import {asin} from 'react-native-reanimated';
var RNFS = require('react-native-fs');
import {AppStyles} from 'src/AppStyles';
import Thumbs from 'common-components/icons/Thumbs';
import ThumbsRed from 'common-components/icons/ThumbsRed';

interface Item {
  id: number;
  username: string;
  tags: string;
  music: string;
  likes: number;
  comments: number;
  uri: string;
}

function Feed({
  onVoting,
  onUnvoting,
  onFlag,
  item,
  index,
  focused,
  active,
  load,
  type,
  isMyVideos,
  onCommenting,
  onDelete,
  OnViewCount,
}) {
  const [loading, setLoading] = useState(false);
  const [votes, setVotes] = useState(item.votes);
  const [viewCount, setViewCount] = useState(item.views);
  const insets = useSafeAreaInsets();
  const [voted, setVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [countStatus, setCountStatus] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const muted = useSelector(state => state.settings.muted);
  const reactions = useSelector(state =>
    type === 'competition' || type === 'myCompetitionVideos'
      ? state.feeds.reactions
      : state.videos.reactions,
  );
  active = useSelector(({videos}) => videos.active.id === item.id);
  const [userFollowing, setUserFollowing] = useState(false);
  const [users, setUsers] = useState({});
  const [currentUser, following] = useSelector(state => [
    state.auth.user,
    state.social.following,
  ]);

  const {url, thumbnail, playback = {}, video, videoFileName} = item;
  const {hls, dash} = playback;
  let videoURL = {uri: url};
  if (Platform.OS === 'ios' && hls) {
    videoURL = {uri: hls, type: 'm3u8'};
  }
  if (Platform.OS === 'android' && dash) {
    videoURL = {uri: dash, type: 'mpd'};
  }

  const navigation = useNavigation();
  const {user = {}} = item;

  // Video Player Control
  const videoPlayer = useRef(null);
  const [paused, setPaused] = useState(false);
  const [playerState, setPlayerState] = useState(PLAYER_STATES.PLAYING);
  const [reported, setReported] = useState(false);
  const actionSheetRef = useRef();

  const onPaused = ps => {
    //Handler for Video Pause
    if (paused && playerState === PLAYER_STATES.ENDED) {
      videoPlayer.current.seek(0);
    } else {
      setPaused(!paused);
    }
    setPlayerState(paused ? PLAYER_STATES.PLAYING : PLAYER_STATES.PAUSED);
  };

  const onEnd = () => setPlayerState(PLAYER_STATES.ENDED);

  useEffect(async () => {
    await initialLoading();
  }, [reactions, type, item.id]);

  const initialLoading = async () => {
    if (type === 'competition' || type === 'myCompetitionVideos') {
      const reaction = reactions.find(obj => obj.entryId === item.id);
      await firestore()
        .collection('entries')
        .doc(item.id)
        .get()
        .then(obj => {
          if (obj.exists) {
            const entry = obj.data();
            setVotes(entry.votes);
            setViewCount(entry.views != undefined ? entry.views : 0);
            setVoting(false);
          }
        });
      setVoted(reaction !== undefined);
    } else {
      const reaction = reactions.find(obj => obj.videoId === item.id);
      await firestore()
        .collection('videos')
        .doc(item.id)
        .get()
        .then(obj => {
          const entry = obj.data();
          setVotes(entry.votes || 0);
          setViewCount(entry.views != undefined ? entry.views : 0);
          setVoting(false);
        });
      setVoted(reaction !== undefined);
    }
    firestore();
  };
  const handleVoting = async () => {
    setVoting(true);
    if (!voted) {
      await onVoting(item, index);
    } else {
      await onUnvoting(item, index);
    }

    // setTimeout(() => setVoting(false), 3000);
  };
  const handleProgress = async progress => {
    if (countStatus == true) {
      setCountStatus(false);
      await OnViewCount(item, index);
      await initialLoading();
    }
  };

  const handleLoad = async progress => {
    setCountStatus(true);
  };

  const onBuffer = onBufferData =>{
    console.log("onBufferData",onBufferData);
  }
  const onError = onErrorData =>{
    console.log("onErrorData",onBufferData);
  }
  const handleChat = async () => {
    if (onCommenting) {
      await onCommenting();
    }
    navigation.navigate('Comment', {type, item, index});
  };

  const handleSocialShare = async () => {
    const routeType =
      type === 'competition' || 'myCompetitionVideos' ? 'entries' : 'videos';
    const link = await firebase.dynamicLinks().buildShortLink({
      link: `http://vayyup.com/${routeType}/${item.id}`,
      domainUriPrefix: 'https://vayyup.page.link',
      social: {
        title:
          type === 'competition' || type === 'myCompetitionVideos'
            ? item.competition.title
            : item.title,
        imageUrl: item.thumbnail,
      },
    });
    console.log('Link', link);
    share(link);
    // const routeType = type === 'competition' ? 'entries' : 'videos';
    // RNFetchBlob.fetch('GET', item.thumbnail)
    //   .then(resp => {
    //     let base64image = resp.data;

    //     share('data:image/png;base64,' + base64image, routeType);
    //   })
    //   .catch(err => console.log(err));
  };
  const share = async link => {
    const options = {
      url: link,
    };
    Share.open(options)
      .then(res => {})
      .catch(err => {
        err && console.log(err);
      });
  };

  const handleOnFlag = async () => {
    setReported(false);
    actionSheetRef.current?.setModalVisible();
  };

  const handleOnSpam = reportType => {
    firestore()
      .collection('reports')
      .doc()
      .set({
        id: item.id,
        collectionName:
          type === 'competition' || type === 'myCompetitionVideos'
            ? 'entries'
            : 'videos',
        reportedUser: firebase.auth().currentUser.uid,
        itemUser: item.uid,
        type: reportType,
        date: firebase.firestore.FieldValue.serverTimestamp(),
      });
    setReported(true);
  };

  const handleUserProfilePressed = async () => {
    navigation.navigate('UserProfile', {
      user: {...user, id: item.uid},
      showBack: true,
    });
  };
  const handleOnFollowPressed = async () => {
    const user = {...item.user, id: item.uid};
    const {
      id: userId = '',
      name: userFullname = '',
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
    // setFollowLoading(false);
  };

  const handleOnUnfollowPressed = () => {
    const user = {...item.user, id: item.uid};
    const {
      id: userId = '',
      name: userFullname = '',
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
  };

  async function hasAndroidPermission() {
    const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

    const hasPermission = await PermissionsAndroid.check(permission);
    if (hasPermission) {
      return true;
    }

    const status = await PermissionsAndroid.request(permission);
    return status === 'granted';
  }

  const handleOnDownload = async () => {
    if (Platform.OS === 'android' && !(await hasAndroidPermission())) {
      return;
    }
    setDownloading(true);
    // Currently we don't use any other format.
    try {
      const path = `${RNFS.CachesDirectoryPath}/${videoFileName}`;
      const reference = storage().ref(video);
      await reference.writeToFile(path);
      await CameraRoll.save(path, {type: 'video'});
      Toast.show('Video saved into gallery.', Toast.LONG);
    } catch (error) {}
    setDownloading(false);
  };
  const handleOnDeleteAlert = () => {
    Alert.alert('', 'Are you sure you want to delete? ', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {text: 'OK', onPress: () => handleOnDelete()},
    ]);
  };
  const handleOnDelete = async () => {
    setDeleting(true);
    await firestore()
      .collection('videos')
      .doc(item.id)
      .delete();
    setTimeout(() => {
      setDeleting(false);
      onDelete();
      Toast.show('Video deleted successfully.', Toast.LONG);
    }, 5000);
  };

  console.log("active",active,"item.id",item.id);
  if (loading) {
    return (
      <Overlay>
        <ActivityIndicator />
      </Overlay>
    );
  }

  if (!focused || !active) {
    return (
      <VUView flex={1}>
        <ContentWrapper>
          <VUImage
            source={{uri: thumbnail}}
            height="100%"
            width="100%"
            resizeMode="cover"
          />
        </ContentWrapper>
      </VUView>
    );
  }

  return (
    <VUView flex={1}>
      <ContentWrapper>
        <>
          <TouchableOpacity
            activeOpacity={1}
            style={[StyleSheet.absoluteFill]}
            onPress={onPaused}>
            {focused &&
              (active ? (
                <VUVideo
                  flex={1}
                  ref={videoPlayer}
                  onEnd={onEnd}
                  poster={thumbnail}
                  posterResizeMode={'cover'}
                  paused={paused}
                  muted={muted}
                  onProgress={handleProgress}
                  onLoad={handleLoad}
                  source={videoURL}
                  volume={10}
                  repeat={true}
                  resizeMode={'cover'}
                  onBuffer={onBuffer}
                  onError={onError}
                  ignoreSilentSwitch="ignore"
                />
              ) : (
                <VUImage
                  source={{uri: thumbnail}}
                  height="100%"
                  width="100%"
                  resizeMode="cover"
                />
              ))}

            {/* <VUView
                alignItems="center"
                justifyContent="flex-start"
                position="absolute"
                p={2}
                style={[StyleSheet.absoluteFill]}>
                <VUView flexDirection='row' alignItems='center' justifyContent='center'>
                   <VUText fontFamily={AppStyles.fontName.poppinsBold} letterSpacing={0.5} mr={2} color={AppStyles.color.white} fontSize={14}>Videos for you</VUText>
                   <VUView height={20} width={2} backgroundColor= {AppStyles.color.white} />
                   <VUText fontFamily={AppStyles.fontName.poppins} ml={2} color={"#C4C4C4"} fontSize={14}>Following</VUText>
                </VUView>
              </VUView> */}
            {paused && (
              <VUView
                alignItems="center"
                justifyContent="center"
                position="absolute"
                style={[StyleSheet.absoluteFill]}>
                <AntDesignIcon name={'play'} size={64} color="#bbb" />
              </VUView>
            )}
          </TouchableOpacity>
        </>
        <Header
          right="0px"
          bottom={
            type === 'competition'
              ? '120px'
              : Platform.OS === 'ios'
              ? '120px'
              : '90px'
          }>
          <VUView
            height="100%"
            flexDirection="column"
            justifyContent="space-between">
            {viewCount != undefined && (
              <VUView>
                <BoxAction>
                  <VUImage
                    width={40}
                    height={40}
                    resizeMode="contain"
                    source={require('src/../assets/feed/eye.png')}
                  />
                  <VUView px={10} alignItems="center">
                    <TextAction>{numFormatter(parseInt(viewCount))}</TextAction>
                  </VUView>
                </BoxAction>
              </VUView>
            )}
            {onVoting &&
              (item.isPublished == true ? (
                <VUView>
                  {voting ? (
                    <ActivityIndicator color="#fff" animating={true} />
                  ) : (
                    <BoxAction onPress={handleVoting}>
                      {type === 'competition' ||
                      type === 'myCompetitionVideos' ? (
                        voted ? (
                          <VUImage
                            width={38}
                            height={38}
                            resizeMode="contain"
                            source={require('src/../assets/feed/voteFilled.png')}
                          />
                        ) : (
                          <VUImage
                            width={38}
                            height={38}
                            resizeMode="contain"
                            source={require('src/../assets/feed/vote.png')}
                          />
                        )
                      ) : voted ? (
                        <VUImage
                          width={34}
                          height={34}
                          resizeMode="contain"
                          source={require('src/../assets/feed/heartFilled.png')}
                        />
                      ) : (
                        <VUImage
                          width={34}
                          height={34}
                          resizeMode="contain"
                          source={require('src/../assets/feed/heart.png')}
                        />
                      )}
                      <VUView px={10} alignItems="center">
                        <TextAction>{numFormatter(parseInt(votes))}</TextAction>
                      </VUView>
                    </BoxAction>
                  )}
                </VUView>
              ) : null)}
            {item.isPublished == true ? (
              <BoxAction onPress={handleChat}>
                <VUImage
                  width={34}
                  height={34}
                  resizeMode="contain"
                  source={require('src/../assets/feed/chat.png')}
                />
                <VUView px={10} alignItems="center">
                  <TextAction>{item.comments}</TextAction>
                </VUView>
              </BoxAction>
            ) : null}
            {item.isPublished == true ? (
              <BoxAction onPress={handleSocialShare}>
                <VUImage
                  width={34}
                  height={34}
                  resizeMode="contain"
                  source={require('src/../assets/feed/share.png')}
                />
              </BoxAction>
            ) : null}
            {!isMyVideos && (
              <BoxAction onPress={handleOnFlag}>
                <VUImage
                  width={32}
                  height={32}
                  resizeMode="contain"
                  source={require('src/../assets/feed/report.png')}
                />
              </BoxAction>
            )}

            {isMyVideos && (
              <>
                {downloading ? (
                  <ActivityIndicator color="#fff" animating={true} />
                ) : (
                  <BoxAction onPress={handleOnDownload}>
                    <VUImage
                      width={34}
                      height={34}
                      resizeMode="contain"
                      source={require('src/../assets/feed/downloads.png')}
                    />
                  </BoxAction>
                )}
              </>
            )}

            {isMyVideos && type != 'myCompetitionVideos' && (
              <>
                {deleting ? (
                  <ActivityIndicator color="#fff" animating={true} />
                ) : (
                  <BoxAction onPress={handleOnDeleteAlert}>
                    <VUImage
                      width={34}
                      height={34}
                      resizeMode="contain"
                      source={require('src/../assets/feed/delete.png')}
                    />
                  </BoxAction>
                )}
              </>
            )}
          </VUView>
        </Header>
        <Header
          left="2px"
          bottom={
            type === 'competition'
              ? '95px'
              : Platform.OS === 'ios'
              ? '110px'
              : '70px'
          }
          right="0px">
          <Actions>
            <VUView>
              <VUTouchableOpacity onPress={handleUserProfilePressed}>
                <VUView flexDirection="row" alignItems="center">
                  <VUView mr={2}>
                    {/* <BoxAction > */}
                    {user.profile ? (
                      <VUImage
                        size={40}
                        source={{uri: user.profile}}
                        borderRadius={20}
                      />
                    ) : (
                      <IonIcon
                        name="person-circle-outline"
                        size={50}
                        color="#ffffff"
                      />
                    )}
                  </VUView>
                  <VUView>
                    <VUView flexDirection="row" alignItems="center">
                      <VUText
                        color="#fff"
                        fontSize={14}
                        fontFamily={AppStyles.fontName.poppinsBold}
                        style={{
                          textShadowColor: 'grey',
                          textShadowOffset: {width: 0.5, height: 0.5},
                          textShadowRadius: 1,
                        }}
                        color={AppStyles.color.grayText}>
                        {item.user.name}
                      </VUText>
                      {followLoading ? (
                        <ActivityIndicator color="#E9326D" animating={true} />
                      ) : following.find(obj => obj.id === item.uid) !=
                        undefined ? (
                        <VUTouchableOpacity
                          borderColor={AppStyles.color.btnColor}
                          ml={2}
                          borderWidth={1}
                          borderRadius={24}
                          width={60}
                          height={20}
                          onPress={handleOnUnfollowPressed}>
                          <VUText
                            textAlign="center"
                            fontSize={12}
                            fontFamily={AppStyles.fontName.poppins}
                            color={AppStyles.color.btnColor}>
                            Unfollow
                          </VUText>
                        </VUTouchableOpacity>
                      ) : (
                        <VUTouchableOpacity
                          borderColor={AppStyles.color.btnColor}
                          ml={2}
                          borderWidth={1}
                          borderRadius={24}
                          width={50}
                          height={20}
                          onPress={handleOnFollowPressed}>
                          <VUText
                            textAlign="center"
                            fontSize={12}
                            fontFamily={AppStyles.fontName.poppins}
                            color={AppStyles.color.btnColor}>
                            Follow
                          </VUText>
                        </VUTouchableOpacity>
                      )}
                    </VUView>
                    <VUText
                      fontSize={12}
                      color={AppStyles.color.grayText}
                      style={{
                        textShadowColor: 'grey',
                        textShadowOffset: {width: 0.5, height: 0.5},
                        textShadowRadius: 1,
                      }}>
                      {item.title}
                    </VUText>
                  </VUView>
                </VUView>
              </VUTouchableOpacity>
            </VUView>
          </Actions>
        </Header>
      </ContentWrapper>
      <ActionSheet ref={actionSheetRef}>
        {reported ? (
          <>
            <VUView mt={3} mb={6}>
              <VUView width="100%" my={3}>
                <FontAwesomeIcon name="check" color="#5ea23a" size={24} />
              </VUView>
              <VUView width="100%" alignItems="center">
                <VUText fontWeight="bold">Thanks for letting us know</VUText>
                <VUText my={2} mx={4} textAlign="center" color="#666">
                  Your feedback is important in helping us keep the VayyUp
                  community safe.
                </VUText>
              </VUView>
            </VUView>
          </>
        ) : (
          <>
            <VUView my={3}>
              <VUView
                borderColor="#ccc"
                borderBottomWidth={1}
                width="100%"
                alignItems="center"
                pb={2}>
                <VUText fontSize={18} fontWeight="bold">
                  Report
                </VUText>
              </VUView>
            </VUView>
            <VUView mb={4} px={3} width="100%">
              <VUView mb={3}>
                <VUText color="#999">
                  Your report is anonymous, except if you're reporting an
                  intellectual property infringement. Our team will review your
                  feedback within 24hours and takes appropirate action after it
                  is verified.
                </VUText>
                <VUText color="#999">
                  If someone is in immediate danger, call the local emergency
                  service - don't wait.
                </VUText>
              </VUView>
              <VUView>
                <VUText fontWeight="bold">
                  Why are you reporting this video?
                </VUText>
              </VUView>
              <VUView width="100%" mt={2}>
                <TouchableOpacity onPress={handleOnSpam.bind(this, 'block')}>
                  <VUView
                    width="100%"
                    borderColor="#ccc"
                    py={3}
                    borderTopWidth={1}
                    borderBottomWidth={1}
                    flexDirection="row"
                    justifyContent="space-between">
                    <VUText>Block User</VUText>
                    <FontAwesomeIcon
                      name="chevron-right"
                      color="#666"
                      size={12}
                    />
                  </VUView>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleOnSpam.bind(this, 'spam')}>
                  <VUView
                    width="100%"
                    borderColor="#ccc"
                    py={3}
                    borderBottomWidth={1}
                    flexDirection="row"
                    justifyContent="space-between">
                    <VUText>It's spam</VUText>
                    <FontAwesomeIcon
                      name="chevron-right"
                      color="#666"
                      size={12}
                    />
                  </VUView>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleOnSpam.bind(this, 'inappropriate')}>
                  <VUView
                    width="100%"
                    borderColor="#ccc"
                    py={3}
                    borderBottomWidth={1}
                    flexDirection="row"
                    justifyContent="space-between">
                    <VUText>It's inappropriate</VUText>
                    <FontAwesomeIcon
                      name="chevron-right"
                      color="#666"
                      size={12}
                    />
                  </VUView>
                </TouchableOpacity>
              </VUView>
            </VUView>
          </>
        )}
      </ActionSheet>
    </VUView>
  );
}

export default memo(Feed);
