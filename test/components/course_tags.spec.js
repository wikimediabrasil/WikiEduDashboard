import '../testHelper';

const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;
global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../../app/assets/javascripts/actions/course_wikidata_label_actions', () => ({
  fetchCourseWikidataLabels: jest.fn(() => ({ type: 'FETCH_COURSE_WIKIDATA_LABELS_TEST' })),
}));

const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = require('react-dom/test-utils');
const { Provider } = require('react-redux');
const { createStore } = require('redux');
const CourseTags = require('../../app/assets/javascripts/components/course/course_tags.jsx').default;
const { fetchCourseWikidataLabels } = require('../../app/assets/javascripts/actions/course_wikidata_label_actions');

const course = {
  slug: 'School/Creative_Course',
  title: 'Creative Course',
};

const labels = [
  {
    match: 'Q12147',
    label: 'health',
    description: 'state of physical and mental well-being',
    url: 'https://www.wikidata.org/wiki/Q12147',
  },
  {
    match: 'Q189603',
    label: 'public health',
    description: '',
    url: 'https://www.wikidata.org/wiki/Q189603',
  },
];

const renderCourseTags = (courseLabels = labels) => {
  const store = createStore(state => state, {
    wikidataLabels: { labels: {}, courseLabels },
  });
  const container = document.createElement('div');
  document.body.appendChild(container);

  act(() => {
    createRoot(container).render(
      React.createElement(Provider, { store },
        React.createElement(CourseTags, {
          course,
          current_user: { isAdmin: false },
        }))
    );
  });

  return container;
};

describe('CourseTags', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('renders Wikidata topics as a numbered visual index', () => {
    const container = renderCourseTags();
    const cards = container.querySelectorAll('.course-tag-card');

    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('01');
    expect(cards[0].textContent).toContain('health');
    expect(cards[0].textContent).toContain('Q12147');
    expect(cards[0].getAttribute('href')).toBe(labels[0].url);
    expect(container.querySelector('.course-tags-header__total strong').textContent).toBe('2');
  });

  test('shows the empty state when the course has no topics', () => {
    const container = renderCourseTags([]);

    expect(container.querySelector('.course-tags-empty')).not.toBeNull();
    expect(container.querySelectorAll('.course-tag-card')).toHaveLength(0);
  });

  test('loads labels for the current course', () => {
    renderCourseTags();

    expect(fetchCourseWikidataLabels).toHaveBeenCalledWith(course.slug);
  });
});
