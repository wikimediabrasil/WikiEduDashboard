import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import GetHelpButton from './get_help_button.jsx';
import CourseUtils from '../../utils/course_utils.js';


const CourseNavbar = ({ course, location, currentUser, courseLink }) => {
  // ///////////////////////
  // Course title/breadcrumb
  // ///////////////////////
  const campaigns = useSelector(state => state.campaigns.campaigns);
  const campaignProgramsLink = CourseUtils.campaignProgramsLink(campaigns);

  const courseTitleElement = course.url
    ? <a href={course.url} target="_blank">{course.title}</a>
    : <span>{course.title}</span>;

  const courseLinkElement = (
    <div className="nav__item">
      <h2 id="course-nav-label" className="title">
        <span className="campaign-breadcrumb__part">
          <a href={campaignProgramsLink}>{I18n.t('courses.courses')}</a>
        </span>
        <span className="campaign-breadcrumb__separator"> / </span>
        <span className="campaign-breadcrumb__part">{courseTitleElement}</span>
      </h2>
    </div>
  );

  // ////////////
  // Home link //
  // ////////////

  let homeLinkClassName;
  if (CourseUtils.onCourseIndex(location)) { homeLinkClassName = 'active'; }
  const homeLink = `${courseLink}/home`;

  // ///////////////
  // Variable tabs /
  // ///////////////
  let timeline;
  if (course.timeline_enabled) {
    const timelineLink = `${courseLink}/timeline`;
    timeline = (
      <div className="nav__item" id="timeline-link">
        <p><NavLink to={timelineLink} className={({ isActive }) => (isActive ? 'active' : '')}>{I18n.t('courses.timeline_link')}</NavLink></p>
      </div>
    );
  }

  let resources;
  if (course.timeline_enabled) {
    const resourcesLink = `${courseLink}/resources`;
    resources = (
      <div className="nav__item" id="resources-link">
        <p><NavLink to={resourcesLink} className={({ isActive }) => (isActive ? 'active' : '')}>{I18n.t('resources.label')}</NavLink></p>
      </div>
    );
  }

  let users;
  if (course.type !== 'SingleUser') {
    const studentsLink = `${courseLink}/students`;
    users = (
      <div className="nav__item" id="students-link">
        <p><NavLink to={studentsLink} className={({ isActive }) => (isActive ? 'active' : '')}>{CourseUtils.i18n('students_short', course.string_prefix)}</NavLink></p>
      </div>
    );
  }

  // //////////////
  // Common tabs //
  // //////////////
  const articlesLink = `${courseLink}/articles`;
  const uploadsLink = `${courseLink}/uploads`;
  const activityLink = `${courseLink}/activity`;
  const tagsLink = `${courseLink}/tags`;

  // /////////////////
  // Get Help button /
  // /////////////////
  let getHelp;
  if (Features.enableGetHelpButton) {
    getHelp = (
      <div className="nav__button" id="get-help-button">
        <GetHelpButton course={course} currentUser={currentUser} key="get_help" />
      </div>
    );
  }

  return (
    <div className="container">
      {courseLinkElement}
      <nav aria-labelledby="course-nav-label">
        <div className="nav__item" id="overview-link">
          <p><NavLink to={homeLink} className={({ isActive }) => (isActive ? 'active' : homeLinkClassName)}>{I18n.t('courses.overview')}</NavLink></p>
        </div>
        {timeline}
        {users}
        <div className="nav__item" id="articles-link">
          <p><NavLink to={articlesLink} className={({ isActive }) => (isActive ? 'active' : '')}>{CourseUtils.i18n('articles_short', course.wiki_string_prefix)}</NavLink></p>
        </div>
        <div className="nav__item" id="uploads-link">
          <p><NavLink to={uploadsLink} className={({ isActive }) => (isActive ? 'active' : '')}>{I18n.t('uploads.label')}</NavLink></p>
        </div>
        <div className="nav__item" id="activity-link">
          <p><NavLink to={activityLink} className={({ isActive }) => (isActive ? 'active' : '')}>{I18n.t('activity.label')}</NavLink></p>
        </div>
        <div className="nav__item" id="tags-link">
          <p><NavLink to={tagsLink} className={({ isActive }) => (isActive ? 'active' : '')}>{I18n.t('campaign.tags')}</NavLink></p>
        </div>
        {resources}
        {getHelp}
      </nav>
    </div>
  );
};

CourseNavbar.propTypes = {
  course: PropTypes.object,
  location: PropTypes.object,
  currentUser: PropTypes.object,
  courseLink: PropTypes.string
};

export default CourseNavbar;
