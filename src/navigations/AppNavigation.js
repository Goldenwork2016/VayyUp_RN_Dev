import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import AuthStack from './AuthStack';
import AppStack from './AppStack';

import { VUView, VayyUpLogo } from 'common-components';
import {
  setVideoId,
} from 'src/redux/reducers/actions';
import { AppStyles } from 'src/AppStyles';
import { useDeeplinking, deeplinkFeed } from 'src/services/deeplinking';
import { useFirebaseAuth, useVayyUpFirebase } from 'src/services/auth';
import { useStorage } from 'src/services/storage';
import {
  setShowPromo,
} from 'src/redux/reducers/actions';

const AppNavigation = () => {
  const [loading, setLoading] = useState(true);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const navigationRef = React.createRef();
  const dispatch = useDispatch();

  const [initializeFirebaseAuth, cleanUpFirebaseAuth] = useFirebaseAuth(
    dispatch, setLoading
  );
  const [subscribe, unsubscribe] = useVayyUpFirebase();

  const handleDynamicLink = link => {
    // Handle dynamic link inside your own application
    if (link !== null) {
      handleDynamicLinkRouting(link.url)
    }
  };
  const handleDynamicLinkRouting = url => {
    let urlArray = url.split('/');
    let videoId = urlArray[urlArray.length - 1]
    let videoType = urlArray[urlArray.length - 2]

    console.log("videoId", videoId, "videoType", videoType);
    if (isAuthenticated) {
      navigationRef.current?.navigate('CompetitionVideo', {
        videoId,
        videoType
      });
    } else {
      dispatch(setVideoId(videoId, videoType));
    }
  }
  useEffect(async () => {
    dynamicLinks()
      .getInitialLink()
      .then(link => {
        if (link !== null) {
          handleDynamicLinkRouting(link.url)
        }
      });
    const unsubscribeDynamiclink = dynamicLinks().onLink(handleDynamicLink);
    // const {cleanUpDeeplinking} = useDeeplinking();
    // deeplinkFeed(
    //   ()=>{
    //     if (isAuthenticated) {
    //       navigationRef.current ?.navigate('CompetitionVideo', {
    //         videoId: response.id,
    //         videoType: response.type,
    //       });
    //     }else{
    //       dispatch(setVideoId(response.id, response.type));
    //     }
    //   }
    // );
    async function verifiedUser({ uid }) {
      subscribe(uid, dispatch);
      const fcmToken = await AsyncStorage.getItem('fcmToken');
      if (fcmToken) {
        await firestore().collection('users').doc(uid).update({ fcmToken });
      }
      const firstTime = await AsyncStorage.getItem('first-time');
      console.log(firstTime);
      if (firstTime === 'already-logged') {
        console.log('Dispatching show Promo');
        dispatch(setShowPromo(true));
      } else {
        console.log('Navigating to Onboarding');
        navigationRef.current?.navigate('Onboarding', { uid });
      }
    };

    const unVerifiedUser = ({ uid }) => {
      subscribe(uid, dispatch);
      navigationRef.current?.navigate('EmailValidation');
    };


    initializeFirebaseAuth(verifiedUser, unVerifiedUser);

    const cleanUp = () => {
      cleanUpFirebaseAuth();
      unsubscribe()
      unsubscribeDynamiclink()
      cleanUpDeeplinking();
    };

    return cleanUp;
  }, [dispatch, navigationRef.current]);

  if (loading) {
    return (
      <VUView
        bg={AppStyles.color.bgColor}
        flex={1}
        justifyContent="center"
        alignItems="center">
        <VayyUpLogo size={100} />
      </VUView>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigation;
