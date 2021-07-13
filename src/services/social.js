import firestore from '@react-native-firebase/firestore';
import firebase from '@react-native-firebase/app';
import {
  appendUserFollowing,
  appendUserFollowers,
} from 'src/redux/reducers/social.actions';

const SocialCollectionName = 'social';
const SocialFollowingCollectionName = 'following';
const SocialFollowersCollectionName = 'followers';

const followUser = async (user, followedByUser) => {
  const batch = firestore().batch();
  const followingRef = firestore()
    .collection(SocialCollectionName)
    .doc(followedByUser.id)
    .collection(SocialFollowingCollectionName)
    .doc(user.id);
  batch.set(followingRef, {
    ...user,
  });

  const userRef = firestore().collection('users').doc(user.id);
  batch.update(userRef, {
    [SocialFollowersCollectionName]: firebase.firestore.FieldValue.increment(1),
  });

  const followerRef = firestore()
    .collection(SocialCollectionName)
    .doc(user.id)
    .collection(SocialFollowersCollectionName)
    .doc(followedByUser.id);
  batch.set(followerRef, {
    ...followedByUser,
  });

  const followedByRef = firestore().collection('users').doc(followedByUser.id);
  batch.update(followedByRef, {
    [SocialFollowingCollectionName]: firebase.firestore.FieldValue.increment(1),
  });

  await batch.commit();
};

const unfollowUser = async (user, followedByUser) => {
  const batch = firestore().batch();
  const followingRef = firestore()
    .collection(SocialCollectionName)
    .doc(followedByUser.id)
    .collection(SocialFollowingCollectionName)
    .doc(user.id);
  batch.delete(followingRef);

  const userRef = firestore().collection('users').doc(user.id);
  batch.update(userRef, {
    [SocialFollowersCollectionName]:
      firebase.firestore.FieldValue.increment(-1),
  });

  const followerRef = firestore()
    .collection(SocialCollectionName)
    .doc(user.id)
    .collection(SocialFollowersCollectionName)
    .doc(followedByUser.id);
  batch.delete(followerRef);

  const followedByRef = firestore().collection('users').doc(followedByUser.id);
  batch.update(followedByRef, {
    [SocialFollowingCollectionName]:
      firebase.firestore.FieldValue.increment(-1),
  });

  await batch.commit();
};

const getFollowers = async (userId) => {
  const snapshots = await firestore()
    .collection(SocialCollectionName)
    .doc(userId)
    .collection(SocialFollowersCollectionName)
    .get();
  if (!snapshots.empty) {
    const users = [];
    snapshots.forEach((snapshot) => {
      users.push(snapshot.data());
    });
    return users;
  }
  return [];
};

const getFollowing = async (userId) => {
  const snapshots = await firestore()
    .collection(SocialCollectionName)
    .doc(userId)
    .collection(SocialFollowingCollectionName)
    .get();
  if (!snapshots.empty) {
    const users = [];
    snapshots.forEach((snapshot) => {
      users.push(snapshot.data());
    });
    return users;
  }
  return [];
};

const subscribeToFollowing = (userId, dispatch, errorCallback) => {
  return firestore()
    .collection(SocialCollectionName)
    .doc(userId)
    .collection(SocialFollowingCollectionName)
    .onSnapshot(
      (snapshot) => {
        dispatch(appendUserFollowing(snapshot));
      },
      (error) => {
        if (errorCallback) {
          errorCallback(error);
        }
      },
    );
};

const subscribeToFollowers = (userId, dispatch, errorCallback) => {
  return firestore()
    .collection(SocialCollectionName)
    .doc(userId)
    .collection(SocialFollowersCollectionName)
    .onSnapshot(
      (snapshot) => {
        dispatch(appendUserFollowers(snapshot));
      },
      (error) => {
        if (errorCallback) {
          errorCallback(error);
        }
      },
    );
};

const voteVideo = async (user, item) => {
  const snapshot = await firestore()
    .collection('likes')
    .where('videoId', '==', item.id)
    .where('uid', '==', user.uid)
    .get();

  if (snapshot.empty) {
    const batch = firestore().batch();
    const videoRef = firestore().collection('videos').doc(item.id);
    batch.update(videoRef, {
      votes: firebase.firestore.FieldValue.increment(1),
    });
    const likesRef = firestore().collection('likes').doc();
    batch.set(likesRef, {
      videoId: item.id,
      uid: user.uid,
      version: '1.2.1',
    });

    await batch.commit();
  }
};

const unvoteVideo = async (user, item) => {
  const snapshot = await firestore()
    .collection('likes')
    .where('videoId', '==', item.id)
    .where('uid', '==', user.uid)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const batch = firestore().batch();
    const doc = snapshot.docs[0];
    batch.delete(doc.ref);
    const videoRef = firestore().collection('videos').doc(item.id);
    batch.update(videoRef, {
      votes: firebase.firestore.FieldValue.increment(-1),
    });
    await batch.commit();
  }
};

const voteEntry = async (user, item) => {
  const snapshot = await firestore()
    .collection('voting')
    .where('entryId', '==', item.id)
    .where('uid', '==', user.uid)
    .get();

  if (snapshot.empty) {
    const batch = firestore().batch();
    const entryRef = firestore().collection('entries').doc(item.id);
    batch.update(entryRef, {
      votes: firebase.firestore.FieldValue.increment(1),
    });
    const votingRef = firestore().collection('voting').doc();
    batch.set(votingRef, {
      entryId: item.id,
      uid: user.uid,
      version: '1.2.1',
    });
    await batch.commit();
  }
};

const unvoteEntry = async (user, item) => {
  const snapshot = await firestore()
    .collection('voting')
    .where('entryId', '==', item.id)
    .where('uid', '==', user.uid)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const batch = firestore().batch();
    const doc = snapshot.docs[0];
    batch.delete(doc.ref);
    const videoRef = firestore().collection('entries').doc(item.id);
    batch.update(videoRef, {
      votes: firebase.firestore.FieldValue.increment(-1),
    });
    await batch.commit();
  }
};

const feedVideoViewed = async (user, item) => {
    const batch = firestore().batch();
    const videoRef = firestore().collection('videos').doc(item.id);
    batch.update(videoRef, {
      views: firebase.firestore.FieldValue.increment(1),
    });
    await batch.commit();
};

const competitionVideoViewed = async (user, item) => {
    const batch = firestore().batch();
    const entryRef = firestore().collection('entries').doc(item.id);
    batch.update(entryRef, {
      views: firebase.firestore.FieldValue.increment(1),
    });
    await batch.commit();
};

export {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  subscribeToFollowing,
  subscribeToFollowers,
  voteVideo,
  unvoteVideo,
  voteEntry,
  unvoteEntry,
  feedVideoViewed,
  competitionVideoViewed,
  
};
