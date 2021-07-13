import React, {useState, useRef} from 'react';
import {TouchableOpacity, Keyboard, Dimensions} from 'react-native';
import Toast from 'react-native-simple-toast';
import {useDispatch, useSelector} from 'react-redux';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useNavigation} from '@react-navigation/native';
import {Picker} from '@react-native-picker/picker';
import ActionSheet from 'react-native-actions-sheet';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {AppStyles} from 'src/AppStyles';
import firestore from '@react-native-firebase/firestore';
import firebase from '@react-native-firebase/app';
import {Formik} from 'formik';
import * as yup from 'yup';
import 'yup-phone';
import ImagePicker from 'react-native-image-crop-picker';
import {FontAwesomeIcon, IonIcon} from 'src/icons';
import storage from '@react-native-firebase/storage';
import {login} from 'redux/reducers/actions';
import {Title, AvatarContainer, Avatar} from './styles';

const windowDimensions = Dimensions.get('window');

import {
  VUTextInput,
  PrimaryButton,
  ErrorText,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  SafeAreaView,
  VUView,
  VUText,
  VUTouchableWithoutFeedback,
  VUScrollView,
  VUTouchableOpacity,
  VUImage,
} from 'common-components';

const EditProfile = () => {
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const user = useSelector(state => state.auth.user);
  const {dob, certificates = []} = user;
  const [images, setImages] = useState(certificates);
  const [date, setDate] = useState(dob && dob.toDate ? dob.toDate() : dob);

  const actionSheetRef = useRef();

  const EditProfileSchema = yup.object().shape({});
  const initialValues = {
    fullname: user.fullname,
    phone: user.phone,
    education: user.education,
    email: user.email,
    gender: user.gender,
    location: user.location,
  };

  const handleUpdate = async values => {
    const {education, fullname, phone, gender, location} = values;
    if (
      education == undefined ||
      education == '' ||
      fullname == undefined ||
      fullname == '' ||
      phone == undefined ||
      phone == '' ||
      gender == undefined ||
      gender == '' ||
      location == undefined ||
      location == '' ||
      date == undefined ||
      date == ''
    ) {
      Toast.show('Please fill all fields', Toast.SHORT);
    } else {
      setLoading(true);
      try {
        const {education, fullname, phone, gender, location} = values;
        const uploadedImages = await Promise.all(
          images
            .filter(image => !certificates.includes(image))
            .map(async image => {
              const filePage = 'users/' + image.split('/').pop();
              const reference = storage().ref(filePage);
              await reference.putFile(image);
              return reference.getDownloadURL();
            }),
        );
        var userDict = {
          fullname,
          education,
          phone,
          dob: date,
          gender: gender,
          location: location,
          certificates: [...certificates, ...uploadedImages],
        };
        firestore()
          .collection('users')
          .doc(firebase.auth().currentUser.uid)
          .update(userDict);
        dispatch(login({...user, ...userDict}));
        navigation.goBack();
      } catch (error) {
        setLoading(false);
      }
    }
  };

  const handleUploadPhoto = () => {
    ImagePicker.openPicker({
      width: 600,
      height: 600,
      compressImageMaxHeight: 600,
      compressImageMaxWidth: 600,
      maxFiles: 1,
      mediaType: 'photo',
      cropping: true,
    }).then(async response => {
      const {path: uri} = response;
      setLoading(true);
      try {
        const filePage = 'profiles/' + uri.split('/').pop();
        const reference = storage().ref(filePage);
        await reference.putFile(uri);
        const loggedInUser = firebase.auth().currentUser;
        const url = await reference.getDownloadURL();
        await firestore()
          .collection('users')
          .doc(loggedInUser.uid)
          .update({
            profile: url,
          });
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    });
  };

  const handleDateChanged = selectedDate => {
    setDate(selectedDate);
    setShowDatePicker(false);
  };

  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  const handleUploadCertificates = () => {
    ImagePicker.openPicker({
      mediaType: 'photo',
      multiple: true,
      compressImageMaxHeight: 600,
      compressImageQuality: 0.8,
    }).then(selectedImages => {
      setImages([...images, ...selectedImages.map(image => image.path)]);
    });
  };

  const handleShowGenderPicker = async () => {
    actionSheetRef.current?.setModalVisible();
  };

  const handleGenderSelected = () => {
    actionSheetRef.current?.setModalVisible(false);
  };

  const handleBackPressed = () => {
    navigation.navigate('Profile');
  };

  const tileWidth = (windowDimensions.width - 4) / 3;

  return (
    <KeyboardAvoidingView>
      <SafeAreaView bg={AppStyles.color.bgColor} p={3}>
        <VUView alignItems="flex-start">
          <VUTouchableOpacity onPress={handleBackPressed}>
            <IonIcon
              name="arrow-back-outline"
              size={36}
              color={AppStyles.color.btnColor}
            />
          </VUTouchableOpacity>
        </VUView>
        <VUView alignItems="center" pb={10}>
          <VUText
            fontSize={16}
            fontFamily={AppStyles.fontName.poppinsBold}
            color={AppStyles.color.white}>
            Edit Profile
          </VUText>
          <TouchableOpacity onPress={handleUploadPhoto}>
            {user.profile ? (
              <AvatarContainer>
                <Avatar source={{uri: user.profile}} resizeMode="contain" />
              </AvatarContainer>
            ) : (
              <IonIcon name="person-circle-outline" size={100} color="#bbb" />
            )}
          </TouchableOpacity>
        </VUView>
        <VUTouchableWithoutFeedback flex={1} onPress={Keyboard.dismiss}>
          <Formik
            validationSchema={EditProfileSchema}
            initialValues={initialValues}
            onSubmit={handleUpdate}>
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              setFieldValue,
              values,
              errors,
              touched,
              isValid,
            }) => (
              <VUView flex={1} alignItems="center" justifyContent="flex-end">
                <VUScrollView flex={1} width="100%">
                  <VUView flex={1} mb={14}>
                    <VUTextInput
                      borderBottomColor={AppStyles.color.white}
                      borderBottomWidth={1}
                      py={2}
                      px={3}
                      p={1}
                      color={AppStyles.color.white}
                      name="fullname"
                      placeholder="Name"
                      placeholderTextColor={AppStyles.color.white}
                      onChangeText={handleChange('fullname')}
                      onBlur={handleBlur('fullname')}
                      value={values.fullname}
                    />
                    {errors.fullname && touched.fullname && (
                      <ErrorText>{errors.fullname}</ErrorText>
                    )}
                  </VUView>
                  <VUView
                    flexDirection="row"
                    width="100%"
                    mb={10}
                    justifyContent="space-between">
                    <VUTouchableOpacity
                      width={'30%'}
                      onPress={() => {
                        setFieldValue('gender', 'Male');
                      }}>
                      <VUView
                        flexDirection="row"
                        bg={
                          values.gender == 'Male'
                            ? AppStyles.color.btnColor
                            : AppStyles.color.bgColor
                        }
                        borderWidth={1}
                        borderColor={
                          values.gender == 'Male'
                            ? AppStyles.color.bgColor
                            : AppStyles.color.btnColor
                        }
                        py={2}
                        borderRadius={4}
                        alignItems="center">
                        <VUImage
                          width={40}
                          height={40}
                          resizeMode="contain"
                          source={require('src/../assets/male.png')}
                        />
                        <VUText
                          fontSize={12}
                          fontFamily={AppStyles.fontName.poppinsBold}
                          color={AppStyles.color.grayText}>
                          Male
                        </VUText>
                      </VUView>
                    </VUTouchableOpacity>

                    <VUTouchableOpacity
                      width={'30%'}
                      onPress={() => {
                        setFieldValue('gender', 'Female');
                      }}>
                      <VUView
                        flexDirection="row"
                        bg={
                          values.gender == 'Female'
                            ? AppStyles.color.btnColor
                            : AppStyles.color.bgColor
                        }
                        borderWidth={1}
                        borderColor={
                          values.gender == 'Female'
                            ? AppStyles.color.bgColor
                            : AppStyles.color.btnColor
                        }
                        py={2}
                        borderRadius={4}
                        alignItems="center">
                        <VUImage
                          width={40}
                          height={40}
                          resizeMode="contain"
                          //style={styles.logo}
                          source={require('src/../assets/female.png')}
                        />
                        <VUText
                          fontSize={12}
                          fontFamily={AppStyles.fontName.poppinsBold}
                          color={AppStyles.color.grayText}>
                          Female
                        </VUText>
                      </VUView>
                    </VUTouchableOpacity>
                    <VUTouchableOpacity
                      width={'30%'}
                      onPress={() => {
                        setFieldValue('gender', 'Others');
                      }}>
                      <VUView
                        flexDirection="row"
                        bg={
                          values.gender == 'Others'
                            ? AppStyles.color.btnColor
                            : AppStyles.color.bgColor
                        }
                        borderWidth={1}
                        borderColor={
                          values.gender == 'Others'
                            ? AppStyles.color.bgColor
                            : AppStyles.color.btnColor
                        }
                        py={2}
                        borderRadius={4}
                        alignItems="center">
                        <VUImage
                          width={40}
                          height={40}
                          resizeMode="contain"
                          //style={styles.logo}
                          source={require('src/../assets/female.png')}
                        />
                        <VUText
                          fontSize={12}
                          fontFamily={AppStyles.fontName.poppinsBold}
                          color={AppStyles.color.grayText}>
                          Others
                        </VUText>
                      </VUView>
                    </VUTouchableOpacity>
                  </VUView>

                  <VUView flex={1} mb={10}>
                    <VUTextInput
                      borderBottomColor={AppStyles.color.white}
                      borderBottomWidth={1}
                      py={2}
                      px={3}
                      p={1}
                      //  color={AppStyles.color.white}
                      color="#999"
                      editable={false}
                      name="email"
                      placeholderTextColor={AppStyles.color.white}
                      value={values.email}
                    />
                  </VUView>

                  <VUView flex={1} mb={10}>
                    <VUTextInput
                      borderBottomColor={AppStyles.color.white}
                      borderBottomWidth={1}
                      py={2}
                      px={3}
                      p={1}
                      color={AppStyles.color.white}
                      name="phone"
                      placeholder="Phone Number"
                      placeholderTextColor={AppStyles.color.white}
                      onChangeText={handleChange('phone')}
                      onBlur={handleBlur('phone')}
                      value={values.phone}
                      valign="center"
                    />
                    {errors.phone && touched.phone && (
                      <ErrorText>{errors.phone}</ErrorText>
                    )}
                  </VUView>

                  <VUView flex={1} mb={10}>
                    <VUTextInput
                      borderBottomColor={AppStyles.color.white}
                      borderBottomWidth={1}
                      py={2}
                      px={3}
                      p={1}
                      color={AppStyles.color.white}
                      name="location"
                      placeholder="Location"
                      placeholderTextColor={AppStyles.color.white}
                      onChangeText={handleChange('location')}
                      onBlur={handleBlur('location')}
                      value={values.location}
                    />
                    {errors.location && touched.location && (
                      <ErrorText>{errors.location}</ErrorText>
                    )}
                  </VUView>

                  <VUView flexDirection="row">
                    <VUView
                      flex={1}
                      width={'50%'}
                      mr={2}
                      borderBottomColor={AppStyles.color.white}
                      borderBottomWidth={1}
                      mb={10}
                      py={1}>
                      <TouchableOpacity
                        px={3}
                        onPress={() => setShowDatePicker(true)}>
                        <VUText
                          px={3}
                          fontSize={14}
                          color={
                            date instanceof Date
                              ? AppStyles.color.white
                              : AppStyles.color.white
                          }>
                          {date instanceof Date
                            ? moment(date).format('DD-MM-YYYY')
                            : 'DD-MM-YYYY'}
                        </VUText>
                      </TouchableOpacity>
                    </VUView>
                    <VUView flex={1} mb={10} width={'50%'}>
                      <VUTextInput
                        borderBottomColor={AppStyles.color.white}
                        borderBottomWidth={1}
                        py={2}
                        px={3}
                        p={1}
                        color={AppStyles.color.white}
                        name="education"
                        placeholder="Education"
                        placeholderTextColor={AppStyles.color.white}
                        onChangeText={handleChange('education')}
                        onBlur={handleBlur('education')}
                        value={values.education}
                      />
                      {errors.education && touched.education && (
                        <ErrorText>{errors.education}</ErrorText>
                      )}
                    </VUView>
                  </VUView>

                  {/* <VUView
                      width="100%"
                      bg="#fff"
                      py={1}
                      px={2}
                      borderTopWidth={1}
                      borderTopColor={'#bbb'}
                      borderBottomWidth={1}
                      borderBottomColor={'#bbb'}
                      flexDirection="row"
                      justifyContent="space-between"
                      alignItems="center">
                      <VUView flex={1}>
                        <VUText fontSize={12}>Gender</VUText>
                      </VUView>
                      <VUView flex={1}>
                        <TouchableOpacity onPress={handleShowGenderPicker}>
                          <VUText
                            py={3}
                            fontSize={14}
                            color={
                              values.gender === '' || !values.gender
                                ? '#999'
                                : '#000000'
                            }>
                            {values.gender === '' || !values.gender
                              ? 'Select Gender'
                              : values.gender}
                          </VUText>
                        </TouchableOpacity>
                      </VUView>
                      <ActionSheet ref={actionSheetRef}>
                        <VUView width="100%" mt={2} mb={4}>
                          <TouchableOpacity
                            onPress={() => {
                              actionSheetRef.current ?.setModalVisible(false);
                              setFieldValue('gender', 'Male');
                            }}>
                            <VUView
                              width="100%"
                              borderColor="#ccc"
                              py={3}
                              px={3}
                              borderBottomWidth={1}
                              flexDirection="row"
                              justifyContent="space-between">
                              <VUText>Male</VUText>
                            </VUView>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              actionSheetRef.current ?.setModalVisible(false);
                              setFieldValue('gender', 'Female');
                            }}>
                            <VUView
                              width="100%"
                              borderColor="#ccc"
                              py={3}
                              px={3}
                              borderBottomWidth={1}
                              flexDirection="row"
                              justifyContent="space-between">
                              <VUText>Female</VUText>
                            </VUView>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              actionSheetRef.current ?.setModalVisible(false);
                              setFieldValue('gender', 'Others');
                            }}>
                            <VUView
                              width="100%"
                              borderColor="#ccc"
                              py={3}
                              px={3}
                              flexDirection="row"
                              justifyContent="space-between">
                              <VUText>Others</VUText>
                            </VUView>
                          </TouchableOpacity>
                        </VUView>
                      </ActionSheet>
                    </VUView> */}

                  {/* <VUText mx={2} mt={3} mb={2}  color={AppStyles.color.white}>
                      Upload Awards and Recognitions
                  </VUText>
                    <VUView
                      width="100%"
                      flex={1}
                      flexDirection="column"
                      pb="10px">
                      <VUScrollView width="100%" overflow="hidden">
                        <VUView flexDirection="row" flexGrow={1} flexWrap="wrap">
                          {images.length > 0
                            ? images.map((image, index) => (
                              <VUView
                                ml="1px"
                                mb="1px"
                                key={index}
                                width={tileWidth}
                                overflow="hidden">
                                <Image
                                  width="100%"
                                  height={tileWidth}
                                  source={{ uri: image }}
                                  resizeMode="cover"
                                />
                              </VUView>
                            ))
                            : null}
                          <VUView
                            width={tileWidth}
                            height={tileWidth}
                            alignItems="center"
                            justifyContent="center">
                            <VUTouchableOpacity
                              width={tileWidth}
                              height={tileWidth}
                              alignItems="center"
                              justifyContent="center"
                              border="1px solid #FFF"
                              onPress={handleUploadCertificates}>
                              <FontAwesomeIcon
                                name="plus"
                                color="#FFF"
                                size={36}
                              />
                            </VUTouchableOpacity>
                          </VUView>
                        </VUView>
                      </VUScrollView>
                    </VUView> */}
                  <VUView
                    flex={1}
                    alignItems="center"
                    mt={40}
                    width="100%"
                    py={3}>
                    {loading ? (
                      <ActivityIndicator animating={loading} />
                    ) : (
                      <VUView
                        flex={1}
                        width="100%"
                        alignItems="center"
                        justifyContent="center">
                        <VUTouchableOpacity
                          onPress={handleSubmit}
                          disabled={!isValid}
                          alignItems="center"
                          justifyContent="center"
                          width="100%"
                          height={45}
                          borderColor={AppStyles.color.btnColor}
                          borderWidth={1}
                          borderRadius={24}>
                          <VUText
                            fontSize={16}
                            fontFamily={AppStyles.fontName.poppinsBold}
                            color={AppStyles.color.btnColor}>
                            Save Details
                          </VUText>
                        </VUTouchableOpacity>
                      </VUView>
                      // <PrimaryButton
                      //   marginTop={0}
                      //   onPress={handleSubmit}
                      //   disabled={!isValid}>
                      //   Update{'  '}
                      // </PrimaryButton>
                    )}
                  </VUView>
                </VUScrollView>
              </VUView>
            )}
          </Formik>
        </VUTouchableWithoutFeedback>
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          onConfirm={handleDateChanged}
          onCancel={handleCancelDate}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default EditProfile;
