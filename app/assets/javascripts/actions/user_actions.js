import API from '../utils/api.js';
import request from '../utils/request.js';
import { RECEIVE_USERS, ADD_USER, REMOVE_USER, SORT_USERS, API_FAIL, DONE_REFRESHING_DATA } from '../constants';
import { ACCEPT_STUDENT, UNACCEPT_STUDENT } from '../constants/users';

export const fetchUsers = (courseSlug, refresh = false) => (dispatch) => {
  return API.fetch(courseSlug, 'users')
    .then((data) => {
      dispatch({ type: RECEIVE_USERS, data });
      if (refresh) {
        dispatch({ type: DONE_REFRESHING_DATA });
      }
    })
    .catch(data => dispatch({ type: API_FAIL, data }));
};

export const addUser = (courseSlug, user) => (dispatch) => {
  return API.modify('user', courseSlug, user, true)
    .then(data => dispatch({ type: ADD_USER, data }))
    .catch(data => dispatch({ type: API_FAIL, data }));
};

export const removeUser = (courseSlug, user) => (dispatch) => {
  return API.modify('user', courseSlug, user, false)
    .then(data => dispatch({ type: REMOVE_USER, data }))
    .catch(data => dispatch({ type: API_FAIL, data }));
};

export const sortUsers = key => ({ type: SORT_USERS, key });

export const acceptStudentContributions = coursesUserId => async (dispatch) => {
  try {
    const response = await request(`/courses_users/${coursesUserId}/accept`, { method: 'PUT' });
    if (!response.ok) {
      dispatch({ type: API_FAIL, data: response });
      return;
    }
    const data = await response.json();
    dispatch({ type: ACCEPT_STUDENT, coursesUserId, ...data });
  } catch (e) {
    dispatch({ type: API_FAIL, data: e });
  }
};

export const unacceptStudentContributions = coursesUserId => async (dispatch) => {
  try {
    const response = await request(`/courses_users/${coursesUserId}/accept`, { method: 'DELETE' });
    if (!response.ok) {
      dispatch({ type: API_FAIL, data: response });
      return;
    }
    dispatch({ type: UNACCEPT_STUDENT, coursesUserId });
  } catch (e) {
    dispatch({ type: API_FAIL, data: e });
  }
};
