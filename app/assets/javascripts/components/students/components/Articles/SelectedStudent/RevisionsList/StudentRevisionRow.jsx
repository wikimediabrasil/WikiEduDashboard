import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

// Components
import ContentAdded from '@components/students/shared/StudentList/Student/ContentAdded.jsx';
import { setUploadFilters } from '~/app/assets/javascripts/actions/uploads_actions';

export const StudentRevisionRow = ({ course, isOpen, toggleDrawer, student, uploadsLink, userRevisions, revisionAcceptances }) => {
  const revisions = userRevisions?.[student.username] || [];
  // Exclude revisions that have been accepted by admin from reverted count
  const revertedCount = revisions.filter(r => {
    const mwRevId = r.mw_rev_id || r.revid;
    const isAccepted = revisionAcceptances?.byMwRevId?.[mwRevId];
    return r.reverted && !isAccepted;  // Only count as reverted if NOT accepted by admin
  }).length;

  // Calculate acceptance percentage
  let acceptancePercentage = 0;
  if (revisions.length > 0) {
    const acceptedCount = revisions.filter(r => {
      const mwRevId = r.mw_rev_id || r.revid;
      return revisionAcceptances?.byMwRevId?.[mwRevId];
    }).length;
    acceptancePercentage = Math.round((acceptedCount / revisions.length) * 100);
  }

  let contributionStatus;
  if (revertedCount > 0) {
    contributionStatus = 'reverted';
  } else if (revisions.length > 0 && acceptancePercentage === 100) {
    contributionStatus = 'accepted';
  } else if (revisions.length > 0 && acceptancePercentage > 0) {
    contributionStatus = 'reviewed';
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
  userRevisions: PropTypes.object,
  revisionAcceptances: PropTypes.object
};

export default StudentRevisionRow;
