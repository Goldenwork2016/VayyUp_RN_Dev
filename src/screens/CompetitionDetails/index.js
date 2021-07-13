import React, {useState} from 'react';
import {Text, StyleSheet, ScrollView, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import CountDown from 'react-native-countdown-component';
import {Overlay, ActivityIndicator} from 'common-components';
import firestore from '@react-native-firebase/firestore';
import {IonIcon} from 'src/icons';

import {AppStyles} from 'src/AppStyles';
import {Container, Title, ParticipateNowText, Wrapper} from './styles';
import {
  VUText,
  VUView,
  VUImage,
  VUScrollView,
  Image,
  SafeAreaView,
  VUTouchableOpacity,
} from 'common-components';
import {useEffect} from 'react';

const CompetitionDetailTabs = {
  Participate: 0,
  Terms: 1,
};

const CompetitionDetails = props => {
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState([]);
  const [tab, setTab] = useState(CompetitionDetailTabs.Participate);
  const {competition = {}} = props.route.params;
  const user = useSelector(state => state.auth.user);
  const {
    id,
    title,
    description,
    startDateTime,
    voteEndDateTime,
    endDateTime,
    banner,
  } = competition;

  const navigation = useNavigation();

  //Handle user who not updated his Profile
  useEffect(() => {
    if (!user.hasOwnProperty('dob')) {
      Alert.alert(
        'Update profile',
        'To participate in competiton please update your profile',
        [
          {
            text: 'Cancel',
            onPress: () => console.log('Canceld'),
          },
          {
            text: 'Ok',
            onPress: () => navigation.navigate('EditProfile'),
          },
        ],
      );
    }
  }, []);
  useEffect(() => {
    navigation.setOptions({
      headerTitle: (
        <VUText
          textAlign="center"
          fontFamily={AppStyles.fontName.poppinsBold}
          color={AppStyles.color.btnColor}>
          {competition.title}
        </VUText>
      ),
    });
  }, [navigation, competition.title]);

  useEffect(() => {
    const load = async () => {
      const snapshot = await firestore()
        .collection('entries')
        .where('uid', '==', user.id)
        .where('competitionId', '==', id)
        .where('isPublished', '==', true)
        .get();
      console.log('snapshot', snapshot);

      setSubmitted(!snapshot.empty);
      setLoading(false);
    };
    load();
  }, [id, user.id, banner]);

  useEffect(() => {
    const loadResult = async () => {
      const snapshot = await firestore()
        .collection('entries')
        .where('competitionId', '==', id)
        .orderBy('votes', 'desc')
        .limit(10)
        .get();
      console.log('snapshot', snapshot);

      if (!snapshot.empty) {
        const _results = [];
        snapshot.forEach(doc => _results.push(doc.data()));
        setResults(_results);
        console.log(_results);
      }
      setLoading(false);
    };
    loadResult();
  }, [completed, id]);

  const getRemainingTime = dateTime => {
    return Math.floor((dateTime.toDate() - Date.now()) / 1000);
  };

  const [started, setStarted] = useState(getRemainingTime(startDateTime) <= 0);
  const [completed, setCompleted] = useState(
    getRemainingTime(endDateTime) <= 0,
  );
  const [voteEnd, setVoteEnd] = useState(
    getRemainingTime(voteEndDateTime) <= 0,
  );

  const handleOnCountDownFinished = () => {
    setStarted(getRemainingTime(startDateTime) <= 0);
    setCompleted(getRemainingTime(endDateTime) <= 0);
    setVoteEnd(getRemainingTime(endDateTime) <= 0);
  };

  const handleParticipate = () => {
    if (getRemainingTime(endDateTime) <= 0) {
      // TODO: Error message
    } else {
      navigation.navigate('Record', {competition});
    }
  };

  const handleUserProfilePressed = async item => {
    navigation.navigate('UserProfile', {
      user: {...user, id: item.uid},
      showBack: true,
    });
  };

  const handleOnTabChange = tabIndex => {
    setTab(tabIndex);
  };

  if (loading) {
    return (
      <Overlay>
        <ActivityIndicator />
      </Overlay>
    );
  }

  const bannerImage = banner
    ? {uri: banner}
    : require('src/../assets/competition-banner.jpg');
  return (
    <SafeAreaView>
      <VUView flex={1}>
        <VUScrollView bg={AppStyles.color.bgColor}>
          <VUView m={0} p={0} bg={AppStyles.color.bgColor}>
            <Image
              source={bannerImage}
              height="200px"
              width="100%"
              resizeMode="cover"
            />
            <VUView flexDirection="row" width="100%" px={10} my={3}>
              <VUTouchableOpacity
                flex={1}
                borderBottomWidth={2}
                borderBottomColor={
                  tab === CompetitionDetailTabs.Participate
                    ? AppStyles.color.white
                    : '#878080'
                }
                pb={2}
                onPress={handleOnTabChange.bind(
                  this,
                  CompetitionDetailTabs.Participate,
                )}>
                <VUText
                  fontSize={16}
                  fontFamily={AppStyles.fontName.poppinsBold}
                  textAlign="center"
                  color={
                    tab === CompetitionDetailTabs.Participate
                      ? AppStyles.color.white
                      : '#878080'
                  }>
                  Participate
                </VUText>
              </VUTouchableOpacity>
              <VUTouchableOpacity
                flex={1}
                pb={2}
                borderBottomWidth={2}
                borderBottomColor={
                  tab === CompetitionDetailTabs.Terms
                    ? AppStyles.color.white
                    : '#878080'
                }
                onPress={handleOnTabChange.bind(
                  this,
                  CompetitionDetailTabs.Terms,
                )}>
                <VUText
                  fontSize={16}
                  fontFamily={AppStyles.fontName.poppinsBold}
                  textAlign="center"
                  color={
                    tab === CompetitionDetailTabs.Terms
                      ? AppStyles.color.white
                      : '#878080'
                  }>
                  Terms
                </VUText>
              </VUTouchableOpacity>
            </VUView>
            {tab === CompetitionDetailTabs.Participate && (
              <>
                {(completed || started) && results.length > 0 ? (
                  <VUView>
                    {started && !completed && (
                      <VUView
                        alignItems="center"
                        bg={AppStyles.color.bgColor}
                        mx={2}
                        style={{marginBottom: 6}}>
                        <VUText
                          fontSize={16}
                          fontFamily={AppStyles.fontName.poppins}
                          color={AppStyles.color.btnColor}>
                          Competition Ends in
                        </VUText>
                        <CountDown
                          until={getRemainingTime(endDateTime)}
                          digitStyle={styles.digitStyle}
                          digitTxtStyle={styles.digitTxtStyle}
                          timeLabelStyle={styles.timeLabelStyle}
                          separatorStyle={{
                            color: AppStyles.color.white,
                            fontSize: 30,
                          }}
                          onFinish={handleOnCountDownFinished}
                          size={22}
                          timeToShow={['D', 'H', 'M', 'S']}
                          timeLabels={{m: null, s: null}}
                          showSeparator
                        />
                      </VUView>
                    )}
                    {started && completed && !voteEnd && (
                      <VUView
                        alignItems="center"
                        bg={AppStyles.color.bgColor}
                        mx={4}
                        p={2}
                        style={{marginBottom: 6}}>
                        <VUText
                          fontSize={16}
                          fontFamily={AppStyles.fontName.poppins}
                          color={AppStyles.color.btnColor}>
                          Voting Ends in
                        </VUText>
                        <CountDown
                          until={getRemainingTime(voteEndDateTime)}
                          digitStyle={styles.digitStyle}
                          digitTxtStyle={styles.digitTxtStyle}
                          timeLabelStyle={styles.timeLabelStyle}
                          separatorStyle={{
                            color: AppStyles.color.white,
                            fontSize: 30,
                          }}
                          onFinish={handleOnCountDownFinished}
                          size={22}
                          timeToShow={['D', 'H', 'M', 'S']}
                          timeLabels={{m: null, s: null}}
                          showSeparator
                        />
                      </VUView>
                    )}
                    {/*                     
                    <VUText textAlign="center" fontSize={16} fontWeight="bold">
                      {completed ? 'Winners' : 'Leader Board'}
                    </VUText> */}
                    <VUView
                      alignItems="center"
                      mx={4}
                      px={2}
                      bg={AppStyles.color.btnColor}
                     // borderWidth={1}
                      borderRadius={4}>
                      {results.map(
                        (item, index) =>
                          item.isPublished && (
                            <VUView
                              width="100%"
                              flexDirection="row"
                              flex={1}
                              justifyContent="space-between"
                              alignItems="center"
                              borderBottomColor="#001829"
                              borderBottomWidth={
                                index + 1 < results.length ? 1 : 0
                              }
                              py={2}>
                              <VUTouchableOpacity
                                onPress={handleUserProfilePressed.bind(
                                  this,
                                  item,
                                )}>
                                <VUView
                                  flex={1}
                                  flexDirection="row"
                                  alignItems="center">
                                  {item.user.profile ? (
                                    <VUImage
                                      size={40}
                                      source={{uri: item.user.profile}}
                                      borderRadius={20}
                                    />
                                  ) : (
                                    <IonIcon
                                      name="person-circle-outline"
                                      size={40}
                                      color="#ccc"
                                    />
                                  )}
                                  <VUView ml={10} flexDirection={'column'}>
                                    <VUText
                                      fontFamily={
                                        AppStyles.fontName.poppinsBold
                                      }
                                      color={AppStyles.color.grayText}
                                      ml={10}>
                                      {item.user.name}
                                    </VUText>
                                    <VUText
                                      fontFamily={AppStyles.fontName.poppins}
                                      color={AppStyles.color.grayText}
                                      ml={10}>
                                      {item.user.location}
                                    </VUText>
                                  </VUView>
                                </VUView>
                              </VUTouchableOpacity>
                              <VUText
                                fontFamily={AppStyles.fontName.poppinsBold}
                                color={AppStyles.color.grayText}>
                                {item.votes}
                              </VUText>
                            </VUView>
                          ),
                      )}
                    </VUView>
                  </VUView>
                ) : (
                  <>
                    {!started && (
                      <VUView
                        alignItems="center"
                        bg={AppStyles.color.bgColor}
                        mx={4}
                        p={2}>
                        <VUText
                          fontSize={16}
                          fontFamily={AppStyles.fontName.poppins}
                          color={AppStyles.color.btnColor}>
                          Competition Starts in
                        </VUText>
                        <CountDown
                          until={getRemainingTime(startDateTime)}
                          digitStyle={styles.digitStyle}
                          digitTxtStyle={styles.digitTxtStyle}
                          timeLabelStyle={styles.timeLabelStyle}
                          separatorStyle={{
                            color: AppStyles.color.white,
                            fontSize: 30,
                          }}
                          onFinish={handleOnCountDownFinished}
                          size={22}
                          timeToShow={['D', 'H', 'M', 'S']}
                          timeLabels={{m: null, s: null}}
                          showSeparator
                        />
                      </VUView>
                    )}
                  </>
                )}

                <Wrapper>
                  {submitted && (
                    <ParticipateNowText>
                      You have already submitted
                    </ParticipateNowText>
                  )}
                </Wrapper>
              </>
            )}

            {tab === CompetitionDetailTabs.Terms && (
              <VUView px={2} py={3}>
                <VUText
                  fontFamily={AppStyles.fontName.poppins}
                  color={AppStyles.color.grayText}>
                  {description.replace(/<br\/>/g, '\n')}
                </VUText>
              </VUView>
            )}
          </VUView>
        </VUScrollView>
        <VUView bg={AppStyles.color.bgColor} alignItems="center" py={2}>
          {!completed && started && !submitted && (
            <>
              {user.dob ? (
                <VUTouchableOpacity
                  onPress={handleParticipate}
                  bg={AppStyles.color.btnColor}
                  px={3}
                  py={2}
                  borderRadius={24}>
                  <VUText color="#fff">Participate</VUText>
                </VUTouchableOpacity>
              ) : (
                <VUView alignItems="center">
                  <VUText color={AppStyles.color.errorText}>
                    Please Update you profile to submit a video
                  </VUText>
                </VUView>
              )}
            </>
          )}
        </VUView>
      </VUView>
    </SafeAreaView>
  );
};

export default CompetitionDetails;

const styles = StyleSheet.create({
  timeLabelStyle: {
    color: AppStyles.color.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  digitTxtStyle: {
    color: AppStyles.color.white,
    fontSize: 30,
    fontFamily: AppStyles.fontName.poppins,
  },
  digitStyle: {backgroundColor: 'transparent'},
});
