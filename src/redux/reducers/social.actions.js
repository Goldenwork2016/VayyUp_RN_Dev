import {SOCIAL_APPEND_FOLLOWING, SOCIAL_APPEND_FOLLOWERS} from './action.types';

export const appendUserFollowing = (snapshot) => ({
  type: SOCIAL_APPEND_FOLLOWING,
  payload: snapshot,
});

export const appendUserFollowers = (snapshot) => ({
  type: SOCIAL_APPEND_FOLLOWERS,
  payload: snapshot,
});
