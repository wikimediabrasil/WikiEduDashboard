import {
  RECEIVE_REVISION_ACCEPTANCES,
  ACCEPT_REVISION,
  UNACCEPT_REVISION
} from '../constants/revision_acceptances';

// State shape: { byMwRevId: { [mw_rev_id]: acceptance_record }, loaded: bool }
const initialState = { byMwRevId: {}, loaded: false };

export default function revisionAcceptances(state = initialState, action) {
  switch (action.type) {
    case RECEIVE_REVISION_ACCEPTANCES: {
      const byMwRevId = {};
      action.data.forEach(a => { byMwRevId[a.mw_rev_id] = a; });
      return { byMwRevId, loaded: true };
    }
    case ACCEPT_REVISION:
      return {
        ...state,
        byMwRevId: { ...state.byMwRevId, [action.acceptance.mw_rev_id]: action.acceptance }
      };
    case UNACCEPT_REVISION: {
      const next = { ...state.byMwRevId };
      delete next[action.mwRevId];
      return { ...state, byMwRevId: next };
    }
    default:
      return state;
  }
}
