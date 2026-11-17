import { RECEIVE_USER_REVISIONS } from '../constants';

const initialState = {};

export default function userRevisions(state = initialState, action) {
  switch (action.type) {
    case RECEIVE_USER_REVISIONS: {
      // Merge wiki information, so that titles
      // can correctly show
      const revisions = action.revisions.map((rev) => {
        const wiki = rev.wiki || action.wiki;
        return {
          ...rev,
          wiki,
          article: {
            title: rev.title,
            language: wiki.language,
            project: wiki.project
          },
          tags: rev.tags || [],
          reverted: (rev.tags || []).includes('mw-reverted')
        };
      });

      return {
        ...state,
        [action.courseSlug]: {
          ...state[action.courseSlug],
          [action.username]: revisions
        }
      };
    }
    default:
      return state;
  }
}
