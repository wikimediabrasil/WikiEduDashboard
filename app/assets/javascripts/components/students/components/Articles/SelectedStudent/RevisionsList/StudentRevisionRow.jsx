import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

// Components
import ContentAdded from '@components/students/shared/StudentList/Student/ContentAdded.jsx';
import { setUploadFilters } from '~/app/assets/javascripts/actions/uploads_actions';

const PENDING_HOURS_THRESHOLD = 24;

export const StudentRevisionRow = ({ course, isOpen, toggleDrawer, student, uploadsLink, userRevisions }) => {
  const revisions = userRevisions?.[student.username] || [];
  const revertedCount = revisions.filter(r => r.reverted).length;
  const acceptedCount = revisions.filter(r => {
    if (r.reverted) return false;
    const hours = (Date.now() - new Date(r.timestamp).getTime()) / (1000 * 60 * 60);
    return hours >= PENDING_HOURS_THRESHOLD;
  }).length;

  const resolvedCount = acceptedCount + revertedCount;
  const acceptanceRate = resolvedCount > 0
    ? Math.round((acceptedCount / resolvedCount) * 100)
    : null;
  const rateColor = acceptanceRate === null ? '#888'
    : acceptanceRate >= 80 ? '#155724'
    : acceptanceRate >= 50 ? '#856404'
    : '#721c24';

  return (
    <tr onClick={toggleDrawer} className={`students ${isOpen ? 'open' : ''}`}>
      <td className="desktop-only-tc">{student.recent_revisions}</td>
      <td className="desktop-only-tc">
        <ContentAdded course={course} student={student} />
      </td>
      <td className="desktop-only-tc">
        {student.references_count}
      </td>
      <td className="desktop-only-tc" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
        <div style={{ color: rateColor, fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.2 }}>
          {acceptanceRate !== null ? `${acceptanceRate}%` : '—'}
        </div>
        <div style={{ fontSize: '0.72rem', marginTop: '3px', color: '#555' }}>
          <span style={{ color: '#155724', fontWeight: 600 }} title={I18n.t('revisions.status_accepted')}>
            {acceptedCount}✓
          </span>
          {' · '}
          <span style={{ color: '#721c24', fontWeight: 600 }} title={I18n.t('revisions.status_reverted')}>
            {revertedCount}✗
          </span>
        </div>
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
