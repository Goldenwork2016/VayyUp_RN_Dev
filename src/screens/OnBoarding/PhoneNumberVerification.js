import React, {useState, useEffect} from 'react';
import Button from 'react-native-button';
import {AppStyles} from 'src/AppStyles';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useStorage} from 'src/services/storage';
import {
  VUView,
  VUText,
  View,
  VUTextInput,
  VUTouchableOpacity,
  ActivityIndicator,
} from 'common-components';
import OTPInputView from '@twotalltotems/react-native-otp-input';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PhoneNumberVerification = ({navigation}) => {
  const [phone, setPhone] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [code, setCode] = useState('');
  const [confirmResult, setConfirmResult] = useState(null);
  const [countrycode, setCountrycode] = useState('+91');
  const [loading, setLoading] = useState(false);

  useEffect(() => {}, []);

  const handleGotoDashboard = () => {
    const {uid} = firebase.auth().currentUser;
    console.log('Navigation clicked');
    navigation.navigate('Onboarding', {uid});
  };

  const validatePhoneNumber = () => {
    var regexp = /^\+[0-9]?()[0-9](\s|\S)(\d[0-9]{8,16})$/;
    return regexp.test(countrycode + phone);
  };

  const handleSendOTP = () => {
    setLoading(true);
    if (validatePhoneNumber()) {
      firebase
        .auth()
        .signInWithPhoneNumber(countrycode + phone)
        .then(function(confirmationResult) {
          setConfirmResult(confirmationResult);
          setShowOtp(true);
          setLoading(false);
        })
        .catch(function(error) {
          console.log(error);
        });
    } else {
      setLoading(false);
      alert('Invalid mobile number');
    }
  };

  const handleVerifyOTP = () => {
    setLoading(true);
    if (code.length == 6) {
      var credential = firebase.auth.PhoneAuthProvider.credential(
        confirmResult.verificationId,
        code,
      );
      auth()
        .signInWithCredential(credential)
        .then(onSignupSuccess)
        .catch(onSignupFailed);
    } else {
      alert('Please enter a 6 digit OTP code.');
    }
    setLoading(false);
  };

  const onSignupSuccess = async ({user}) => {
    AsyncStorage.setItem('@loggedInUserID:id', user.uid);
    const fcmToken = await AsyncStorage.getItem('fcmToken');
    const snapshot = await firestore()
      .collection('users')
      .doc(user.uid)
      .get();
    if (!snapshot.exists) {
      var userDict = {
        id: user.uid,
        fullname: user.displayName,
        email: user.email,
        profile: user.photoURL,
        following: 0,
        followers: 0,
        videos: 0,
        fcmToken: fcmToken,
        phone: user.phoneNumber,
      };
      await firestore()
        .collection('users')
        .doc(user.uid)
        .set(userDict);
    }

    //this.setState({loading: true});
  };

  const onSignupFailed = error => {
    console.log(error);

    // this.setState({loading: false});
  };

  return (
    <VUView flex={1} justifyContent="center" bg={AppStyles.color.bgColor}>
      {showOtp ? (
        <VUView
          alignItems="center"
          justifyContent="center"
          bg={AppStyles.color.bgColor}>
          <VUText p={3} fontSize={16} color={AppStyles.color.white}>
            Enter OTP
          </VUText>
          <OTPInputView
            style={{
              width: '100%',
              height: 100,
              padding: 10,
            }}
            pinCount={6}
            // code={this.state.code} //You can supply this prop or not. The component will be used as a controlled / uncontrolled component respectively.
            // onCodeChanged = {code => { this.setState({code})}}
            autoFocusOnLoad
            codeInputFieldStyle={{
              height: 50,
              color: AppStyles.color.white,
              fontSize: 18,
              fontFamily: AppStyles.fontName.poppins,
              includeFontPadding: false,
            }}
            codeInputHighlightStyle={{borderColor: AppStyles.color.btnColor}}
            onCodeChanged={code => {
              setCode(code);
            }}
            onCodeFilled={code => {
              // console.log(`Code is ${code}, you are good to go!`);
            }}
          />

          <VUView
            width="100%"
            alignItems="center"
            justifyContent="center"
            marginTop="20%">
            {loading ? (
              <ActivityIndicator animating={loading} />
            ) : (
              <VUTouchableOpacity
                onPress={handleVerifyOTP}
                bg={AppStyles.color.btnColor}
                width="70%"
                disabled={code.length == 6 ? false : true}
                opacity={code.length == 6 ? 1 : 0.5}
                p={2}
                borderRadius={24}>
                <VUText textAlign="center" color="#fff">
                  Submit
                </VUText>
              </VUTouchableOpacity>
            )}
          </VUView>
        </VUView>
      ) : (
        <VUView
          alignItems="center"
          justifyContent="center"
          bg={AppStyles.color.bgColor}>
          <VUText p={3} fontSize={16} color={AppStyles.color.white}>
            Enter your mobile number
          </VUText>
          <View
            marginTop={14}
            p={3}
            backgroundColor={AppStyles.color.bgColor}
            width={AppStyles.textInputWidth.main}
            flexDirection="row">
            <VUTextInput
              borderColor={AppStyles.color.white}
              borderWidth={1}
              width="20%"
              py={2}
              px={3}
              p={2}
              color={AppStyles.color.white}
              name="phone"
              placeholder=""
              placeholderTextColor={AppStyles.color.white}
              onChangeText={val => setCountrycode(val)}
              value={countrycode}
              keyboardType="phone-pad"
              maxLength={4}
              letterSpacing={1}
            />
            <VUTextInput
              borderColor={AppStyles.color.white}
              borderWidth={1}
              width="80%"
              py={2}
              px={3}
              p={2}
              color={AppStyles.color.white}
              name="phone"
              placeholder="Phone"
              placeholderTextColor={AppStyles.color.white}
              onChangeText={val => setPhone(val)}
              value={phone}
              keyboardType="phone-pad"
              maxLength={10}
              letterSpacing={1}
            />
          </View>
          <VUView
            width="100%"
            alignItems="center"
            justifyContent="center"
            marginTop="20%">
            {loading ? (
              <ActivityIndicator animating={loading} />
            ) : (
              <VUTouchableOpacity
                onPress={handleSendOTP}
                bg={AppStyles.color.btnColor}
                width="70%"
                p={2}
                borderRadius={24}>
                <VUText textAlign="center" color="#fff">
                  Send OTP
                </VUText>
              </VUTouchableOpacity>
            )}
          </VUView>
        </VUView>
      )}
    </VUView>
  );
};

export default PhoneNumberVerification;
