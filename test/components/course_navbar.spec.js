import '../testHelper';

// jsdom test env lacks TextEncoder/TextDecoder which react-dom needs
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;
global.IS_REACT_ACT_ENVIRONMENT = true;

const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = require('react-dom/test-utils');
const { Provider } = require('react-redux');
const { createStore, applyMiddleware } = require('redux');
const thunk = require('redux-thunk').default;
const { MemoryRouter } = require('react-router-dom');
const reducer = require('../../app/assets/javascripts/reducers').default;
const CourseNavbar = require('../../app/assets/javascripts/components/common/course_navbar.jsx').default;

global.Features = { enableGetHelpButton: false };

const course = {
  id: 1,
  slug: 'School/Course_(Term)',
  title: 'My Course',
  type: 'ClassroomProgramCourse',
  timeline_enabled: false
};

const renderNavbar = (campaigns) => {
  const preloadedState = campaigns ? { campaigns: { campaigns, all_campaigns: [], isLoaded: true, all_campaigns_loaded: false, sort: { key: null, sortKey: null } } } : undefined;
  const store = createStore(reducer, preloadedState, applyMiddleware(thunk));
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    createRoot(container).render(
      React.createElement(Provider, { store },
        React.createElement(MemoryRouter, null,
          React.createElement(CourseNavbar, {
            course,
            location: { pathname: `/courses/${course.slug}` },
            currentUser: { id: 1, isAdvancedRole: true },
            courseLink: `/courses/${course.slug}`
          })))
    );
  });
  return container;
};

describe('CourseNavbar', () => {
  test('links the breadcrumb "Courses" part to the programs page of the first associated campaign', () => {
    const campaigns = [
      { id: 1, slug: 'spring_2024', title: 'Spring 2024' },
      { id: 2, slug: 'fall_2024', title: 'Fall 2024' }
    ];
    const container = renderNavbar(campaigns);
    const link = container.querySelector('.campaign-breadcrumb__part a');
    expect(link.getAttribute('href')).toBe('/campaigns/spring_2024/programs');
    expect(container.innerHTML).toContain(course.title);
  });

  test('falls back to /explore when the course has no associated campaigns', () => {
    const container = renderNavbar([]);
    const link = container.querySelector('.campaign-breadcrumb__part a');
    expect(link.getAttribute('href')).toBe('/explore');
  });

  test('renders a Tags nav link pointing to the course tags page', () => {
    const container = renderNavbar([]);
    const tagsLink = container.querySelector('#tags-link a');
    expect(tagsLink).not.toBeNull();
    expect(tagsLink.getAttribute('href')).toBe(`/courses/${course.slug}/tags`);
  });
});
