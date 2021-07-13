import React, {useState, useEffect} from 'react';
import {TouchableOpacity, Keyboard, Dimensions, ScrollView} from 'react-native';
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
import * as yup from 'yup';
import 'yup-phone';
import {FontAwesomeIcon, IonIcon} from 'src/icons';

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
import DropDownPicker from 'react-native-dropdown-picker';

const ContactUs = () => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [message, setMessage] = useState('');
  const [items, setItems] = useState([
    {label: 'Report Bug', value: 'Report Bug'},
    {label: 'Feedback', value: 'Feedback'},
    {label: 'Suggest feature', value: 'Suggest feature'},
  ]);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const user = useSelector((state) => state.auth.user);
  useEffect(() => {
    setValue('Report Bug');
  }, []);
  const handleBackPressed = () => {
    navigation.navigate('Profile');
  };
  const handleSubmittedIssue = () => {
    firestore().collection('appreports').add({
      email: user.email,
      issue: value,
      message: message,
      date: firebase.firestore.FieldValue.serverTimestamp(),
    });
    Toast.show('Thanks for your feedback. We will get back to you soon', Toast.LONG);
    clearData()
  };
  const clearData =() =>{
      setValue('Report Bug')
      setMessage('')
  }
  return (
    <SafeAreaView flex={1} bg={AppStyles.color.bgColor} p={3}>
      <ScrollView flex={1}>
        <KeyboardAvoidingView>
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
              fontSize={18}
              fontFamily={AppStyles.fontName.poppinsBold}
              color={AppStyles.color.white}>
              Contact Us
            </VUText>
          </VUView>
          <VUView flex={1} mb={10}>
            <VUTextInput
              borderBottomColor={AppStyles.color.white}
              borderBottomWidth={1}
              py={2}
              px={3}
              p={1}
              color={AppStyles.color.white}
              editable={false}
              name="email"
              value={user.email}
            />
            <VUView mt={30}>
              <DropDownPicker
                open={open}
                value={value}
                items={items}
                setOpen={setOpen}
                setValue={setValue}
                setItems={setItems}
                textStyle={{
                  fontFamily: AppStyles.fontName.poppins,
                }}
              />
            </VUView>
            <VUView mt={30}>
              <VUTextInput
                borderBottomColor={AppStyles.color.white}
                borderBottomWidth={1}
                py={2}
                px={3}
                p={1}
                color={AppStyles.color.white}
                name="Message"
                placeholderTextColor={AppStyles.color.white}
                multiline={true}
                // numberOfLines={10}
                placeholder="Write a Message"
                onChangeText={setMessage}
                value={message}
              />
            </VUView>
            <VUView mt={50}>
              <VUTouchableOpacity
                alignItems="center"
                justifyContent="center"
                width="100%"
                height={45}
                borderColor={AppStyles.color.btnColor}
                borderWidth={1}
                onPress={handleSubmittedIssue}
                borderRadius={24}>
                <VUText
                  fontSize={16}
                  fontFamily={AppStyles.fontName.poppinsBold}
                  color={AppStyles.color.btnColor}>
                  Submit
                </VUText>
              </VUTouchableOpacity>
            </VUView>
          </VUView>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ContactUs;
