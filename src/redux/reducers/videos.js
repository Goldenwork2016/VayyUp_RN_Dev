import {
  VIDEOS_SEARCH,
  MYVIDEOS_SEARCH,
  VIDEOS_SET,
  VIDEOS_APPEND,
  VIDEOS_UPDATE,
  VIDEOS_REACTIONS_SET,
  VIDEOS_REACTIONS_APPEND,
  VIDEO_ACTIVE,
  COMPETITION_VIDEO,
  LOCAL_FEED_VIDEO
} from './action.types';

const initialState = {
  searchTerm: '',
  videos: [],
  videoPage: 0,
  myVideos: [],
  myVideoPage: 0,
  reactions: [],
  active: {},
  competitionVideos:[],
  localVideos:[]
};

export default function (state = initialState, action = {}) {
  switch (action.type) {
    case VIDEOS_SEARCH: {
      const {videos, searchTerm, page} = action.payload;
      const newState = {
        ...state,
        searchTerm,
        videoPage: page,
      };
      if(page <= 1){
        newState.videos = videos
      }else{
        let lastPageVideos = [...state.videos]
        let newPageVideos = [...videos]
        
        let lastIndexValueOflastPageVideos = lastPageVideos[lastPageVideos.length - 1]
        const index = newPageVideos.findIndex((item, index) => {
          if (item.id === lastIndexValueOflastPageVideos.id) {
            return true
          }
        })
        newPageVideos.splice(0, index+1)

        newState.videos = [...lastPageVideos, ...newPageVideos];
      }
      const {active} = state;
      if (!active.id) {
        newState.active = videos.length > 0 ? {id: videos[0].id} : null;
      }
      return newState;
    }
    case MYVIDEOS_SEARCH: {
      const {videos, userId} = action.payload;
      return {
        ...state,
        myVideos: videos,
        myVideoPage: state.myVideoPage + 1,
        userId,
      };
    }
    case VIDEOS_SET: {
      const newState = {
        ...state,
        videos: action.payload,
        videoPage: 1
      };
      const {active} = state;
      if (!active.id) {
        newState.active = action.payload > 0 ? {id: action.payload[0].id} : null;
      }
      return newState;
    }
    case VIDEOS_APPEND: {
      const {feeds} = state;
      return {
        ...state,
        videos: [...feeds, ...action.payload],
      };
    }
    case VIDEOS_UPDATE: {
      const {videos} = state;
      const {video, index} = action.payload;
      videos[index] = video;
      return {
        ...state,
        videos: [...videos],
      };
    }
    case VIDEOS_REACTIONS_SET: {
      return {
        ...state,
        reactions: action.payload,
      };
    }
    case VIDEOS_REACTIONS_APPEND: {
      const {reactions = []} = state;
      const newItems = [];
      action.payload.docChanges().forEach(({type, doc}) => {
        const reaction = doc.data();
        if (type === 'added') {
          if (!reactions.find((obj) => obj.videoId === reaction.videoId)) {
            newItems.push(reaction);
          }
        } else if (type === 'removed') {
          const index = reactions.findIndex(
            (obj) => obj.videoId === reaction.videoId,
          );
          reactions.splice(index, 1);
        }
      });
      return {
        ...state,
        reactions: [...reactions, ...newItems],
      };
    }
    case VIDEO_ACTIVE: {
      return {...state, active: action.payload};
    }
    case COMPETITION_VIDEO:{
      return {...state, competitionVideos: action.payload}
    }
    case LOCAL_FEED_VIDEO:{
      return {...state, localVideos: action.payload}
    }
    default:
      return state;
  }
}
