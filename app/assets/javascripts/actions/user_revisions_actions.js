import { RECEIVE_USER_REVISIONS, API_FAIL } from '../constants';
import { fetchLatestRevisionsForUser } from '../utils/mediawiki_revisions_utils';

export const fetchUserRevisions = (course, user) => async (dispatch, getState) => {
  // Don't refetch a user's revisions if they are already in the store.
  if (getState().userRevisions[user.username]) { return; }

  // Fetch revisions from all wikis in the course
  const wikiPromises = course.wikis.map(wiki =>
    fetchLatestRevisionsForUser(user.username, wiki)
      .then(revisions => ({ revisions, wiki }))
      .catch(() => ({ revisions: [], wiki }))
  );

  try {
    const results = await Promise.all(wikiPromises);
    // Combine all revisions from all wikis
    const allRevisions = results.flatMap(result =>
      result.revisions.map(rev => ({
        ...rev,
        wiki: result.wiki
      }))
    );

    dispatch({
      type: RECEIVE_USER_REVISIONS,
      revisions: allRevisions,
      username: user.username,
      wiki: course.home_wiki
    });
  } catch (response) {
    dispatch({ type: API_FAIL, data: response });
  }
};

