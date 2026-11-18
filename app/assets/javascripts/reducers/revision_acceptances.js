import {
  RECEIVE_REVISION_ACCEPTANCES,
  UPSERT_REVISION_ACCEPTANCE,
  UNACCEPT_REVISION
} from '../constants/revision_acceptances';

// Revision IDs are scoped to a wiki.
export const revisionKey = (wikiId, revisionId) => `${wikiId}:${revisionId}`;
const initialState = { byMwRevId: {}, loaded: false };

export default function revisionAcceptances(state = initialState, action) {
  switch (action.type) {
    case RECEIVE_REVISION_ACCEPTANCES: {
      if (!Array.isArray(action.data)) return state;
      const byMwRevId = Object.fromEntries(
        action.data.filter(a => a?.mw_rev_id).map(a => [revisionKey(a.wiki_id, a.mw_rev_id), a])
      );
      return { byMwRevId, loaded: true, courseSlug: action.courseSlug };
    }
    // Handles both validate and invalidate — any upsert of a review record
    case UPSERT_REVISION_ACCEPTANCE: {
      if (!action.acceptance?.mw_rev_id) return state;
      return {
        ...state,
        byMwRevId: { ...state.byMwRevId, [revisionKey(action.acceptance.wiki_id, action.acceptance.mw_rev_id)]: action.acceptance }
      };
    }
    case UNACCEPT_REVISION: {
      const { [revisionKey(action.wikiId, action.mwRevId)]: _removed, ...rest } = state.byMwRevId;
      return { ...state, byMwRevId: rest };
    }
    default:
      return state;
  }
}
