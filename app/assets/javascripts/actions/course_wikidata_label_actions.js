import {
  RECEIVE_COURSE_WIKIDATA_LABELS,
  ADD_COURSE_WIKIDATA_LABEL,
  REMOVE_COURSE_WIKIDATA_LABEL,
  API_FAIL,
} from '../constants';
import logErrorMessage from '../utils/log_error_message';
import request from '../utils/request';

const fetchCourseWikidataLabelsPromise = async (courseSlug) => {
  const response = await request(`/courses/${courseSlug}/wikidata_labels.json`);
  if (!response.ok) {
    logErrorMessage(response);
    const data = await response.text();
    response.responseText = data;
    throw response;
  }
  return response.json();
};

export const fetchCourseWikidataLabels = courseSlug => (dispatch) => {
  return fetchCourseWikidataLabelsPromise(courseSlug)
    .then(data => dispatch({ type: RECEIVE_COURSE_WIKIDATA_LABELS, data }))
    .catch(response => dispatch({ type: API_FAIL, data: response }));
};

const addCourseWikidataLabelPromise = async (courseSlug, label) => {
  const response = await request(`/courses/${courseSlug}/wikidata_labels`, {
    method: 'POST',
    body: JSON.stringify({ label }),
  });
  if (!response.ok) {
    logErrorMessage(response);
    const data = await response.text();
    response.responseText = data;
    throw response;
  }
  return response.json();
};

export const addCourseWikidataLabel = (courseSlug, label) => (dispatch) => {
  return addCourseWikidataLabelPromise(courseSlug, label)
    .then(data => dispatch({ type: ADD_COURSE_WIKIDATA_LABEL, data }))
    .catch(response => dispatch({ type: API_FAIL, data: response }));
};

const removeCourseWikidataLabelPromise = async (courseSlug, qNumber) => {
  const response = await request(`/courses/${courseSlug}/wikidata_labels`, {
    method: 'DELETE',
    body: JSON.stringify({ qNumber }),
  });
  if (!response.ok) {
    logErrorMessage(response);
    const data = await response.text();
    response.responseText = data;
    throw response;
  }
  return response.json();
};

export const removeCourseWikidataLabel = (courseSlug, qNumber) => (dispatch) => {
  return removeCourseWikidataLabelPromise(courseSlug, qNumber)
    .then(() => dispatch({ type: REMOVE_COURSE_WIKIDATA_LABEL, data: { qNumber } }))
    .catch(response => dispatch({ type: API_FAIL, data: response }));
};
