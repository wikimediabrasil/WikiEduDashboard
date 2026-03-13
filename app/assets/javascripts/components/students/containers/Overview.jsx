import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';

import { getStudentUsers, getUserPagination } from '~/app/assets/javascripts/selectors';
import { changeUsersPage } from '~/app/assets/javascripts/actions/user_actions';

import StudentsSubNavigation from '@components/students/components/StudentsSubNavigation.jsx';
import Controls from '@components/students/components/Overview/Controls/Controls.jsx';
import StudentList from '../shared/StudentList/StudentList.jsx';
import RandomPeerAssignButton from '@components/students/components/RandomPeerAssignButton.jsx';
import Loading from '@components/common/loading.jsx';
import AddToWatchlistButton from '@components/students/components/AddToWatchlistButton.jsx';
import Pagination from '@components/common/Pagination.jsx';

const Overview = ({ course, current_user, prefix, sortUsers, notify, sortSelect }) => {
  const dispatch = useDispatch();
  const assignments = useSelector(state => state.assignments.assignments);
  const loadingAssignments = useSelector(state => state.assignments.loading);
  const students = useSelector(state => getStudentUsers(state));
  const pagination = useSelector(state => getUserPagination(state));
  const loading = useSelector(state => state.users.loading);

  useEffect(() => {
    // sets the title of this tab
    const header = I18n.t('users.sub_navigation.student_overview', { prefix });
    document.title = `${course.title} - ${header}`;
  }, []);

  const handlePageChange = (newPage) => {
    dispatch(changeUsersPage(course.slug, newPage));
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top when page changes
  };

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

      {(loadingAssignments || loading) && <Loading />}

      {!loadingAssignments && !loading && (
        <>

          <StudentList
            assignments={assignments}
            course={course}
            current_user={current_user}
            sortUsers={sortUsers}
            students={students}
          />
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={pagination.perPage}
            totalItems={pagination.totalEntries}
          />
        </>
        )}
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
