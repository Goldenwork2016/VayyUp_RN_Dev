import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Dimensions } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import firebase from '@react-native-firebase/app';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import {
    VUView,
    VUScrollView,
    VUText,
    VUImage,
    VUTouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
  } from 'common-components';
  import { AppStyles } from 'src/AppStyles';
  import { IonIcon, FontAwesomeIcon, FontAwesome5Icon } from 'src/icons';
  import { RESET_ACTION } from 'redux/reducers/action.types';

const Settings = () => {
   
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const handleEditProfile = () => {
        navigation.navigate('EditProfile');
      };
      
      const handleContactUs = () => {
        navigation.navigate('ContactUs');
      };
      const handleLogout = async () => {
        await firebase.auth().signOut();
        dispatch({ type: RESET_ACTION });
        // await AsyncStorage.removeItem('first-time');
      };

    return (
        <SafeAreaView bg={AppStyles.color.bgColor}>
        <VUView flex={1}  p={2}>
        <VUView alignItems='center' p={3}>
            <VUText fontSize={16} fontFamily={AppStyles.fontName.poppinsBold} color={AppStyles.color.grayText}>Settings</VUText>
        </VUView>
        <VUView p={2} alignItems='center' justifyContent='center'>
            <VUTouchableOpacity onPress={handleEditProfile}
            alignItems='center' justifyContent='center' width='85%' height={45} borderColor={AppStyles.color.grayText} borderWidth={1} borderRadius={24}>
            <VUText fontSize={16} fontFamily={AppStyles.fontName.poppinsBold} color={AppStyles.color.grayText}>Edit Profile</VUText>
            </VUTouchableOpacity>
        </VUView>
        <VUView p={2}  mt={10} alignItems='center' justifyContent='center'>
            <VUTouchableOpacity onPress={handleContactUs}
            alignItems='center' justifyContent='center' width='85%' height={45} borderColor={AppStyles.color.grayText} borderWidth={1} borderRadius={24}>
            <VUText fontSize={16} fontFamily={AppStyles.fontName.poppinsBold} color={AppStyles.color.grayText}>Contact Us</VUText>
            </VUTouchableOpacity>
        </VUView>
        <VUView flex={1} justifyContent='flex-end'>
        <VUView p={2} alignItems='center' justifyContent='center'>
            <VUTouchableOpacity onPress={handleLogout}
            alignItems='center' justifyContent='center' width='85%' height={45} borderColor={AppStyles.color.btnColor} borderWidth={1} borderRadius={24}>
            <VUText fontSize={16} fontFamily={AppStyles.fontName.poppinsBold} color={AppStyles.color.btnColor}>Logout</VUText>
            </VUTouchableOpacity>
        </VUView>
        </VUView>


        </VUView>
        </SafeAreaView>
    )
};

export default Settings;
