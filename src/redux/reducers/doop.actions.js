import {createNullCache} from '@algolia/cache-common';
import {DOOP_SEARCH} from './action.types';

const algoliasearch = require('algoliasearch');
const client = algoliasearch('JE3MQ03MQJ', 'eba71ea01813acfc254ee71414050f15', {
  responsesCache: createNullCache(), // Disable Cache
});
const algoliaVideoIndex = client.initIndex('doop');

export const searchDoops = (searchTerm) => async (dispatch) => {
  const response = await algoliaVideoIndex.search(searchTerm, {
    hitsPerPage: 500,
  });
  const {hits = []} = response;
  if (hits.length > 0) {
    dispatch(
      searchDoopsAction(
        searchTerm,
        hits.filter((hit) => hit.audio),
      ),
    );
  } else {
    dispatch(searchDoopsAction(searchTerm, hits));
  }
};

export const searchDoopsAction = (searchTerm, list) => ({
  type: DOOP_SEARCH,
  payload: {searchTerm, list},
});
