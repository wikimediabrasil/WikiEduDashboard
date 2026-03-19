import API from '../utils/api.js';
import { RECEIVE_USERS, ADD_USER, REMOVE_USER, SORT_USERS, API_FAIL, DONE_REFRESHING_DATA, SET_USERS_PAGE, SET_USERS_LOADING, SET_USERS_SORT } from '../constants';
import { addNotification } from './notification_actions.js';

export const fetchUsers = (courseSlug, page = 1, perPage = 25, sortBy = 'created_at', direction = 'desc', refresh = false) => (dispatch) => {
  const url = `/courses/${courseSlug}/users.json?page=${page}&per_page=${perPage}&sort_by=${sortBy}&direction=${direction}`;
  return fetch(url, { credentials: 'include' })
    .then(res => res.json())
    .then((data) => {
      dispatch({ type: RECEIVE_USERS, data });
      if (refresh) {
        dispatch({ type: DONE_REFRESHING_DATA });
      }
    })
    .catch(data => dispatch({ type: API_FAIL, data }));
};

export const changeUsersPage = (courseSlug, page) => (dispatch, getState) => {
  const { perPage } = getState().users.pagination;
  const { sortBy, direction } = getState().users.serverSort;
  dispatch({ type: SET_USERS_LOADING, loading: true });
  dispatch({ type: SET_USERS_PAGE, page });
  return dispatch(fetchUsers(courseSlug, page, perPage, sortBy, direction));
};

export const setUsersPage = page => ({ type: SET_USERS_PAGE, page });

export const addUser = (courseSlug, user) => (dispatch, getState) => {
  return API.modify('user', courseSlug, user, true)
    .then((data) => {
      dispatch({ type: ADD_USER, data });
      // Re-fetch the current page after enrollment so the list respects
      // the active pagination and sort settings instead of showing all users.
      const { currentPage, perPage } = getState().users.pagination;
      const { sortBy, direction } = getState().users.serverSort;
      return dispatch(fetchUsers(courseSlug, currentPage, perPage, sortBy, direction));
    })
    .catch(data => dispatch({ type: API_FAIL, data }));
};

export const removeUser = (courseSlug, user) => (dispatch, getState) => {
  const userId = user.user?.user_id;
  const userInStore = getState().users.users.find(u => u.id === userId);
  const username = userInStore?.username;
  return API.modify('user', courseSlug, user, false)
    .then((data) => {
      dispatch({ type: REMOVE_USER, data });
      if (username) {
        dispatch(addNotification({
          message: I18n.t('users.removed_success', { username }),
          closable: true,
          type: 'success'
        }));
      }
      // Re-fetch the current page after removal so the list respects
      // the active pagination and sort settings instead of showing all users.
      const { currentPage, perPage } = getState().users.pagination;
      const { sortBy, direction } = getState().users.serverSort;
      return dispatch(fetchUsers(courseSlug, currentPage, perPage, sortBy, direction));
    })
    .catch(data => dispatch({ type: API_FAIL, data }));
};

export const changeUsersSort = (courseSlug, sortBy, direction) => (dispatch, getState) => {
  const { perPage } = getState().users.pagination;
  dispatch({ type: SET_USERS_LOADING, loading: true });
  dispatch({ type: SET_USERS_SORT, sortBy, direction });
  dispatch({ type: SET_USERS_PAGE, page: 1 });
  return dispatch(fetchUsers(courseSlug, 1, perPage, sortBy, direction));
};

export const sortUsers = key => ({ type: SORT_USERS, key });
