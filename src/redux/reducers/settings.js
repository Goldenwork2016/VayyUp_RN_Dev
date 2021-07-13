import {
  TOGGLE_SOUND,
  SETTINGS_SHOW_PROMO,
  SETTINGS_SHOW_VIDEO,
  SETTINGS_UPGRADE,
} from './action.types';

const initialState = {
  muted: false,
  showPromo: false,
  videoId: null,
  videoType: null,
  upgradeNeeded: false,
};

export default function (state = initialState, action = {}) {
  switch (action.type) {
    case TOGGLE_SOUND: {
      const {muted} = state;
      return {
        ...state,
        muted: !muted,
      };
    }
    case SETTINGS_SHOW_PROMO:
      return {
        ...state,
        showPromo: action.payload,
      };
    case SETTINGS_SHOW_VIDEO:
      const {videoId} = state;
      const {payload} = action;
      if (videoId !== payload.videoId) {
        return {
          ...state,
          videoId: payload.videoId,
          videoType: payload.videoType,
        };
      }
      return state;
    case SETTINGS_UPGRADE:
      return {
        ...state,
        upgradeNeeded: action.payload,
      };
    default:
      return state;
  }
}
