import '../testHelper';

import React from 'react';
import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import WikidataLabelList from '../../app/assets/javascripts/components/overview/wikidata_label_list';
import { fetchCourseWikidataLabels } from '../../app/assets/javascripts/actions/course_wikidata_label_actions';

jest.mock('../../app/assets/javascripts/actions/course_wikidata_label_actions', () => ({
  fetchCourseWikidataLabels: jest.fn(() => ({ type: 'FETCH_COURSE_WIKIDATA_LABELS' })),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

describe('WikidataLabelList', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    jest.clearAllMocks();
  });

  const renderList = (courseLabels) => {
    const state = { wikidataLabels: { courseLabels } };
    const store = {
      getState: () => state,
      dispatch: jest.fn(),
      subscribe: () => () => {},
    };

    act(() => root.render(
      <Provider store={store}>
        <WikidataLabelList course={{ slug: 'School/Health_course' }} />
      </Provider>
    ));

    return store;
  };

  test('loads and displays the Wikidata tags assigned to a course', () => {
    const labels = [{
      match: 'Q12147',
      label: 'Health',
      url: 'https://www.wikidata.org/wiki/Q12147',
      description: 'state of physical and mental well-being',
    }];

    const store = renderList(labels);
    const link = container.querySelector('.wikidata-labels-list a');

    expect(fetchCourseWikidataLabels).toHaveBeenCalledWith('School/Health_course');
    expect(store.dispatch).toHaveBeenCalledWith({ type: 'FETCH_COURSE_WIKIDATA_LABELS' });
    expect(container.textContent).toContain(I18n.t('courses.wikidata_labels'));
    expect(link.textContent).toBe('Health');
    expect(link.href).toBe('https://www.wikidata.org/wiki/Q12147');
    expect(link.title).toBe('state of physical and mental well-being');
  });

  test('shows an empty value when the course has no Wikidata tags', () => {
    renderList([]);

    expect(container.textContent).toContain(I18n.t('courses.wikidata_labels'));
    expect(container.textContent).toContain(I18n.t('courses.none'));
  });
});
