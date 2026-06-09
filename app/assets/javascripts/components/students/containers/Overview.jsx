import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';

import { getStudentUsers } from '~/app/assets/javascripts/selectors';
import { fetchRevisionAcceptances } from '~/app/assets/javascripts/actions/revision_acceptance_actions';
import { fetchUserRevisions } from '~/app/assets/javascripts/actions/user_revisions_actions';

import StudentsSubNavigation from '@components/students/components/StudentsSubNavigation.jsx';
import Controls from '@components/students/components/Overview/Controls/Controls.jsx';
import StudentList from '../shared/StudentList/StudentList.jsx';
import RandomPeerAssignButton from '@components/students/components/RandomPeerAssignButton.jsx';
import Loading from '@components/common/loading.jsx';
import AddToWatchlistButton from '@components/students/components/AddToWatchlistButton.jsx';

const Overview = ({ course, current_user, prefix, sortUsers, notify, sortSelect }) => {
  const assignments = useSelector(state => state.assignments.assignments);
  const loadingAssignments = useSelector(state => state.assignments.loading);
  const students = useSelector(state => getStudentUsers(state));
  const revisionAcceptances = useSelector(state => state.revisionAcceptances);
  const userRevisions = useSelector(state => state.userRevisions);
  const dispatch = useDispatch();

  useEffect(() => {
    // sets the title of this tab
    const header = I18n.t('users.sub_navigation.student_overview', { prefix });
    document.title = `${course.title} - ${header}`;
  }, []);

  useEffect(() => {
    // Load revision acceptances on page load for persistence
    if (!revisionAcceptances.loaded) {
      dispatch(fetchRevisionAcceptances(course.slug));
    }
  }, [course.slug, revisionAcceptances.loaded, dispatch]);

  useEffect(() => {
    // Load all student revisions on page load for badge calculations
    if (!loadingAssignments && students.length > 0) {
      students.forEach(student => {
        if (!userRevisions[student.username]) {
          dispatch(fetchUserRevisions(course, student));
        }
      });
    }
  }, [loadingAssignments, students, userRevisions, course, dispatch]);

  return (
    <div className="list__wrapper">
      <StudentsSubNavigation
        course={course}
        heading={I18n.t('instructor_view.overview', { prefix })}
        prefix={prefix}
      />
      {
        current_user.isAdvancedRole
          ? (
            <Controls
              course={course}
              current_user={current_user}
              students={students}
              notify={notify}
              sortSelect={sortSelect}
            />
          ) : null
      }

      <div className="action-buttons-container">
        <RandomPeerAssignButton current_user={current_user} course={course} assignments={assignments} students={students} />
        { Features.wikiEd && current_user.isAdvancedRole ? (<AddToWatchlistButton slug={course.slug} prefix={prefix} />) : null }
      </div>

      {loadingAssignments && <Loading />}

      {!loadingAssignments && (
        <StudentList
          assignments={assignments}
          course={course}
          current_user={current_user}
          sortUsers={sortUsers}
          students={students}
          revisionAcceptances={revisionAcceptances}
          userRevisions={userRevisions}
        />)}
    </div>
  );
};

Overview.propTypes = {
  course: PropTypes.object.isRequired,
  current_user: PropTypes.object.isRequired,
  prefix: PropTypes.string.isRequired,
  sortSelect: PropTypes.func.isRequired,
  sortUsers: PropTypes.func.isRequired
};

export default (Overview);
