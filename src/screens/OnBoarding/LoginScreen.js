import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Alert,
  Image,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';

import Button from 'react-native-button';
import {AppStyles} from '../../AppStyles';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {connect} from 'react-redux';
import {login} from '../../redux/reducers/actions';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {
  AppleButton,
  appleAuth,
} from '@invertase/react-native-apple-authentication';

import {
  VUView,
  VUScrollView,
  VUTextInput,
  ActivityIndicator,
  Wrapper,
  ErrorText,
  VUText,
  VUImage,
} from 'common-components';

import {
  GoogleSignin,
  GoogleSigninButton,
} from '@react-native-community/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width} = Dimensions.get('window');
const FBSDK = require('react-native-fbsdk');
const {LoginManager, AccessToken} = FBSDK;
const TermsURL = 'https://vrdfilmfactory.com/terms-and-conditions';

async function onAppleButtonPress() {
  // Start the sign-in request
  const appleAuthRequestResponse = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
  });

  // Ensure Apple returned a user identityToken
  if (!appleAuthRequestResponse.identityToken) {
    throw 'Apple Sign-In failed - no identify token returned';
  }

  // Create a Firebase credential from the response
  const {identityToken, nonce} = appleAuthRequestResponse;
  const appleCredential = auth.AppleAuthProvider.credential(
    identityToken,
    nonce,
  );

  // Sign the user in with the credential
  return auth().signInWithCredential(appleCredential);
}

class LoginScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      email: '',
      password: '',
      error: '',
    };
  }

  onPressLogin = () => {
    this.setState({error: ''});
    const {email, password} = this.state;
    if (email.trim().length <= 0 || password.length <= 0) {
      Alert.alert('Please fill out the required fields.');
      return;
    }
    this.setState({loading: true});
    auth()
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        this.setState({loading: false});
      })
      .catch(error => {
        this.setState({error: 'Invalid username or password', loading: false});
        throw error;
      });
  };

  onSignupSuccess = async ({user}) => {
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
        phone: user.phone,
      };
      await firestore()
        .collection('users')
        .doc(user.uid)
        .set(userDict);
    }

    this.setState({loading: true});
  };

  onSignupFailed = error => {
    this.setState({loading: false});
  };

  onPressFacebook = () => {
    this.setState({loading: true});
    LoginManager.logInWithPermissions(['public_profile', 'email'])
      .then(
        result => {
          if (result.isCancelled) {
            Alert('Whoops!', 'You cancelled the sign in.');
          } else {
            AccessToken.getCurrentAccessToken().then(data => {
              const credential = firebase.auth.FacebookAuthProvider.credential(
                data.accessToken,
              );
              AsyncStorage.setItem(
                '@loggedInUserID:facebookCredentialAccessToken',
                data.accessToken,
              );

              auth()
                .signInWithCredential(credential)
                .then(this.onSignupSuccess)
                .catch(this.onSignupFailed);
            });
          }
        },
        error => {
          this.setState({
            error: 'Invalid username or password',
            loading: false,
          });
          throw error;
        },
      )
      .catch(error => {
        this.setState({loading: false});
        throw error;
      });
  };

  onPressGoogle = () => {
    this.setState({loading: true});
    GoogleSignin.signIn()
      .then(data => {
        // Create a new Firebase credential with the token
        const credential = firebase.auth.GoogleAuthProvider.credential(
          data.idToken,
        );
        AsyncStorage.setItem(
          '@loggedInUserID:googleCredentialAccessToken',
          data.idToken,
        );
        // Login with the credential
        return auth().signInWithCredential(credential);
      })
      .then(this.onSignupSuccess)
      .catch(this.onSignupFailed);
  };

  handleAppleSignUp = () => {
    onAppleButtonPress()
      .then(this.onSignupSuccess)
      .catch(this.onSignupFailed);
  };

  handleSignup = () => {
    this.props.navigation.navigate('SignUp');
  };

  verifyPhoneNumber = () => {
    this.props.navigation.navigate('PhoneNumberVerify');
  };

  render() {
    return (
      <VUScrollView flex={1} bg={AppStyles.color.bgColor}>
        <View style={styles.container}>
          <Wrapper marginTop={Platform.OS === 'ios' ? 60 : 30} padding={20}>
            <Image
              style={styles.logo}
              source={require('src/../assets/logo-3.png')}
            />
          </Wrapper>
          <View style={styles.InputContainer}>
            <VUTextInput
              borderBottomColor={AppStyles.color.white}
              borderBottomWidth={1}
              py={2}
              px={3}
              p={1}
              color={AppStyles.color.white}
              placeholder="E-Mail"
              onChangeText={text => this.setState({email: text.trim()})}
              value={this.state.email}
              placeholderTextColor={AppStyles.color.white}
              autoCapitalize="none"
              autoCompleteType="off"
              autoCorrect={false}
            />
          </View>
          <View style={styles.InputContainer}>
            <VUTextInput
              borderBottomColor={AppStyles.color.white}
              borderBottomWidth={1}
              py={2}
              px={3}
              p={1}
              color={AppStyles.color.white}
              secureTextEntry={true}
              placeholder="Password"
              onChangeText={text => this.setState({password: text})}
              value={this.state.password}
              placeholderTextColor={AppStyles.color.white}
              underlineColorAndroid="transparent"
              autoCapitalize="none"
              autoCompleteType="off"
              autoCorrect={false}
            />
          </View>
          <View style={styles.InputContainer}>
            {this.state.error.length > 0 && (
              <ErrorText>{this.state.error}</ErrorText>
            )}
          </View>

          {this.state.loading ? (
            <ActivityIndicator animating={this.state.loading} />
          ) : (
            <>
              <Button
                containerStyle={styles.loginContainer}
                style={styles.loginText}
                onPress={() => this.onPressLogin()}>
                Login
              </Button>
              <Text style={styles.or}>- or Login with -</Text>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                {/* <GoogleSigninButton
                    style={{ backgroundColor: 'rgba(0,0,0,0)' }}
                    // style={styles.googleContainer}
                    size={GoogleSigninButton.Size.Icon}
                    color={GoogleSigninButton.Color.Light}
                    onPress={this.onPressGoogle}

                  /> */}
                <TouchableOpacity
                  style={styles.facebookContainer}
                  onPress={this.onPressGoogle}>
                  <View style={styles.appleTextWrapper}>
                    <VUImage
                      width={24}
                      height={24}
                      resizeMode="contain"
                      source={require('src/../assets/google.png')}
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.facebookContainer}
                  onPress={() => this.onPressFacebook()}>
                  <View style={styles.appleTextWrapper}>
                    <FontAwesome
                      style={styles.appleIcon}
                      name="facebook"
                      size={24}
                      color={AppStyles.color.white}
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.facebookContainer}
                  onPress={() => this.verifyPhoneNumber()}>
                  <View style={styles.appleTextWrapper}>
                    <FontAwesome
                      style={styles.appleIcon}
                      name="phone"
                      size={24}
                      color={AppStyles.color.white}
                    />
                  </View>
                </TouchableOpacity>

                {Platform.OS === 'ios' && (
                  <VUView>
                    <AppleButton
                      buttonStyle={AppleButton.Style.WHITE}
                      buttonType={AppleButton.Type.SIGN_IN}
                      style={styles.appleButton}
                      onPress={this.handleAppleSignUp}
                    />
                  </VUView>
                )}
              </View>
            </>
          )}

          {/* <View style={styles.signupButtonWrapper}>
            <Text style={styles.signupText}>Don't Have an Account?</Text>
            <TouchableOpacity onPress={this.handleSignup}>
              <Text style={styles.signup}>Signup</Text>
            </TouchableOpacity>
          </View> */}
          <View style={{justifyContent: 'flex-end', marginTop: '10%'}}>
            <VUView width="80%" mb={3} alignItems="center">
              <VUText
                fontFamily={AppStyles.fontName.poppins}
                color={AppStyles.color.grayText}
                fontSize={12}>
                By continuing, you agree to Vayyup’s{' '}
              </VUText>
              <TouchableOpacity
                onPress={() => {
                  Linking.openURL(TermsURL);
                }}>
                <VUText
                  color={AppStyles.color.btnColor}
                  style={{textDecorationLine: 'underline'}}>
                  Terms and Conditions
                </VUText>
              </TouchableOpacity>
            </VUView>
          </View>
        </View>
      </VUScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },

  or: {
    fontFamily: AppStyles.fontName.poppins,
    color: AppStyles.color.white,
    marginTop: 30,
    marginBottom: 10,
    fontSize: 14,
  },
  signupButtonWrapper: {
    flexDirection: 'row',
    marginTop: 30,
  },
  signupText: {
    color: '#E5E5E5',
    fontFamily: AppStyles.fontName.poppins,
    fontSize: 14,
  },
  signup: {
    fontFamily: AppStyles.fontName.poppins,
    color: AppStyles.color.btnColor,
    marginLeft: 6,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  logo: {
    height: 85,
    width: 85,
    resizeMode: 'contain',
  },
  title: {
    fontSize: AppStyles.fontSize.poppins,
    // fontWeight: 'bold',
    // color: AppStyles.color.tint,
    marginTop: 20,
  },
  leftTitle: {
    alignSelf: 'stretch',
    textAlign: 'left',
    marginLeft: 20,
  },
  content: {
    paddingLeft: 50,
    paddingRight: 50,
    textAlign: 'center',
    fontSize: AppStyles.fontSize.content,
    color: AppStyles.color.text,
  },
  loginContainer: {
    width: '40%',
    backgroundColor: AppStyles.color.btnColor, // AppStyles.color.tint,
    borderRadius: 24,
    padding: 10,
    marginTop: 30,
  },
  loginText: {
    color: AppStyles.color.white,
    fontFamily: AppStyles.fontName.poppinsBold,
    fontSize: 14,
  },
  placeholder: {
    fontFamily: AppStyles.fontName.text,
    color: 'red',
  },
  InputContainer: {
    width: AppStyles.textInputWidth.main,
    marginTop: 14,
  },
  body: {
    height: 42,
    paddingLeft: 20,
    paddingRight: 20,
    color: AppStyles.color.text,
  },
  facebookContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'transparent',
    borderRadius: 4,
    marginHorizontal: 10,
  },
  facebookText: {
    color: AppStyles.color.white,
  },
  googleContainer: {
    width: 48,
    height: 48,
    // backgroundColor: AppStyles.color.grayText,
    borderRadius: 4,
    marginHorizontal: 10,
  },
  googleText: {
    color: AppStyles.color.white,
  },
  appleButton: {
    // width: width * 0.8,
    // height: 42,
    width: 42,
    height: 42,
    //  backgroundColor: AppStyles.color.grayText,
    borderRadius: 4,
    marginHorizontal: 10,
  },
  appleContainer: {
    width: '80%',
    backgroundColor: '#000',
    borderRadius: 25,
    marginTop: 20,
    marginHorizontal: 30,
  },
  appleTextWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleIcon: {
    marginHorizontal: 10,
  },
  appleText: {
    color: AppStyles.color.white,
    alignSelf: 'center',
  },
});

const mapStateToProps = state => {
  return {isAuthenticated: state.isAuthenticated};
};

export default connect(
  mapStateToProps,
  {login},
)(LoginScreen);
