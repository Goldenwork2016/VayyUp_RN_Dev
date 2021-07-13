import React, {useState, useEffect, useRef} from 'react';
import {Platform, Dimensions, Image, Alert, ScrollView} from 'react-native';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import firebase from '@react-native-firebase/app';
import {useNavigation} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';
import {setMyLocalVideos} from 'src/redux/reducers/video.actions';
import {AppStyles} from 'src/AppStyles';
import Toast from 'react-native-simple-toast';
import {
  insertVideo as insertVideoOnSQL,
  getVideosList,
  updateVideo,
  deleteVideo,
  updateSyncedVideo,
} from '../../models/queries';
import {
  SafeAreaView,
  View,
  VUView,
  VUText,
  VUVideo,
  TextInput,
  ActivityIndicator,
  VUTouchableOpacity,
  KeyboardAvoidingView,
  KeyboardAvoidingViewWrapper,
  Overlay,
  VUImage,
  VUTextInput,
} from 'common-components';
import {RNFFmpeg, RNFFmpegConfig} from 'react-native-ffmpeg';
var RNFS = require('react-native-fs');
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {FontAwesomeIcon, IonIcon} from 'src/icons';
import PushNotification from 'react-native-push-notification';

const watermarkURL =
  'https://firebasestorage.googleapis.com/v0/b/vayyup-app.appspot.com/o/vayy-up.png?alt=media&token=9c319671-021a-43e3-ba45-a281d7094cb6';

const EnterDetails = ({
  karaokeVideo,
  video,
  competition,
  lagTime,
  type,
  uploadVideo,
  onCancel,
  karaokeType,
}) => {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [finalVideo, setFinalVideo] = useState();
  const [processingVideo, setProcessingVideo] = useState(false);
  const [showDescription, setShowDescription] = useState(true);
  const [startSync, setStartSync] = useState(false);
  const [isDraft, setIsDraft] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const {
    id,
    title: competitionTitle,
    description,
    startDateTime,
    endDateTime,
  } = competition;
  const user = useSelector(state => state.auth.user);
  const navigation = useNavigation();
  const videoPlayer = useRef(null);
  const dispatch = useDispatch();
  let insertId;
  useEffect(() => {
    if (startSync) {
      const processVideo = async () => {
        setProcessingVideo(true);
        const finalMP4FileName = `final-${new Date().getTime()}.mp4`;
        const finalMP4Location = `${RNFS.CachesDirectoryPath}/Camera/${finalMP4FileName}`;

        const watermarkOption =
          '[2:v]format=rgba,colorchannelmixer=aa=0.5[fg];[0][fg]overlay=main_w-overlay_w-80:100[c]';

        const disableLag = 0;
        // Mixing of audio and video.
        if (type === 'karaoke') {
          if (karaokeType == true) {
            let inputFiles = `-i ${video.uri} -ss ${lagTime} -i ${karaokeVideo.audio} -i ${watermarkURL}`;
            const mixingOptions =
              '[0]volume=1[a];[1]volume=0.5[b];[a][b]amix=duration=shortest[d];';
            RNFFmpeg.executeAsync(
              `${inputFiles} -preset ultrafast -filter_complex "${mixingOptions}${watermarkOption}" -map [c]:v -map [d] -c:v libx264  ${finalMP4Location}`,
              completedExecution => {
                if (completedExecution.returnCode === 0) {
                  setFinalVideo(finalMP4Location);
                  // onVideoSyncSuccess(finalMP4Location);
                  handleUploadVideo(finalMP4Location);
                } else {
                  Alert.alert('Video syncing process is failed,');
                  updateVideo(insertId, 'Failed');
                  dispatchLocalVideos();
                  Toast.show('Video Syncing Failed', Toast.LONG);
                }
              },
            ).then(executionId => {
              onVideoSyncStarted(executionId, finalMP4Location);
            });
          } else {
            setFinalVideo(video.uri.replace('file://', ''));
            onVideoSyncStarted(
              'unpluggedvideo',
              video.uri.replace('file://', ''),
            );
          }
        } else {
          let inputFiles = `-i ${video.uri} -i ${karaokeVideo.audio} -i ${watermarkURL}`;
          RNFFmpeg.executeAsync(
            `${inputFiles} -shortest -preset ultrafast -filter_complex "${watermarkOption}" -map [c]:v -map 0:v:0 -map 1:a:0 -c:v libx264 ${finalMP4Location}`,
            completedExecution => {
              if (completedExecution.returnCode === 0) {
                setFinalVideo(finalMP4Location);
                handleUploadVideo(finalMP4Location)
                // onVideoSyncSuccess(finalMP4Location);
              } else {
                Alert.alert('Video syncing process is failed,');
                updateVideo(insertId, 'Failed');
                dispatchLocalVideos();
                Toast.show('Video Syncing Failed', Toast.LONG);
              }
            },
          ).then(async executionId => {
            onVideoSyncStarted(executionId, finalMP4Location);
          });
        }
        // setProcessingVideo(false);
      };
      const onVideoSyncStarted = async (executionId, finalMP4Location) => {
        await insertVideo(finalMP4Location, video.uri, 'Syncing');
        if (executionId === 'unpluggedvideo') {
          handleUploadVideo(finalMP4Location);
        }
        // Alert.alert(
        //   'Video is syncing...',
        //   'Until video syncing sit back, relax and scroll vayyup..',
        //   [
        //     {
        //       text: 'Ok',
        //       onPress: () => {
        //         navigation.popToTop();
        //       },
        //     },
        //   ],
        // );
        navigation.navigate('Success');
      };
      const onVideoSyncSuccess = finalMP4Location => {
        Alert.alert(
          'Preview video',
          'Video syncing completed, Do you wanna to preview?',
          [
            {
              text: 'Preview',
              onPress: () =>
                navigation.navigate('Preview', {
                  finalVideo: finalMP4Location,
                  videoUri: video.uri,
                  user,
                  title,
                  description,
                  startDateTime,
                  endDateTime,
                  competitionId: id,
                  insertId,
                }),
            },
          ],
        );
      };
      const watermarkVideo = async () => {
        const {path = ''} = video;
        const sourceVideo = path.replace('file://', '');
        const finalMP4FileName = `final-${new Date().getTime()}.mp4`;

        const watermarkedMP4Location = `${RNFS.CachesDirectoryPath}/Camera/watermarked-${finalMP4FileName}`;
        const overlay =
          '[1:v]format=rgba,colorchannelmixer=aa=0.7[fg];[fg][0:v]scale2ref=w="iw*25/100":h="ow/mdar"[wm][vid];[vid][wm]overlay=main_w-overlay_w-20:100';

        await RNFFmpeg.execute(
          `-i ${sourceVideo} -i ${watermarkURL} -preset ultrafast -filter_complex "${overlay}" ${watermarkedMP4Location}`,
        );

        setFinalVideo(watermarkedMP4Location);
        setProcessingVideo(false);
      };
      if (uploadVideo) {
        const {path = ''} = video;
        setFinalVideo(path.replace('file://', ''));
        insertVideo(path.replace('file://', ''), video.uri, 'Syncing');
        handleUploadVideo(path.replace('file://', ''));
        // writeOnVideoDatabase({
        //   finalVideo,
        //   videoUri: video.uri,
        //   user,
        //   title,
        //   description,
        //   startDateTime,
        //   endDateTime,
        //   competitionId: id,
        // });
        // console.log("OpenDatabaseAndReadData", openVideoDatabase());
        setProcessingVideo(false);
        navigation.navigate('Success');
      } else {
        processVideo();
      }
    } else {
      setShowDescription(true);
    }
  }, [
    video.uri,
    karaokeVideo.audio,
    lagTime,
    type,
    uploadVideo,
    video,
    startSync,
  ]);
  const insertVideo = async(finalVideo, videoUri, status) => {
    const{id, fullname, profile=""} = user
    let insertResult = await insertVideoOnSQL({
      finalVideo,
      videoUri,
      userId: id,
      user_name: fullname,
      user_profile: profile,
      title,
      description,
      startDateTime:"",
      endDateTime:"",
      competitionId: id,
      status,
      type: id ? 'competition' : 'feed',
    });
    insertId =  insertResult.insertId
    Toast.show('Video Syncing...', Toast.LONG);
    dispatchLocalVideos();
  };
  const handleCancelVideo = async () => {
    onCancel();
  };

  const getPercentage = (ratio) => Math.round(ratio * 100);
  const handleUploadVideo = async (finalMP4Location) => {
    updateSyncedVideo(insertId,'Synced', finalMP4Location)
    Toast.show('Video Started uploading', Toast.LONG);
    dispatchLocalVideos();
    // setUploading(true);
    // setPreviewPlaying(false);
    const filename = finalMP4Location.split('/').pop();
    const filePath = `videos/${user.id}/${filename}`;
    const reference = storage()
      .ref()
      .child(filePath);
    var UploadStarted = false;

    reference.putFile(`file://${finalMP4Location}`).on(
      storage.TaskEvent.STATE_CHANGED,
      async snapshot => {
        setProgress(
          getPercentage(snapshot.bytesTransferred / snapshot.totalBytes),
        );
        if (snapshot.state === storage.TaskState.SUCCESS && !UploadStarted) {
          UploadStarted = true;
          const url = await reference.getDownloadURL().catch(error => {
            console.log(error);
          });

          if (!uploadVideo) {
            // Clean up cache
            RNFS.unlink(video.uri);
            RNFS.unlink(finalMP4Location);
          }

          const {fullname = '', profile = '', location = ''} = user;
          const collectionName = id ? 'entries' : 'videos';
          const document = {
            video: filePath,
            videoFileName: filename,
            url: url,
            votes: 0,
            uid: user.id,
            watermarked: !uploadVideo,
            title,
            user: {
              name: fullname,
              profile: profile,
              location: location,
            },
            isPublished: !isDraft,
            date: firebase.firestore.FieldValue.serverTimestamp(),
          };
          // Add competition details, if it is for competition
          if (id) {
            document.competition = {
              title,
              description,
              startDateTime,
              endDateTime,
            };
            document.competitionId = id;
          }
          deleteVideo(insertId);
          Toast.show('Video uploaded successfully', Toast.LONG);
          dispatchLocalVideos();
          await firestore()
            .collection(collectionName)
            .add(document);
          // setUploading(false);
          // navigation.navigate('VideoSubmitted', {id});
        }
      },
      function(error) {
        // insertVideo(finalMP4Location, video.uri,"failed")
        updateVideo(insertId, 'Failed')
        Toast.show('Uploading a video failed', Toast.LONG);
        dispatchLocalVideos();
      },
    );
  };
  const dispatchLocalVideos = async () => {
    dispatch(setMyLocalVideos(await getVideosList()));
  };
  const handleClose = () => {
    navigation.popToTop();
  };
  const handleSyncVideo = async isDraft => {
    setIsDraft(isDraft);
    setProcessingVideo(true);
    setShowDescription(false);
    setStartSync(true);
    // processVideo();
  };
  const handleTogglePlaying = () => {
    setPreviewPlaying(!previewPlaying);
  };
  const handlePreviewEnded = () => {
    setPreviewPlaying(false);
  };

  let videoSource = {};
  if (uploadVideo) {
    const {path = ''} = video;
    videoSource = {
      uri: path,
      codec: 'mp4',
    };
  } else {
    videoSource = {
      uri: finalVideo ? `file://${finalVideo}` : video.uri,
      codec: 'mp4',
    };
  }
  if (showDescription) {
    return (
      <SafeAreaView flex={1} bg={AppStyles.color.bgColor}>
        <KeyboardAvoidingView
          flex={1}
          behavior={Platform.OS == 'ios' ? 'padding' : 'enabled'}>
          <ScrollView flex={1}>
            <VUView>
              <VUView flexDirection="row" justifyContent="flex-end" p={2}>
                <VUTouchableOpacity onPress={handleClose}>
                  <IonIcon
                    bold
                    name="close"
                    size={34}
                    color={AppStyles.color.btnColor}
                  />
                </VUTouchableOpacity>
              </VUView>
              <VUView>
                <VUText
                  fontSize={18}
                  fontFamily={AppStyles.fontName.poppinsBold}
                  color={AppStyles.color.btnColor}
                  textAlign="center">
                  Prepare for submission
                </VUText>
              </VUView>
              <VUView style={{margin: 12}}>
                <View
                  style={{
                    width: '100%',
                    height: 450,
                    borderRadius: 4,
                  }}>
                  <VUVideo
                    flex={1}
                    ref={videoPlayer}
                    source={videoSource}
                    volume={10}
                    width="100%"
                    height={450}
                    resizeMode="cover"
                    repeat={true}
                    paused={true}
                  />
                </View>
                <VUView>
                  <VUTextInput
                    borderBottomColor={AppStyles.color.white}
                    borderBottomWidth={1}
                    py={2}
                    px={3}
                    p={1}
                    color={AppStyles.color.white}
                    onChangeText={text => setTitle(text)}
                    value={title}
                    placeholder="Write a caption"
                    placeholderTextColor={AppStyles.color.white}
                    maxLength={50}
                    mt={20}
                  />
                </VUView>
              </VUView>
              <VUView
                bottom={0}
                left={0}
                flex={1}
                width="100%"
                mt={20}
                flexDirection="row"
                justifyContent="space-evenly"
                alignItems="center">
                <VUTouchableOpacity
                  onPress={() => {
                    handleSyncVideo(true);
                  }}
                  px={3}
                  py={2}
                  mb={3}
                  ml={2}
                  width="40%"
                  borderWidth={2}
                  borderColor={AppStyles.color.btnColor}
                  borderRadius={24}>
                  <VUText
                    fontFamily={AppStyles.fontName.poppinsBold}
                    color={AppStyles.color.btnColor}
                    textAlign="center">
                    Draft
                  </VUText>
                </VUTouchableOpacity>
                <VUTouchableOpacity
                  onPress={() => {
                    handleSyncVideo(false);
                  }}
                  px={3}
                  py={2}
                  mb={3}
                  ml={2}
                  width="40%"
                  backgroundColor={AppStyles.color.btnColor}
                  borderWidth={2}
                  borderColor={AppStyles.color.btnColor}
                  borderRadius={24}>
                  <VUText
                    fontFamily={AppStyles.fontName.poppinsBold}
                    color="#fff"
                    textAlign="center">
                    Post
                  </VUText>
                </VUTouchableOpacity>
              </VUView>
            </VUView>
            {uploading && (
              <VUView
                position="absolute"
                top={0}
                bottom={0}
                left={0}
                right={0}
                flex={1}
                justifyContent="center"
                alignItems="center"
                bg="rgba(0,0,0,0.8)">
                <VUText color="#ccc" my={3}>
                  Uploading
                </VUText>
                <AnimatedCircularProgress
                  size={120}
                  width={8}
                  fill={progress}
                  tintColor="#E9326D"
                  backgroundColor="#3d5875"
                />
              </VUView>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
  if (processingVideo || loading) {
    return (
      <VUView bg="#000" flex={100}>
        <Overlay>
          <VUText color="#ccc">Syncing Video and Audio</VUText>
          <ActivityIndicator animating={processingVideo || loading} />
        </Overlay>
      </VUView>
    );
  }

  return (
    <SafeAreaView flex={1}>
      <KeyboardAvoidingViewWrapper>
        <KeyboardAvoidingView flex={1}>
          {/* <VUView flex={1} justify="space-between">
            {competition && (
              <VUView alignItems="center">
                <VUText color="#000" fontSize={14} fontWeight="bold">
                  {competitionTitle}
                </VUText>
              </VUView>
            )}
            <View flex={1}>
              <VUTouchableOpacity flex={1} onPress={handleTogglePlaying}>
                <View flex={1}>
                  <VUVideo
                    flex={1}
                    ref={videoPlayer}
                    source={videoSource}
                    volume={10}
                    resizeMode="cover"
                    repeat={true}
                    onEnd={handlePreviewEnded}
                    paused={!previewPlaying}
                  />
                  <VUView
                    position="absolute"
                    width="100%"
                    alignItems="center"
                    justifyContent="center"
                    flex={1}
                    top={0}
                    bottom={0}>
                    {!previewPlaying && (
                      <FontAwesomeIcon name="play" size={36} />
                    )}
                  </VUView>
                </View>
              </VUTouchableOpacity>
            </View>
            <View padding={10}>
              
              {!loading && (
                <VUView
                  flexDirection="row"
                  justifyContent="space-around"
                  my={2}>
                  <VUTouchableOpacity
                    borderWidth={2}
                    borderColor="#E9326D"
                    alignItems="center"
                    px={4}
                    py={1}
                    borderRadius={25}
                    onPress={handleCancelVideo}>
                    <VUText color="#E9326D">Cancel</VUText>
                  </VUTouchableOpacity>
                  <VUTouchableOpacity
                    borderWidth={2}
                    borderColor="#E9326D"
                    alignItems="center"
                    px={4}
                    py={1}
                    borderRadius={25}
                    onPress={handleUploadVideo}>
                    <VUText color="#E9326D">Submit</VUText>
                  </VUTouchableOpacity>
                </VUView>
              )}
            </View>
          </VUView> */}
          {uploading && (
            <VUView
              position="absolute"
              top={0}
              bottom={0}
              left={0}
              right={0}
              flex={1}
              justifyContent="center"
              alignItems="center"
              bg="rgba(0,0,0,0.8)">
              <VUText color="#ccc" my={3}>
                Uploading
              </VUText>
              <AnimatedCircularProgress
                size={120}
                width={8}
                fill={progress}
                tintColor="#E9326D"
                backgroundColor="#3d5875"
              />
            </VUView>
          )}
        </KeyboardAvoidingView>
      </KeyboardAvoidingViewWrapper>
    </SafeAreaView>
  );
};

export default EnterDetails;
