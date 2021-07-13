import React from 'react';
import { Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { setShowPromo } from 'src/redux/reducers/actions';
import firebase from '@react-native-firebase/app';

import TabScreen from 'screens/TabScreen';
import CompetitionDetails from 'screens/CompetitionDetails';
import Record from 'screens/Record';
import Preview from 'screens/Record/Preview';
import VideoSubmitted from 'screens/VideoSubmitted';
import Comment from 'screens/Comment';
import EditProfile from 'screens/Profile/EditProfile';
import Onboarding from 'screens/OnBoarding';
import CompetitionVideos from 'screens/CompetitionVideos';
import Profile from 'screens/Profile';
import Settings from 'screens/Profile/Settings';
import Connections from 'screens/Connections';
import PromoVideo from 'components/PromoVideo';
import MyVideos from 'screens/MyVideos';
import CompetitionVideo from 'screens/CompetitionVideo';
import ContactUs from 'screens/Profile/ContactUs';
import Success from 'screens/Record/Success';
import { AppStyles } from 'src/AppStyles';
import EmailValidationScreen from 'screens/OnBoarding/EmailValidationScreen';

import { isUserEmailVerified } from 'services/auth';

const Stack = createStackNavigator();

const headerStyle = {
  backgroundColor: AppStyles.color.bgColor,
  borderBottomWidth: 0,
  shadowOffset: { width: 0, height: 2 },
  shadowColor: '#000',
  shadowOpacity: 0.2,
  elevation: 10,
};

const headerTintColor = AppStyles.color.btnColor;
const AppStack = () => {
  const dispatch = useDispatch();
  const showPromo = useSelector((state) => state.settings.showPromo);
  const { videoId, videoType } = useSelector((state) => ({
    videoId: state.settings.videoId,
    videoType: state.settings.videoType,
  }));

  const onEndVideo = () => {
    dispatch(setShowPromo(false));
  };

  if (showPromo) {
    return <PromoVideo onEndVideo={onEndVideo} />;
  }

  const initialRoute = isUserEmailVerified(firebase.auth().currentUser) ? videoId ? 'CompetitionVideo' : 'VayyUp' : 'EmailValidation';
  return (
    <Stack.Navigator mode="modal" initialRouteName={initialRoute}>
      <Stack.Screen
        name="VayyUp"
        component={TabScreen}
        options={{
          title: 'Vayy Up',
          headerShown: false,
          headerStyle,
          headerTintColor: headerTintColor,
        }}
      />
      <Stack.Screen
        name="CompetitionDetails"
        component={CompetitionDetails}
        options={{
          title: 'Competition',
          headerShown: true,
          headerStyle,
          headerTintColor: headerTintColor,
          headerTitle: <Text style={{
            textAlign: 'center', flex: 1, fontFamily:
              `${AppStyles.fontName.poppins}`
          }}>Competition</Text>
        }}
      />
      <Stack.Screen
        name="Record"
        component={Record}
        options={{
          title: 'Record View',
          headerShown: false,
          headerStyle,
          headerTintColor: headerTintColor,
          headerTitle: { fontSize: 20 }
        }}
      />
      <Stack.Screen
        name="Preview"
        component={Preview}
        options={{
          title: 'Preview View',
          headerShown: false,
          headerStyle,
          headerTintColor: headerTintColor,
        }}
      />
      <Stack.Screen
        name="VideoSubmitted"
        component={VideoSubmitted}
        options={{
          title: 'Success',
          headerShown: false,
          headerStyle,
          headerTintColor: headerTintColor,
        }}
      />

      <Stack.Screen
        name="Comment"
        component={Comment}
        options={{
          title: 'Comment',
          headerShown: false,
          headerStyle,
          headerTintColor: headerTintColor,
        }}
      />
      <Stack.Screen
        name="UserVideos"
        component={MyVideos}
        options={{
          title: 'User Videos',
          headerShown: true,
          headerStyle,
          headerTintColor: headerTintColor,
        }}
      />

      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={{
          title: 'Edit Profile',
          headerShown: false,
          headerStyle,
          headerTintColor: headerTintColor,
        }}
      />
      <Stack.Screen
        name="Onboarding"
        component={Onboarding}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CompetitionVideos"
        component={CompetitionVideos}
        options={{
          title: 'Competition Videos',
          headerShown: false,
          headerStyle,
          headerTintColor: headerTintColor,
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={Profile}
        options={{
          title: 'Profile',
          headerShown: false,
          headerStyle,
          headerTintColor: headerTintColor,
        }}
      />
      <Stack.Screen
        name="Connections"
        component={Connections}
        options={{
          title: 'Connections',
          headerShown: true,
          headerStyle,
          headerTintColor: headerTintColor,
        }}
      />
      <Stack.Screen
        name="CompetitionVideo"
        component={CompetitionVideo}
        options={{
          headerShown: false,
        }}
        initialParams={{ videoId, videoType }}
      />
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{
          headerShown: false,
        }}

      />
      <Stack.Screen
        name="ContactUs"
        component={ContactUs}
        options={{
          title: 'Contact us',
          headerShown: false,
          headerStyle,
          headerTintColor: headerTintColor,
        }}
      />
      <Stack.Screen
        name="Success"
        component={Success}
        options={{
          title: 'Excellent',
          headerShown: false,
          headerStyle,
          headerTintColor: headerTintColor,
        }}
      />
      <Stack.Screen
        name="EmailValidation"
        component={EmailValidationScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppStack;
