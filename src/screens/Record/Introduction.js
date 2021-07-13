import React, {useState, useEffect} from 'react';
import {
  FlatList,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  Image,
  Text,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import ImagePicker from 'react-native-image-crop-picker';
import SoundPlayer from 'react-native-sound-player';

import {AppStyles} from 'src/AppStyles';
import {
  SafeAreaView,
  VUTouchableOpacity,
  VUView,
  VUText,
  VUImage,
  MySearchBar,
} from 'common-components';
import {searchKaraoke} from 'src/redux/reducers/karaoke.actions';
import {searchDoops} from 'src/redux/reducers/doop.actions';

import {FontAwesomeIcon, EntypoIcon} from 'src/icons';
import {IonIcon} from 'src/icons';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const ITEM_HEIGHT = 80;

const Introduction = ({competition, onStartRecording, onUploadVideo}) => {
  const dispatch = useDispatch();
  const videos = useSelector(state => state.karaoke.videos);
  const doops = useSelector(state => state.doop.list);
  const navigation = useNavigation();
  const [type, setType] = useState('');
  const [recorded, setRecorded] = useState(false);

  const [playAudioIndex, setPlayAudioIndex] = useState(-1);
  const [searchSongText, setSongSearch] = useState('');
  const [searchAudioText, setAudioSearch] = useState('');

  useEffect(() => {
    console.log(competition);
    if (!competition.title) {
      setType('karaoke');
    } else {
      if (competition.theme == '' && competition.features.length < 0) {
        setType(competition.features[0]);
      } else if (competition.theme == '' && competition.features == '') {
        setRecorded(true);
      } else {
        setType(competition.features[0]);
      }
    }

    dispatch(searchKaraoke(''));
    dispatch(searchDoops(''));
  }, [dispatch]);
  const {title} = competition;

  useEffect(() => {
    const _onFinishedPlayingSubscription = SoundPlayer.addEventListener(
      'FinishedPlaying',
      () => {
        setPlayAudioIndex(-1);
        SoundPlayer.stop();
      },
    );
    const _onFinishedLoadingURLSubscription = SoundPlayer.addEventListener(
      'FinishedLoadingURL',
      result => {
        SoundPlayer.play();
      },
    );
    return () => {
      _onFinishedPlayingSubscription.remove();
      _onFinishedLoadingURLSubscription.remove();
    };
  }, []);

  function hasAndroidPermission() {
    const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

    return PermissionsAndroid.check(permission).then(hasPermission => {
      if (!hasPermission) {
        return PermissionsAndroid.request(permission).then(
          status => status === 'granted',
        );
      }
      return hasPermission;
    });
  }

  const handleBackPressed = () => {
    SoundPlayer.stop();
    navigation.goBack();
  };

  const handleUpload = async () => {
    const permissionStatus =
      Platform.OS === 'android' ? await hasAndroidPermission() : true;

    if (permissionStatus) {
      try {
        ImagePicker.openPicker({
          mediaType: 'video',
          compressVideoPreset: 'HighestQuality'
        }).then(video => {
          onUploadVideo(video);
        });
      } catch (error) {}
    }
  };

  const handlePlayAudio = video => {
    if (playAudioIndex === video.id) {
      SoundPlayer.pause();
      setPlayAudioIndex(-1);
    } else {
      if (playAudioIndex !== -1) {
        SoundPlayer.stop();
      }
      const {audio, originalAudio} = video;
      SoundPlayer.loadUrl(originalAudio || audio);
      setPlayAudioIndex(video.id);
    }
  };

  const handleStartRecording = video => {
    SoundPlayer.stop();
    onStartRecording(video, type, true);
  };
  const handleStartRecordingUnPlug = video => {
    console.log('Karoke Type: ', type);
    onStartRecording('unpluggedvideo', recorded ? 'karaoke' : type, false);
  };

  const handleSwitch = tab => {
    SoundPlayer.stop();
    setType(tab);
  };

  const getItemLayout = (data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  const updateSongSearch = text => {
    setSongSearch(text);
    dispatch(searchKaraoke(text));
  };

  const updateAudioSearch = text => {
    setAudioSearch(text);
    dispatch(searchDoops(text));
  };

  var karoakes = [];
  var doopsAudio = [];

  if (!competition.title) {
    karoakes = videos;
    doopsAudio = doops;
  } else {
    if (competition.theme == '' && competition.features.length > 0) {
      karoakes = videos;
      doopsAudio = doops;
    } else {
      const filterKaroake = [];
      for (let i = 0; i < videos.length; i++) {
        const karoke = videos[i];
        for (let j = 0; j < competition.theme.length; j++) {
          const filterTag = competition.theme[j];
          if (karoke.theme) {
            if (karoke.theme.includes(filterTag)) {
              filterKaroake.push(karoke);
              break;
            }
          }
        }
      }
      const filterDoops = [];
      for (let i = 0; i < doops.length; i++) {
        const doopsItem = doops[i];
        for (let j = 0; j < competition.theme.length; j++) {
          const filterTheme = competition.theme[j];
          if (doopsItem.theme) {
            if (doopsItem.theme.includes(filterTheme)) {
              filterDoops.push(doopsItem);
              break;
            }
          }
        }
      }
      karoakes = filterKaroake;
      doopsAudio = filterDoops;
    }
  }

  const renderItem = ({item: video, index}) => {
    return (
      <VUView mb={1} bg={AppStyles.color.bgColor} p={2}>
        <VUView flexDirection="row">
          <VUView>
            <TouchableOpacity onPress={() => handlePlayAudio(video)}>
              <VUView
                width="75px"
                height="80px"
                flexDirection="column"
                alignItems="center"
                justifyContent="center">
                <VUImage
                  position="absolute"
                  top={0}
                  width="75px"
                  height="80px"
                  borderRadius={4}
                  source={{uri: video.cover, cache: 'force-cache'}}
                  resizeMode="cover"
                />
                <VUView
                  position="absolute"
                  bg="rgba(0,0,0,0.3)"
                  width="75px"
                  height="80px"
                  alignItems="center"
                  justifyContent="center">
                  {playAudioIndex === video.id ? (
                    <FontAwesomeIcon size={24} color="#fff" name="pause" />
                  ) : (
                    <FontAwesomeIcon size={24} color="#fff" name="play" />
                  )}
                </VUView>
              </VUView>
            </TouchableOpacity>
          </VUView>
          <VUView
            flex={1}
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            mx={2}>
            <VUView width="80%">
              <VUText
                fontSize={15}
                fontFamily={AppStyles.fontName.poppinsBold}
                color={AppStyles.color.white}
                mb={1}>
                {video.title}
              </VUText>
              <VUText
                fontSize={12}
                fontFamily={AppStyles.fontName.poppins}
                color={AppStyles.color.grayText}
                mb={1}>
                {video.movie}
              </VUText>
            </VUView>
            <VUTouchableOpacity
              onPress={handleStartRecording.bind(this, video)}
              bg={AppStyles.color.btnColor}
              width={50}
              height={25}
              borderRadius={24}
              justifyContent="center"
              alignItems="center">
              <VUText
                fontSize={12}
                fontFamily={AppStyles.fontName.poppins}
                textAlign="center"
                color={AppStyles.color.grayText}>
                Sing
              </VUText>
            </VUTouchableOpacity>
          </VUView>
        </VUView>
      </VUView>
    );
  };
  const renderHeaderItem = ({}) => {
    return (
      <VUView mb={1} p={2}>
        <TouchableOpacity onPress={handleStartRecordingUnPlug.bind(this, null)}>
          <VUView flexDirection="row">
            <VUView>
              <TouchableOpacity>
                <VUView
                  width="75px"
                  height="80px"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center">
                  <VUImage
                    position="absolute"
                    top={0}
                    width="75px"
                    height="80px"
                    borderRadius={4}
                    source={require('src/../assets/unplugimg.jpg')}
                    resizeMode="cover"
                  />
                </VUView>
              </TouchableOpacity>
            </VUView>
            <VUView
              flex={1}
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              mx={2}>
              <VUView>
                <VUText
                  fontSize={15}
                  fontFamily={AppStyles.fontName.poppinsBold}
                  color={AppStyles.color.white}
                  mb={1}>
                  Unplugged
                </VUText>
              </VUView>
              <VUView>
                <FontAwesomeIcon size={14} color="#333" name="chevron-right" />
              </VUView>
            </VUView>
          </VUView>
        </TouchableOpacity>
      </VUView>
    );
  };
  return (
    <SafeAreaView>
      <VUView
        flex={1}
        bg={AppStyles.color.bgColor}
        justifyContent="space-between">
        <LinearGradient
          colors={['#0C0B54', '#0C0B54', '#F84030']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}>
          <VUView
            flexDirection="row"
            justifyContent="center"
            alignItems="center">
            <VUView width={'85%'}>
              {type === 'karaoke' ? (
                <MySearchBar
                  placeholder={'Search songs'}
                  onChangeText={text => updateSongSearch(text)}
                  value={searchSongText}
                />
              ) : (
                <MySearchBar
                  placeholder={'Search audio'}
                  onChangeText={text => updateAudioSearch(text)}
                  value={searchAudioText}
                />
              )}
            </VUView>
            {/* {title ? (
            <VUView
              alignItems="center"
              py={15}
              borderBottomWidth={1}
              borderBottomColor="#e0e0e0">
              <VUText color="#000" fontSize={16} fontWeight="bold">
                {title}
              </VUText>
            </VUView>
          ) : (
            <VUView
              alignItems="center"
              py={15}
              px={10}
              borderBottomWidth={1}
              borderBottomColor="#e0e0e0">
              <VUText color="#000" active fontSize={16} fontWeight="bold">
                Select
              </VUText>
            </VUView>
          )} */}
            <VUView width="36px" mr={3}>
              {/* {!competition.title && ( */}
              <VUTouchableOpacity onPress={handleUpload}>
                <EntypoIcon
                  bold
                  name="plus"
                  size={34}
                  color={AppStyles.color.grayText}
                />
              </VUTouchableOpacity>
              {/* )} */}
            </VUView>
          </VUView>
        </LinearGradient>
        {!competition.title && (
          <VUView mx={4} mb={2}>
            <VUView
              p={1}
              flexDirection="row"
              justifyContent="space-around"
              alignItems="center"
              width="100%"
              bg={AppStyles.color.bgColor}>
              <VUTouchableOpacity
                width="150px"
                py={1}
                borderColor={
                  type === 'karaoke' ? AppStyles.color.white : '#878080'
                }
                borderBottomWidth={1}
                alignItems="center"
                onPress={handleSwitch.bind(this, 'karaoke')}>
                <VUText
                  color={type === 'karaoke' ? AppStyles.color.white : '#878080'}
                  fontSize={16}
                  fontFamily={AppStyles.fontName.poppinsBold}>
                  Karaoke
                </VUText>
              </VUTouchableOpacity>
              <VUTouchableOpacity
                width="150px"
                py={1}
                borderColor={
                  type === 'doops' ? AppStyles.color.white : '#878080'
                }
                borderBottomWidth={1}
                alignItems="center"
                onPress={handleSwitch.bind(this, 'doops')}>
                <VUText
                  color={type === 'doops' ? AppStyles.color.white : '#878080'}
                  fontSize={16}
                  fontFamily={AppStyles.fontName.poppinsBold}>
                  Doops
                </VUText>
              </VUTouchableOpacity>
            </VUView>
          </VUView>
        )}
        {competition.title && competition.features.length > 0 && type != '' && (
          <VUView mx={4} mb={2}>
            <VUView
              p={1}
              flexDirection="row"
              justifyContent="space-around"
              alignItems="center"
              width="100%"
              bg={AppStyles.color.bgColor}>
              {competition.features.map(val => (
                <VUTouchableOpacity
                  width="150px"
                  py={1}
                  borderColor={type === val ? AppStyles.color.white : '#878080'}
                  borderBottomWidth={1}
                  alignItems="center"
                  onPress={handleSwitch.bind(this, val)}>
                  <VUText
                    color={type === val ? AppStyles.color.white : '#878080'}
                    fontSize={16}
                    style={{textTransform: 'capitalize'}}
                    fontFamily={AppStyles.fontName.poppinsBold}>
                    {val}
                  </VUText>
                </VUTouchableOpacity>
              ))}
              {/* 
              <VUTouchableOpacity
                width="150px"
                py={1}
                borderColor={
                  type === "doops" ? AppStyles.color.white : "#878080"
                }
                borderBottomWidth={1}
                alignItems="center"
                onPress={handleSwitch.bind(this, "doops")}
              >
                <VUText
                  color={type === "doops" ? AppStyles.color.white : "#878080"}
                  fontSize={16}
                  fontFamily={AppStyles.fontName.poppinsBold}
                >
                  Doops
                </VUText>
              </VUTouchableOpacity>
            </VUView>
          </VUView>
        )}
        {competition.title && competition.features.length > 0 && (
          <VUView mx={4} mb={2}>
            <VUView
              p={1}
              flexDirection="row"
              justifyContent="space-around"
              alignItems="center"
              width="100%"
              bg={AppStyles.color.bgColor}
            >
              {competition.features.map((val) => (
                <VUTouchableOpacity
                  width="150px"
                  py={1}
                  borderColor={type === val ? AppStyles.color.white : "#878080"}
                  borderBottomWidth={1}
                  alignItems="center"
                  onPress={handleSwitch.bind(this, val)}
                >
                  <VUText
                    color={type === val ? AppStyles.color.white : "#878080"}
                    fontSize={16}
                    fontFamily={AppStyles.fontName.poppinsBold}
                  >
                    {val}
                  </VUText>
                </VUTouchableOpacity>
              ))}
              {/* 
              <VUTouchableOpacity
                width="150px"
                py={1}
                borderColor={type === 'doops' ? AppStyles.color.white : '#878080'}
                borderBottomWidth={1}
                alignItems="center"
                onPress={handleSwitch.bind(this, 'doops')}>
                <VUText color={type === 'doops' ? AppStyles.color.white : '#878080'} fontSize={16} fontFamily={AppStyles.fontName.poppinsBold} >Doops</VUText>
              </VUTouchableOpacity> */}
            </VUView>
          </VUView>
        )}

        {competition.title && competition.features == '' && (
          <VUView
            bg={AppStyles.color.bgColor}
            flex={1}
            justifyContent="flex-start">
            <VUView mb={1} p={2}>
              <TouchableOpacity
                onPress={handleStartRecordingUnPlug.bind(this, null)}>
                <VUView flexDirection="row">
                  <VUView>
                    <TouchableOpacity>
                      <VUView
                        width="75px"
                        height="80px"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center">
                        <VUImage
                          position="absolute"
                          top={0}
                          width="75px"
                          height="80px"
                          borderRadius={4}
                          source={require('src/../assets/unplugimg.jpg')}
                          resizeMode="cover"
                        />
                      </VUView>
                    </TouchableOpacity>
                  </VUView>
                  <VUView
                    flex={1}
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mx={2}>
                    <VUView>
                      <VUText
                        fontSize={15}
                        fontFamily={AppStyles.fontName.poppinsBold}
                        color={AppStyles.color.white}
                        mb={1}>
                        Unplugged
                      </VUText>
                    </VUView>
                    <VUView>
                      <FontAwesomeIcon
                        size={14}
                        color="#333"
                        name="chevron-right"
                      />
                    </VUView>
                  </VUView>
                </VUView>
              </TouchableOpacity>
            </VUView>
          </VUView>
        )}

        <VUView flex={1} bg={AppStyles.color.bgColor}>
          {type === 'karaoke' && (
            <VUView bg={AppStyles.color.bgColor} flex={1}>
              {/* <VUText fontSize={12} color="#666">
                  Please select the karaoke from the following list.
                </VUText> */}

              {karoakes.length > 0 && (
                <FlatList
                  data={karoakes}
                  renderItem={renderItem}
                  keyExtractor={item => item.id}
                  initialNumToRender={0}
                  windowSize={21}
                  getItemLayout={getItemLayout}
                  ListHeaderComponent={renderHeaderItem}
                />
              )}
            </VUView>
          )}
          {type === 'doops' && (
            <VUView bg={AppStyles.color.bgColor} flex={1}>
              {/* <VUText fontSize={12} color="#666">
                  Please select the dialog from the following list.
                </VUText> */}

              {doopsAudio.length > 0 && (
                <FlatList
                  data={doopsAudio}
                  renderItem={renderItem}
                  keyExtractor={item => item.id}
                  initialNumToRender={0}
                  windowSize={21}
                />
              )}
            </VUView>
          )}
        </VUView>
      </VUView>
    </SafeAreaView>
  );
};

export default Introduction;
