import request from '../utils/request.js';
import { API_FAIL } from '../constants';
import {
  RECEIVE_REVISION_ACCEPTANCES,
  ACCEPT_REVISION,
  UNACCEPT_REVISION
} from '../constants/revision_acceptances';

export const fetchRevisionAcceptances = courseSlug => async (dispatch) => {
  try {
    const response = await request(`/courses/${courseSlug}/revision_acceptances`);
    if (!response.ok) { return; }
    const data = await response.json();
    dispatch({ type: RECEIVE_REVISION_ACCEPTANCES, data: data.revision_acceptances });
  } catch (e) {
    dispatch({ type: API_FAIL, data: e });
  }
};

export const acceptRevision = (courseSlug, mwRevId, wikiId, userId) => async (dispatch) => {
  try {
    const response = await request(`/courses/${courseSlug}/revision_acceptances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mw_rev_id: mwRevId, wiki_id: wikiId, user_id: userId })
    });
    if (!response.ok) {
      dispatch({ type: API_FAIL, data: response });
      return;
    }
    const data = await response.json();
    dispatch({ type: ACCEPT_REVISION, acceptance: data });
  } catch (e) {
    dispatch({ type: API_FAIL, data: e });
  }
};

export const unacceptRevision = (courseSlug, acceptanceId, mwRevId) => async (dispatch) => {
  try {
    const response = await request(
      `/courses/${courseSlug}/revision_acceptances/${acceptanceId}.json`,
      { method: 'DELETE' }
    );
    if (!response.ok) {
      dispatch({ type: API_FAIL, data: response });
      return;
    }
    dispatch({ type: UNACCEPT_REVISION, acceptanceId, mwRevId });
  } catch (e) {
    dispatch({ type: API_FAIL, data: e });
  }
};
