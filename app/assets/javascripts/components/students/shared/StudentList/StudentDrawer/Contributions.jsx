import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useSelector } from 'react-redux';
import { getCurrentUser } from '../../../../../selectors';

// Components
import RevisionRow from './RevisionRow';
import NoRevisionsRow from './NoRevisionsRow';
import FullHistoryRow from './FullHistoryRow';

// Actions
import { fetchRevisionAcceptances, acceptRevision, unacceptRevision } from '../../../../../actions/revision_acceptance_actions';

export const Contributions = ({
  course, revisions, selectedIndex, student, wikidataLabels, showDiff,
  revisionAcceptances,
  fetchRevisionAcceptances: doFetch, acceptRevision: doAccept, unacceptRevision: doUnaccept
}) => {
  const current_user = useSelector(getCurrentUser);
  useEffect(() => {
    if (!revisionAcceptances.loaded) {
      doFetch(course.slug);
    }
  }, [course.slug]);

  const wikiId = course.home_wiki?.id;
  const rows = revisions.map((revision, index) => {
    const mwRevId = revision.mw_rev_id || revision.revid;
    const acceptance = revisionAcceptances.byMwRevId[mwRevId];
    return (
      <RevisionRow
        course={course}
        current_user={current_user}
        index={index}
        key={index}
        revision={revision}
        revisions={revisions}
        selectedIndex={selectedIndex}
        showDiff={showDiff}
        student={student}
        wikidataLabels={wikidataLabels}
        acceptance={acceptance}
        onAccept={() => doAccept(course.slug, mwRevId, wikiId, student.id)}
        onUnaccept={() => doUnaccept(course.slug, acceptance?.id, mwRevId)}
      />
    );
  });

  if (rows.length === 0) rows.push(<NoRevisionsRow key="no-revisions" student={student} />);
  rows.push(<FullHistoryRow key="full-history" student={student} course={course} />);

  return (
    <table className="table">
      <thead>
        <tr>
          <th>{I18n.t('users.contributions')}</th>
          <th className="desktop-only-tc">{I18n.t('metrics.date_time')}</th>
          <th className="desktop-only-tc">{I18n.t('metrics.char_added')}</th>
          <th className="desktop-only-tc">{I18n.t('revisions.status')}</th>
          <th className="desktop-only-tc">{I18n.t('revisions.community_status')}</th>
          <th className="desktop-only-tc" />
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
};

Contributions.propTypes = {
  revisions: PropTypes.arrayOf(PropTypes.object).isRequired,
  student: PropTypes.object.isRequired,
  revisionAcceptances: PropTypes.object.isRequired,
  fetchRevisionAcceptances: PropTypes.func.isRequired,
  acceptRevision: PropTypes.func.isRequired,
  unacceptRevision: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  revisionAcceptances: state.revisionAcceptances
});

const mapDispatchToProps = {
  fetchRevisionAcceptances,
  acceptRevision,
  unacceptRevision
};

export default connect(mapStateToProps, mapDispatchToProps)(Contributions);
