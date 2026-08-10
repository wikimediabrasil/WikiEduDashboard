import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect, useSelector } from 'react-redux';
import { getCurrentUser } from '../../../../../selectors';

// Components
import RevisionRow from './RevisionRow';
import NoRevisionsRow from './NoRevisionsRow';
import FullHistoryRow from './FullHistoryRow';

// Actions
import { fetchRevisionAcceptances, acceptRevision, unacceptRevision, invalidateRevision } from '../../../../../actions/revision_acceptance_actions';

// Auto-dismiss duration for error banner (ms)
const ERROR_DISMISS_MS = 5000;
const PAGE_SIZE = 10;

export const Contributions = ({
  course, revisions, selectedIndex, student, wikidataLabels, showDiff,
  revisionAcceptances,
  fetchRevisionAcceptances: doFetch, acceptRevision: doAccept, invalidateRevision: doInvalidate,
  unacceptRevision: doClear
}) => {
  const current_user = useSelector(getCurrentUser);
  const [reviewError, setReviewError] = useState(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!revisionAcceptances.loaded) {
      doFetch(course.slug);
    }
  }, [course.slug, doFetch, revisionAcceptances.loaded]);

  // Auto-dismiss error after ERROR_DISMISS_MS
  useEffect(() => {
    if (!reviewError) return;
    const t = setTimeout(() => setReviewError(null), ERROR_DISMISS_MS);
    return () => clearTimeout(t);
  }, [reviewError]);

  // Wrap each review action: catch failures and surface them as a banner
  const withErrorFeedback = useCallback((action) => async (...args) => {
    try {
      await action(...args);
    } catch (_e) {
      setReviewError(I18n.t('error.review_save_failed'));
    }
  }, []);

  const wikiId = course.home_wiki?.id;
  const totalPages = Math.ceil(revisions.length / PAGE_SIZE);
  const pageRevisions = revisions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const rows = pageRevisions.map((revision, index) => {
    const mwRevId = revision.mw_rev_id || revision.revid;
    const acceptance = revisionAcceptances.byMwRevId[mwRevId];
    const globalIndex = page * PAGE_SIZE + index;
    return (
      <RevisionRow
        course={course}
        current_user={current_user}
        index={globalIndex}
        key={mwRevId || globalIndex}
        revision={revision}
        revisions={revisions}
        selectedIndex={selectedIndex}
        showDiff={showDiff}
        student={student}
        wikidataLabels={wikidataLabels}
        acceptance={acceptance}
        onAccept={withErrorFeedback(() => doAccept(course.slug, mwRevId, wikiId, student.id))}
        onUnaccept={withErrorFeedback(() => doInvalidate(course.slug, mwRevId, wikiId, student.id))}
        onClear={acceptance ? withErrorFeedback(() => doClear(course.slug, acceptance.id, mwRevId)) : null}
      />
    );
  });

  if (revisions.length === 0) rows.push(<NoRevisionsRow key="no-revisions" student={student} />);

  const paginator = totalPages > 1 ? (
    <div className="contributions-paginator">
      <button
        className="contributions-paginator__btn"
        onClick={() => setPage(p => p - 1)}
        disabled={page === 0}
        aria-label={I18n.t('revisions.page_previous')}
      >
        &lsaquo;
      </button>
      <span className="contributions-paginator__info">
        {I18n.t('revisions.page_of', { current: page + 1, total: totalPages })}
      </span>
      <button
        className="contributions-paginator__btn"
        onClick={() => setPage(p => p + 1)}
        disabled={page >= totalPages - 1}
        aria-label={I18n.t('revisions.page_next')}
      >
        &rsaquo;
      </button>
    </div>
  ) : null;

  return (
    <div>
      {reviewError && (
        <div className="contributions-review-error" role="alert">
          <span>{reviewError}</span>
          <button className="contributions-review-error__close" onClick={() => setReviewError(null)} aria-label="Dismiss">✕</button>
        </div>
      )}
      <table className="table">
        <thead>
          <tr>
            <th>{I18n.t('users.contributions')}</th>
            <th className="desktop-only-tc">{I18n.t('metrics.date_time')}</th>
            <th className="desktop-only-tc contributions-th--center">{I18n.t('metrics.char_added')}</th>
            <th className="desktop-only-tc contributions-th--status">{I18n.t('revisions.status')}</th>
            <th className="desktop-only-tc contributions-th--evaluation">{I18n.t('revisions.evaluation')}</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      {paginator}
      <FullHistoryRow student={student} course={course} />
    </div>
  );
};

Contributions.propTypes = {
  course: PropTypes.object.isRequired,
  revisions: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedIndex: PropTypes.number,
  showDiff: PropTypes.func,
  student: PropTypes.object.isRequired,
  wikidataLabels: PropTypes.object,
  revisionAcceptances: PropTypes.shape({
    byMwRevId: PropTypes.object,
    loaded: PropTypes.bool
  }).isRequired,
  fetchRevisionAcceptances: PropTypes.func.isRequired,
  acceptRevision: PropTypes.func.isRequired,
  invalidateRevision: PropTypes.func.isRequired,
  unacceptRevision: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  revisionAcceptances: state.revisionAcceptances
});

const mapDispatchToProps = {
  fetchRevisionAcceptances,
  acceptRevision,
  unacceptRevision,
  invalidateRevision
};

export default connect(mapStateToProps, mapDispatchToProps)(Contributions);
