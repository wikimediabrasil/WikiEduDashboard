import { RECEIVE_USERS, SORT_USERS, ADD_USER, REMOVE_USER, SET_USERS_PAGE, SET_USERS_LOADING, USERS_PER_PAGE_DEFAULT } from '../constants';
import { sortByKey, transformUsers } from '../utils/model_utils';

const initialState = {
  users: [],
  sort: {
    sortKey: null,
    key: null,
  },
  isLoaded: false,
  loading: false,
  lastRequestTimestamp: 0, // UNIX timestamp of last request - in milliseconds

  pagination: {
    currentPage: 1,
    perPage: USERS_PER_PAGE_DEFAULT,
    totalEntries: 0,
    totalPages: 1,
    previousPage: null,
    nextPage: null,
  }
};

const SORT_DESCENDING = {
  character_sum_ms: true,
  character_sum_us: true,
  character_sum_draft: true,
  recent_revisions: true,
  references_count: true,
  total_uploads: true,

};

export default function users(state = initialState, action) {
  switch (action.type) {
    case RECEIVE_USERS: {
      // Transform the 'real_name' for users in 'action' into separate 'first_name'
      // and 'last_name' properties if 'real_name' is available by using transformUsers.
      let user_list = transformUsers(action.data.course.users);

      // Get the sorting 'key' if available from Redux store or else use last_name or
      // username as fallback if last_name not available.
      const sort_key = state.sort.key || (!user_list.some(user => user.last_name) ? 'username' : 'last_name');

      // Determine if sorting direction should be in reversed or not
      const isReversed = (state.sort.key && !state.sort.sortKey) ? sort_key : null;

      // Sort the 'user_list' array based on the 'sort_key'
      user_list = sortByKey(user_list, sort_key, isReversed, SORT_DESCENDING[sort_key]);

      // Transform pagination from snake_case to camelCase
      const paginationData = action.data.course.pagination;
      const pagination = paginationData ? {
        currentPage: paginationData.current_page,
        perPage: paginationData.per_page,
        totalEntries: paginationData.total_entries,
        totalPages: paginationData.total_pages,
        previousPage: paginationData.previous_page,
        nextPage: paginationData.next_page
      } : state.pagination;

    return {
      ...state,
      users: user_list.newModels, // Update 'users' with the sorted user list.
      isLoaded: true,
      loading: false,
      lastRequestTimestamp: Date.now(),
      pagination // Use transformed pagination
    };
  }
    case SET_USERS_PAGE: {
      return {
        ...state,
        pagination: {
          ...state.pagination,
          currentPage: action.page,
        }
      };
    }
    case SET_USERS_LOADING: {
      return {
        ...state,
        loading: action.loading,
      };
    }
    case ADD_USER:
    case REMOVE_USER: {
      // Transform pagination from snake_case to camelCase if present
      const paginationData = action.data.course.pagination;
      const pagination = paginationData ? {
        currentPage: paginationData.current_page,
        perPage: paginationData.per_page,
        totalEntries: paginationData.total_entries,
        totalPages: paginationData.total_pages,
        previousPage: paginationData.previous_page,
        nextPage: paginationData.next_page
      } : state.pagination;

      return {
        ...state,
        users: action.data.course.users,
        isLoaded: true,
        pagination
      };
    }

    case SORT_USERS: {
      const transformedUsers = transformUsers(state.users);
      const sorted = sortByKey(transformedUsers, action.key, state.sort.sortKey, SORT_DESCENDING[action.key]);
      return {
        ...state,
        users: sorted.newModels,
        sort: {
          sortKey: sorted.newKey,
          key: action.key,
        }
      };
    }

    default:
      return state;
  }
}
