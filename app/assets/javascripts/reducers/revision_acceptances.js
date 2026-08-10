import {
  RECEIVE_REVISION_ACCEPTANCES,
  UPSERT_REVISION_ACCEPTANCE,
  UNACCEPT_REVISION
} from '../constants/revision_acceptances';

// State shape: { byMwRevId: { [mw_rev_id]: acceptance_record }, loaded: bool }
const initialState = { byMwRevId: {}, loaded: false };

export default function revisionAcceptances(state = initialState, action) {
  switch (action.type) {
    case RECEIVE_REVISION_ACCEPTANCES: {
      if (!Array.isArray(action.data)) return state;
      const byMwRevId = Object.fromEntries(
        action.data.filter(a => a?.mw_rev_id).map(a => [a.mw_rev_id, a])
      );
      return { byMwRevId, loaded: true };
    }
    // Handles both validate and invalidate — any upsert of a review record
    case UPSERT_REVISION_ACCEPTANCE: {
      if (!action.acceptance?.mw_rev_id) return state;
      return {
        ...state,
        byMwRevId: { ...state.byMwRevId, [action.acceptance.mw_rev_id]: action.acceptance }
      };
    }
    case UNACCEPT_REVISION: {
      const { [action.mwRevId]: _removed, ...rest } = state.byMwRevId;
      return { ...state, byMwRevId: rest };
    }
    default:
      return state;
  }
}
