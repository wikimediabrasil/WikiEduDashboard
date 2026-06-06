import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

// Components
import ContentAdded from '@components/students/shared/StudentList/Student/ContentAdded.jsx';
import { setUploadFilters } from '~/app/assets/javascripts/actions/uploads_actions';

export const StudentRevisionRow = ({ course, isOpen, toggleDrawer, student, uploadsLink, userRevisions }) => {
  const revisions = userRevisions?.[student.username] || [];
  const revertedCount = revisions.filter(r => r.reverted).length;
  const isAdminAccepted = Boolean(student.accepted_by_id);

  let contributionStatus;
  if (revertedCount > 0) {
    contributionStatus = 'reverted';
  } else if (isAdminAccepted) {
    contributionStatus = 'accepted';
  } else {
    contributionStatus = 'under_review';
  }

  return (
    <tr onClick={toggleDrawer} className={`students ${isOpen ? 'open' : ''}`}>
      <td className="desktop-only-tc">{student.recent_revisions}</td>
      <td className="desktop-only-tc">
        <ContentAdded course={course} student={student} />
      </td>
      <td className="desktop-only-tc">
        {student.references_count}
      </td>
      <td className="desktop-only-tc" style={{ textAlign: 'center' }}>
        {contributionStatus === 'reverted' && (
          <span
            className="contribution-status contribution-status--reverted"
            title={`${revertedCount} ${I18n.t('revisions.status_reverted')}`}
          >
            ✗ {revertedCount} {I18n.t('revisions.status_reverted')}
          </span>
        )}
        {contributionStatus === 'under_review' && (
          <span
            className="contribution-status contribution-status--under-review"
            title={I18n.t('revisions.status_under_review_tooltip')}
          >
            {student.recent_revisions} {I18n.t('revisions.status_under_review')}
          </span>
        )}
        {contributionStatus === 'accepted' && (
          <span
            className="contribution-status contribution-status--accepted"
            title={I18n.t('revisions.status_admin_accepted_tooltip')}
          >
            ✓ {I18n.t('revisions.status_admin_accepted')}
          </span>
        )}
      </td>
      <td className="desktop-only-tc">
        <Link
          to={uploadsLink}
          onClick={() => { setUploadFilters([{ value: student.username, label: student.username }]); }}
        >
          {student.total_uploads || 0}
        </Link>
      </td>
      <td><button className="icon icon-arrow-toggle table-expandable-indicator" /></td>
    </tr>
  );
};

StudentRevisionRow.propTypes = {
  course: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  student: PropTypes.shape({
    recent_revisions: PropTypes.number.isRequired,
    references_count: PropTypes.number.isRequired,
    total_uploads: PropTypes.number,
    username: PropTypes.string.isRequired
  }).isRequired,
  uploadsLink: PropTypes.string.isRequired,
  userRevisions: PropTypes.object
};

export default StudentRevisionRow;
