import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

// Components
import ContentAdded from '@components/students/shared/StudentList/Student/ContentAdded.jsx';
import { setUploadFilters } from '~/app/assets/javascripts/actions/uploads_actions';

export const StudentRevisionRow = ({ course, isOpen, toggleDrawer, student, uploadsLink, userRevisions, revisionAcceptances }) => {
  const revisions = userRevisions?.[student.username] || [];
  const total = revisions.length;
  const revertedCount = revisions.filter(r => r.reverted).length;

  const acceptedCount = revisions.filter((r) => {
    const mwRevId = r.mw_rev_id || r.revid;
    return revisionAcceptances?.byMwRevId?.[mwRevId]?.status === 'accepted';
  }).length;

  const invalidatedCount = revisions.filter((r) => {
    const mwRevId = r.mw_rev_id || r.revid;
    return revisionAcceptances?.byMwRevId?.[mwRevId]?.status === 'invalidated';
  }).length;

  const reviewedCount = acceptedCount + invalidatedCount;
  const pendingCount = total - reviewedCount - revertedCount;
  const acceptedPct = total > 0 ? Math.round((acceptedCount / total) * 100) : 0;
  const invalidatedPct = total > 0 ? Math.round((invalidatedCount / total) * 100) : 0;

  let statusBadge;
  if (revertedCount > 0) {
    statusBadge = (
      <span
        className="contribution-status contribution-status--reverted"
        title={`${revertedCount} ${I18n.t('revisions.status_reverted')}`}
      >
        {revertedCount} {I18n.t('revisions.status_reverted')}
      </span>
    );
  } else if (total > 0 && reviewedCount === total) {
    statusBadge = (
      <span
        className="contribution-status contribution-status--reviewed"
        title={I18n.t('revisions.status_reviewed_tooltip')}
      >
        {I18n.t('revisions.status_reviewed')}
      </span>
    );
  } else {
    statusBadge = (
      <span
        className="contribution-status contribution-status--under-review"
        title={I18n.t('revisions.status_under_review_tooltip')}
      >
        {I18n.t('revisions.status_under_review')}
      </span>
    );
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
      <td className="desktop-only-tc">
        {statusBadge}
        {total > 0 && (
          <div className="review-progress">
            <div className="review-progress__bar-track">
              <div
                className="review-progress__bar-fill review-progress__bar-fill--accepted"
                style={{ width: `${acceptedPct}%` }}
              />
              <div
                className="review-progress__bar-fill review-progress__bar-fill--invalidated"
                style={{ width: `${invalidatedPct}%` }}
              />
            </div>
            <div className="review-progress__label">
              {reviewedCount}/{total} {I18n.t('revisions.reviewed')} &middot; {pendingCount} {I18n.t('revisions.pending')}
            </div>
          </div>
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
