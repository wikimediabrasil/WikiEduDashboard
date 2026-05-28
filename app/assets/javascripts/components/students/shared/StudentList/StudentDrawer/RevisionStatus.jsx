import React from 'react';
import PropTypes from 'prop-types';

const PENDING_HOURS_THRESHOLD = 48;

const RevisionStatus = ({ revision }) => {
  if (revision.reverted) {
    return (
      <span
        className="revision-status revision-status--reverted"
        title={I18n.t('revisions.status_reverted_tooltip')}
      >
        {I18n.t('revisions.status_reverted')}
      </span>
    );
  }

  const hoursSinceEdit = (Date.now() - new Date(revision.timestamp).getTime()) / (1000 * 60 * 60);
  if (hoursSinceEdit < PENDING_HOURS_THRESHOLD) {
    return (
      <span
        className="revision-status revision-status--pending"
        title={I18n.t('revisions.status_pending_tooltip')}
      >
        {I18n.t('revisions.status_pending')}
      </span>
    );
  }

  return (
    <span
      className="revision-status revision-status--accepted"
      title={I18n.t('revisions.status_accepted_tooltip')}
    >
      {I18n.t('revisions.status_accepted')}
    </span>
  );
};

RevisionStatus.propTypes = {
  revision: PropTypes.shape({
    reverted: PropTypes.bool,
    timestamp: PropTypes.string
  }).isRequired
};

export default RevisionStatus;
