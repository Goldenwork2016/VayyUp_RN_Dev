import React from 'react';
import {StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {connect} from 'react-redux';

import Trophy from 'common-components/icons/Trophy';
import User from 'common-components/icons/User';
import Video from 'common-components/icons/Video';

import VUBottomTab from 'src/components/VUBottomTab/VUBottomTab';

import Home from 'screens/Home';
import Competition from 'screens/Competition';
import MyVideos from 'screens/MyVideos';
import MyProfile from 'screens/Profile/MyProfile';

const styles = StyleSheet.create({
  navigator: {
    backgroundColor: 'transparent',
    paddingTop: 4,
    borderTopWidth: 0,
    elevation: 0,
    marginTop: 5,
  },
});

const Tab = createBottomTabNavigator();

const HomeScreen = () => {
  return (
    <Tab.Navigator
      tabBarOptions={{
        style: {
          backgroundColor: 'transparent',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 0,
        },
      }}
      barStyle={styles.navigator}
      initialRouteName="Home"
      inactiveColor="#C4C4C4"
      activeColor="#E8505B"
      screenOptions={({route}) => ({
        title: route.name,
      })}
      tabBar={(props) => {
        const {state, route, navigation} = props;
        return (
          <VUBottomTab route={route} state={state} navigation={navigation} />
        );
      }}>
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({color}) => (
            <FontAwesome name="home" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Competition"
        component={Competition}
        options={{
          tabBarLabel: 'Competition',
          tabBarIcon: ({color}) => <Trophy size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="MyVideos"
        component={MyVideos}
        options={{
          headerShown: true,
          tabBarLabel: 'My Videos',
          tabBarIcon: ({color}) => <Video size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={MyProfile}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({color}) => <User size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

export default connect(mapStateToProps)(HomeScreen);
