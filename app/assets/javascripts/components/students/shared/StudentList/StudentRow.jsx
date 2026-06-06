import React from 'react';
import PropTypes from 'prop-types';

import Student from './Student/Student.jsx';
import useNavigationsUtils from '../../../../hooks/useNavigationUtils.js';

export const StudentRow = ({
  assignments, course, current_user, editAssignments, showRecent, student, wikidataLabels, revisionAcceptances, userRevisions
}) => {
  const { openStudentDetailsView } = useNavigationsUtils();
  return (
    <Student
      assignments={assignments}
      course={course}
      current_user={current_user}
      editable={editAssignments}
      showRecent={showRecent}
      student={student}
      wikidataLabels={wikidataLabels}
      openStudentDetailsView={openStudentDetailsView}
      revisionAcceptances={revisionAcceptances}
      userRevisions={userRevisions}
    />
  );
};

StudentRow.propTypes = {
  assignments: PropTypes.array,
  course: PropTypes.object.isRequired,
  current_user: PropTypes.object.isRequired,
  editAssignments: PropTypes.bool,
  openKey: PropTypes.string,
  showRecent: PropTypes.bool.isRequired,
  student: PropTypes.object.isRequired,
  wikidataLabels: PropTypes.object,
  revisionAcceptances: PropTypes.object,
  userRevisions: PropTypes.object
};

export default StudentRow;
