import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Dimensions, ScrollView } from 'react-native';
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
    SafeAreaView
  } from 'common-components';
  import { AppStyles } from 'src/AppStyles';
  import { IonIcon, FontAwesomeIcon, FontAwesome5Icon } from 'src/icons';
  import { RESET_ACTION } from 'redux/reducers/action.types';

const Success = () => {
   
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
        <ScrollView>
           <VUView flex={1}  p={2}>
        <VUView alignItems='center' >
            <VUText fontSize={30} fontFamily={AppStyles.fontName.poppinsBold} color={AppStyles.color.grayText}>Success</VUText>
        </VUView>
        <VUView p={2} alignItems='center' justifyContent='center'>
        <VUImage
               width='100%' height={550} resizeMode='cover'
              source={require('src/../assets/sundar-c.jpg')}
                          />
        </VUView>
        <VUView flex={1} justifyContent='flex-end'>
        <VUView p={2} alignItems='center' justifyContent='center'>
            <VUTouchableOpacity 
            onPress={()=>{navigation.navigate('Profile')}}
            alignItems='center' justifyContent='center' width='55%' height={45} borderColor={AppStyles.color.btnColor} borderWidth={1} borderRadius={6} mb={16}>
            <VUText fontSize={16} fontFamily={AppStyles.fontName.poppinsBold} color={AppStyles.color.btnColor}>Go to profile</VUText>
            </VUTouchableOpacity>
            <VUTouchableOpacity 
            onPress={()=>{navigation.popToTop()}}
            alignItems='center' justifyContent='center' width='55%' height={45} borderColor={AppStyles.color.btnColor} borderWidth={1} borderRadius={6}>
            <VUText fontSize={16} fontFamily={AppStyles.fontName.poppinsBold} color={AppStyles.color.btnColor}>Done</VUText>
            </VUTouchableOpacity>
        </VUView>
        </VUView>
        </VUView>
        </ScrollView>
       
        </SafeAreaView>
    )
};

export default Success;
