import React, {useRef, useEffect} from 'react';
import {Platform} from 'react-native';
import { useSelector } from "react-redux";
import {VUView, VUVideo, PrimaryButton,VUTouchableOpacity} from 'common-components';
import { FontAwesomeIcon, EntypoIcon, IonIcon } from 'src/icons';
import { AppStyles } from 'src/AppStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const promoVideos = [
  {
    thumbnail:
      'https://videodelivery.net/15310ecfd2d2957bc1f5bdfcf57fd099/thumbnails/thumbnail.jpg',
    dash: 'https://videodelivery.net/15310ecfd2d2957bc1f5bdfcf57fd099/manifest/video.mpd',
    hls: 'https://videodelivery.net/15310ecfd2d2957bc1f5bdfcf57fd099/manifest/video.m3u8',
  },
  {
    thumbnail:
      'https://videodelivery.net/dd4aca0e8042fab8beed6201fb8dd2c8/thumbnails/thumbnail.jpg',
    dash: 'https://videodelivery.net/dd4aca0e8042fab8beed6201fb8dd2c8/manifest/video.mpd',
    hls: 'https://videodelivery.net/dd4aca0e8042fab8beed6201fb8dd2c8/manifest/video.m3u8',
  },
  {
    thumbnail:
      'https://videodelivery.net/af2caf90a8d39b49782c3877da57ccfb/thumbnails/thumbnail.jpg',
    dash: 'https://videodelivery.net/af2caf90a8d39b49782c3877da57ccfb/manifest/video.mpd',
    hls: 'https://videodelivery.net/af2caf90a8d39b49782c3877da57ccfb/manifest/video.m3u8',
  },
  {
    thumbnail:
      'https://videodelivery.net/431f3f3b86a5c75333c472b2b67260a1/thumbnails/thumbnail.jpg',
    dash: 'https://videodelivery.net/431f3f3b86a5c75333c472b2b67260a1/manifest/video.mpd',
    hls: 'https://videodelivery.net/431f3f3b86a5c75333c472b2b67260a1/manifest/video.m3u8',
  },
];

const PromoVideo = ({onEndVideo}) => {
  const videoPlayer = useRef(null);
  const user = useSelector((state) => state.auth.user);
  const randomIndex = Math.min(Math.floor(Math.random() * 4), 3);
  const {dash, hls} = promoVideos[randomIndex];
  const videoURL = {
    uri: Platform.OS === 'ios' ? hls : dash,
    type: Platform.OS === 'ios' ? 'm3u8' : 'mpd',
  };

  useEffect(async() => {
    const {id, fcmToken: userFcmToken = ""} = user
    const currentFcmToken = await AsyncStorage.getItem('fcmToken');
    if (currentFcmToken !== userFcmToken) {
      await firestore().collection('users').doc(id).update({fcmToken:currentFcmToken});
    }
  }, [])

  return (
    <>
      <VUView flex={1}>
        <VUVideo
          flex={1}
          ref={videoPlayer}
          onEnd={onEndVideo}
          paused={false}
          poster={promoVideos[randomIndex].thumbnail}
          posterResizeMode="cover"
          source={videoURL}
          volume={10}
          resizeMode="cover"
          repeat={false}
          onError={(error) => console.log(error)}
          ignoreSilentSwitch="ignore"
        />
      </VUView>
      <VUView position="absolute"width="100%" alignItems="flex-end" p={2} >
              <VUTouchableOpacity onPress={onEndVideo} mt={Platform.OS === "ios" ? 24 : 0}>
                <IonIcon bold name="close" size={38} color={AppStyles.color.btnColor} />
              </VUTouchableOpacity>
            </VUView>
      {/* <VUView position="absolute" top={75} right={25}>
        <VayyUpLogo size={50} />
      </VUView> */}
      {/* <VUView position="absolute" bottom={30} width="100%" alignItems="center">
        <PrimaryButton onPress={onEndVideo}>Skip{'  '}</PrimaryButton>
      </VUView> */}
    </>
  );
};

export default PromoVideo;
