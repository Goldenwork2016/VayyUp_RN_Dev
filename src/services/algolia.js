import {createNullCache} from '@algolia/cache-common';

const algoliasearch = require('algoliasearch');
const client = algoliasearch('JE3MQ03MQJ', 'eba71ea01813acfc254ee71414050f15', {
  responsesCache: createNullCache(), // Disable Cache
});

const PageSize = 200;
const algoliaVideoIndex = client.initIndex('videos');

const algoliaSearchVideos = async (searchTerm, page) => {
  const response = await algoliaVideoIndex.search(searchTerm, {
    hitsPerPage: PageSize,
    page: page,
    filters: 'isPublished:true',
  });
  const {hits = []} = response;
  if (hits.length > 0) {
    return hits
      .filter((hit) => hit.playback)
      .map(
        ({
          uid,
          createdAt,
          id,
          playback,
          preview,
          thumbnail,
          title,
          url,
          user,
          video,
          videoFileName,
          votes,
          comments,
          views,
          isPublished
        }) => ({
          uid,
          createdAt,
          id,
          playback,
          preview,
          thumbnail,
          title,
          url,
          user,
          video,
          videoFileName,
          votes,
          comments,
          views,
          isPublished
        }),
      );
  }
  return hits;
};

const algoliaSearchUserVideos = async (searchTerm, page, currentUser) => {
  let response;
  if (currentUser === true) {
    response = await algoliaVideoIndex.search(searchTerm, {
      hitsPerPage: PageSize,
      page: page,
    });
  }else{
    response = await algoliaVideoIndex.search(searchTerm, {
      hitsPerPage: PageSize,
      page: page,
      filters: 'isPublished:true',
    });
  }
  
  const {hits = []} = response;
  if (hits.length > 0) {
    return hits
      .filter((hit) => hit.playback)
      .map(
        ({
          uid,
          createdAt,
          id,
          playback,
          preview,
          thumbnail,
          title,
          url,
          user,
          video,
          videoFileName,
          votes,
          comments,
          views,
          isPublished
        }) => ({
          uid,
          createdAt,
          id,
          playback,
          preview,
          thumbnail,
          title,
          url,
          user,
          video,
          videoFileName,
          votes,
          comments,
          views,
          isPublished
        }),
      );
  }
  return hits;
};

export {algoliaSearchVideos, algoliaSearchUserVideos};
