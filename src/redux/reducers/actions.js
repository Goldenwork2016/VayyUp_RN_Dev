import {LOGIN, LOGOUT} from './action.types';
import {createNullCache} from '@algolia/cache-common';

import {
  FEEDS_SEARCH,
  FEEDS_SET,
  FEEDS_APPEND,
  FEEDS_UPDATE,
  REACTIONS_SET,
  REACTIONS_APPEND,
  REACTION_DELETE,
  TOGGLE_SOUND,
  SETTINGS_SHOW_PROMO,
  SETTINGS_SHOW_VIDEO,
  SETTINGS_UPGRADE,
  VIDEO_ACTIVE,
} from './action.types';

export const login = (user) => ({
  type: LOGIN,
  payload: user,
});

export const logout = () => ({
  type: LOGOUT,
  payload: {},
});

const algoliasearch = require('algoliasearch');
const client = algoliasearch('JE3MQ03MQJ', 'eba71ea01813acfc254ee71414050f15', {
  responsesCache: createNullCache(), // Disable Cache
});
const algoliaIndex = client.initIndex('entries');
// const algoliaVideoIndex = client.initIndex('videos');

export const searchFeedsFromAlgolia = async (searchTerm) => {
  const response = await algoliaIndex.search(searchTerm, {
    hitsPerPage: 200,
    filters:'isPublished:true'
  });
  const {hits = []} = response;
  return hits;
};

export const searchFeeds = (competitionId, searchTerm) => async (dispatch) => {
  const response = await algoliaIndex.search(searchTerm || '', {
    hitsPerPage: 200,
    filters: `competitionId:${competitionId} AND isPublished:true`,
  });
  const {hits = []} = response;
  if (hits.length > 0) {
    dispatch(
      searchFeedsAction(
        competitionId,
        hits.filter((hit) => hit.url),
      ),
    );
  } else {
    dispatch(searchFeedsAction(competitionId, hits));
  }
};

export const searchFeedsAction = (searchTerm, feeds) => ({
  type: FEEDS_SEARCH,
  payload: {searchTerm, feeds},
});
export const setFeeds = (list) => ({type: FEEDS_SET, payload: list});
export const appendFeeds = (list) => ({type: FEEDS_APPEND, payload: list});
export const updateFeed = (feed, index) => ({
  type: FEEDS_UPDATE,
  payload: {feed, index},
});

export const setReactions = (list) => ({type: REACTIONS_SET, payload: list});
export const appendReactions = (list) => ({
  type: REACTIONS_APPEND,
  payload: list,
});

export const deleteReaction = (reaction) => ({
  type: REACTION_DELETE,
  payload: reaction,
});

export const toggleSound = () => ({type: TOGGLE_SOUND});

export const setShowPromo = (show) => ({
  type: SETTINGS_SHOW_PROMO,
  payload: show,
});

export const setVideoId = (videoId, videoType) => ({
  type: SETTINGS_SHOW_VIDEO,
  payload: {videoId, videoType},
});

export const upgradeNeeded = (needed) => ({
  type: SETTINGS_UPGRADE,
  payload: {upgradeNeeded: needed || true},
});

export const setActiveVideo = (id, index) => ({
  type: VIDEO_ACTIVE,
  payload: {id, index},
});
