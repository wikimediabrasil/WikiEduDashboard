import { RECEIVE_USER_REVISIONS, API_FAIL } from '../constants';
import { fetchLatestRevisionsForUser } from '../utils/mediawiki_revisions_utils';

export const fetchUserRevisions = (course, user) => async (dispatch, getState) => {
  // Don't refetch a user's revisions if they are already in the store.
  if (getState().userRevisions[course.slug]?.[user.username]) { return; }

  // Fetch revisions from all wikis in the course
  const wikiPromises = course.wikis.map(wiki =>
    fetchLatestRevisionsForUser(user.username, wiki)
      .then(revisions => ({ revisions, wiki }))
      .catch(() => ({ revisions: [], wiki }))
  );

  try {
    const results = await Promise.all(wikiPromises);
    // Revision IDs are unique within a wiki, not across all wikis.
    const seen = new Set();
    const allRevisions = results.flatMap(result =>
      result.revisions.map(rev => ({ ...rev, wiki: result.wiki }))
    ).filter(rev => {
      const timestamp = Date.parse(rev.timestamp);
      if (timestamp < Date.parse(course.start) || timestamp > Date.parse(course.end)) return false;
      const key = `${rev.wiki.id}:${rev.revid}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    dispatch({
      type: RECEIVE_USER_REVISIONS,
      revisions: allRevisions,
      username: user.username,
      courseSlug: course.slug,
      wiki: course.home_wiki
    });
  } catch (response) {
    dispatch({ type: API_FAIL, data: response });
  }
};

