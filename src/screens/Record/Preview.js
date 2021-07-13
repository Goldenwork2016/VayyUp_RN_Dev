import React, {Component} from 'react';
import {
  View,
  VUView,
  VUVideo,
  VUText,
  VUTouchableOpacity,
  PrimaryButton,
  VUTextInput,
  SafeAreaView,
  KeyboardAvoidingView,
} from 'common-components';
import Toast from 'react-native-simple-toast';
import firestore from '@react-native-firebase/firestore';
import firebase from '@react-native-firebase/app';
import storage from '@react-native-firebase/storage';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {updateVideo, deleteVideo} from '../../models/queries';
import {
  Dimensions,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import {AppStyles} from 'src/AppStyles';
import {IonIcon, FontAwesomeIcon} from 'src/icons';
import {AntDesignIcon} from 'src/icons';
var RNFS = require('react-native-fs');
const {width, height} = Dimensions.get('window');
export default class Preview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      item: props.route.params.item,
      title: props.route.params.item.title,
      type: props.route.params.type,
      uploadVideo: false,
      videoSource: '',
      previewPlaying: false,
      uploading: false,
      progress: 0,
    };
  }
  componentDidMount = () => {
    const {
      url,
      thumbnail,
      playback = {},
      video,
      videoFileName,
    } = this.state.item;
    const {hls, dash} = playback;
    let videoURL = {uri: url};
    if (Platform.OS === 'ios' && hls) {
      videoURL = {uri: hls, type: 'm3u8'};
    }
    if (Platform.OS === 'android' && dash) {
      videoURL = {uri: dash, type: 'mpd'};
    }
    this.setState({
      videoSource: videoURL,
    });
  };

  handleTogglePlaying = () => {
    this.setState({
      previewPlaying: !this.state.previewPlaying,
    });
  };

  handlePreviewEnded = () => {
    this.setState({
      previewPlaying: false,
    });
  };
  handleVideoType = async () => {
    if (this.state.type === 'myCompetitionVideos') {
      let document = this.state.item;
      const snapshot = await firestore()
        .collection('entries')
        .where('uid', '==', document.uid)
        .where('competitionId', '==', document.competitionId)
        .where('isPublished', '==', true)
        .get();
      if (snapshot.empty) {
        this.handleOnPublish();
      } else {
        Toast.show('You have already submitted', Toast.LONG);
      }
    } else {
      this.handleOnPublish();
    }
  };
  handleOnPublish = async () => {
    let document = this.state.item;
    document.isPublish = true;
    const collectionName =
      this.state.type === 'myCompetitionVideos' ? 'entries' : 'videos';
    firestore()
      .collection(collectionName)
      .doc(document.id)
      .update({
        title: this.state.title,
        isPublished: true,
      })
      .then(update => {
        Toast.show('Published successfully', Toast.LONG);
        this.props.navigation.popToTop();
      })
      .catch(error => {
        console.log('Error', error);
      });
  };

  handleOnSave = async () => {
    let document = this.state.item;
    document.title = this.state.title;
    const collectionName =
      this.state.type === 'myCompetitionVideos' ? 'entries' : 'videos';
    firestore()
      .collection(collectionName)
      .doc(document.id)
      .update({
        title: this.state.title,
      })
      .then(update => {
        Toast.show('Updated successfully', Toast.LONG);
        this.props.navigation.popToTop();
      })
      .catch(error => {
        console.log('Error', error);
      });
  };
  handleClose = () => {
    this.props.navigation.popToTop();
  };
  handleOnDeleteAlert = () => {
    Alert.alert('', 'Are you sure you want to delete? ', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {text: 'OK', onPress: () => this.handleOnDelete()},
    ]);
  };
  handleOnDelete = async () => {
    let document = this.state.item;
    const collectionName =
      this.state.type === 'myCompetitionVideos' ? 'entries' : 'videos';
    await firestore()
      .collection(collectionName)
      .doc(document.id)
      .delete();
    setTimeout(() => {
      Toast.show('Video deleted successfully.', Toast.LONG);
      this.props.navigation.navigate('Profile');
    }, 7000);
  };

  handlePlay = () => {
    console.log('palyed');
    this.setState({previewPlaying: !this.state.previewPlaying});
  };
  render() {
    return (
      <SafeAreaView flex={1} bg={AppStyles.color.bgColor}>
        <KeyboardAvoidingView
          flex={1}
          behavior={Platform.OS == 'ios' ? 'padding' : 'enabled'}>
          <ScrollView flex={1}>
            <VUView>
              <VUView flexDirection="row" p={2}>
                <VUTouchableOpacity onPress={this.handleClose}>
                  <IonIcon
                    bold
                    name="close"
                    size={34}
                    color={AppStyles.color.btnColor}
                  />
                </VUTouchableOpacity>
                <VUView
                  flex={1}
                  justifyContent="flex-end"
                  alignItems="flex-end">
                  <VUTouchableOpacity onPress={this.handleOnDeleteAlert}>
                    <IonIcon
                      bold
                      name="trash-outline"
                      size={28}
                      color={AppStyles.color.btnColor}
                    />
                  </VUTouchableOpacity>
                </VUView>
              </VUView>
              {/* <VUView>
                <VUText
                  fontSize={18}
                  fontFamily={AppStyles.fontName.poppinsBold}
                  color={AppStyles.color.btnColor}
                  textAlign="center">
                  Prepare for submission
                </VUText>
              </VUView> */}
              <VUView style={{margin: 12}}>
                <View
                  style={{
                    width: '100%',
                    height: 480,
                    borderRadius: 4,
                  }}>
                  <VUTouchableOpacity flex={1} onPress={this.handlePlay}>
                    <VUVideo
                      flex={1}
                      source={this.state.videoSource}
                      volume={10}
                      width="100%"
                      height={480}
                      resizeMode="cover"
                      repeat={true}
                      onEnd={this.handlePreviewEnded}
                      paused={this.state.previewPlaying}
                      poster={this.state.item.thumbnail}
                      posterResizeMode={'cover'}
                      ignoreSilentSwitch="ignore"
                    />
                    {this.state.previewPlaying && (
                      <VUView
                        alignItems="center"
                        justifyContent="center"
                        position="absolute"
                        style={[StyleSheet.absoluteFill]}>
                        <AntDesignIcon name={'play'} size={64} color="#bbb" />
                      </VUView>
                    )}
                  </VUTouchableOpacity>
                </View>
                <VUView>
                  <VUTextInput
                    borderBottomColor={AppStyles.color.white}
                    borderBottomWidth={1}
                    py={2}
                    px={3}
                    p={1}
                    color={AppStyles.color.white}
                    value={this.state.title}
                    onChangeText={text => {
                      this.setState({
                        title: text,
                      });
                    }}
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
                  onPress={this.handleOnSave}
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
                  onPress={this.handleVideoType}
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
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
}
