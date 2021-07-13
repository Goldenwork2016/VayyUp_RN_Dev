import React, {useState, useEffect} from 'react';
import {Platform} from 'react-native';
import {useDispatch} from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import firebase from '@react-native-firebase/app';
import {useSelector} from 'react-redux';
import {Keyboard} from 'react-native';
import {
  VUView,
  VUTouchableOpacity,
  VUText,
  SafeAreaView,
} from 'common-components';
import Overlay from 'common-components/Overlay';
import ActivityIndicator from 'common-components/ActivityIndicator';
import {AppStyles} from 'src/AppStyles';
import {GiftedChat, Bubble} from 'react-native-gifted-chat';
import {updateFeed} from 'src/redux/reducers/actions';
import {useNavigation} from '@react-navigation/core';
import {IonIcon} from 'src/icons';
import {updateVideo} from 'src/redux/reducers/video.actions';

const Comment = ({route, onBack}) => {
  const {item = {}, index, type} = route.params;
  const user = useSelector(state => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const dispatch = useDispatch();
  const videoType = type === 'competition' ? 'entries' : 'videos';
  const navigation = useNavigation();

  useEffect(() => {
    firestore()
      .collection(videoType)
      .doc(item.id)
      .collection('comments')
      .orderBy('date')
      .onSnapshot(snapshot => {
        if (snapshot) {
          const list = [];
          snapshot.forEach(obj => list.push({...obj.data(), id: obj.id}));
          const allComments = [
            ...comments,
            ...list
              .filter(comment => comment.date)
              .map(comment => ({
                _id: comment.id,
                text: comment.text,
                createdAt: comment.date.toDate(),
                user: {
                  _id: comment.user.uid,
                  name: comment.user.name,
                  avatar: comment.user.profile,
                },
              })),
          ];
          setComments(allComments);
          if (type === 'competition') {
            dispatch(
              updateFeed({...item, comments: allComments.length}, index),
            );
          } else {
            dispatch(
              updateVideo({...item, comments: allComments.length}, index),
            );
          }
          setLoading(false);
        }
      });
  }, [item, dispatch, index, videoType, type]);

  const handleSaveComment = async messages => {
    const {fullname = '', profile = '', id = ''} = user;
    messages.forEach(async ({text}) => {
      await firestore()
        .collection(videoType)
        .doc(item.id)
        .collection('comments')
        .add({
          text,
          date: firebase.firestore.FieldValue.serverTimestamp(),
          user: {
            name: fullname,
            profile: profile,
            uid: id,
          },
        });
    });
  };
  const handleBackPressed = () => {
    dissMissKeyBoard(true, function() {
      setTimeout(() => {
        navigation.goBack();
      }, 125);
    });
  };
  function dissMissKeyBoard(isKeyboardNeedToClose, callback) {
    Keyboard.dismiss();
    callback();
  }
  if (loading) {
    return (
      <Overlay>
        <ActivityIndicator />
      </Overlay>
    );
  }
  return (
    <SafeAreaView bg={AppStyles.color.bgColor}>
      <VUView
        width="100%"
        px={3}
        py={2}
        flexDirection="row"
        justifyContent="space-between">
        <VUView width={40}>
          <VUTouchableOpacity onPress={handleBackPressed}>
            <IonIcon name="arrow-back-outline" size={24} color="#FFF" />
          </VUTouchableOpacity>
        </VUView>
        <VUView alignSelf="center">
          <VUText
            fontSize={16}
            fontFamily={AppStyles.fontName.poppinsBold}
            color={AppStyles.color.white}>
            Comments
          </VUText>
        </VUView>
        <VUView width={40} />
      </VUView>
      <GiftedChat
        messages={comments}
        onSend={handleSaveComment}
        renderUsernameOnMessage={true}
        inverted={false}
        user={{
          _id: user.id,
        }}
      />
    </SafeAreaView>
  );
};

export default Comment;
