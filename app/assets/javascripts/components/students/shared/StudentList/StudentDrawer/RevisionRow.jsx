import React from 'react';
import PropTypes from 'prop-types';

// Components
import DiffViewer from '@components/revisions/diff_viewer.jsx';

// Helpers
import CourseUtils from '~/app/assets/javascripts/utils/course_utils';
import { formatDateWithTime } from '../../../../../utils/date_utils';
import { getArticleUrl, getDiffUrl } from '../../../../../utils/wiki_utils';

export const RevisionRow = ({
  course, current_user, index, revision, revisions, selectedIndex,
  student, wikidataLabels, showDiff, acceptance, onAccept, onUnaccept, onClear
}) => {
  const article = revision.article;
  const label = wikidataLabels[article.title];
  const formattedTitle = CourseUtils.formattedArticleTitle(article, course.home_wiki, label);
  const articleUrl = getArticleUrl(revision.wiki, formattedTitle);
  const revisionDate = formatDateWithTime(revision.timestamp);
  const rowClass = revision.reverted ? 'revision-row revision-row--reverted' : 'revision-row';
  const canAccept = current_user && current_user.isAdvancedRole;

  // Evaluation chip: wiki status (reverted) + instructor review shown independently.
  // Both can appear simultaneously — e.g. reverted + validated by instructor.
  let evaluationChip = null;
  if (canAccept) {
    const status = acceptance?.status;

    // Wiki status chip (only shown when reverted)
    const revertedChip = revision.reverted ? (
      <span
        className="eval-chip eval-chip--reverted"
        title={I18n.t('revisions.status_reverted_tooltip')}
      >
        {I18n.t('revisions.status_reverted')}
      </span>
    ) : null;

    // Instructor review chip (always shown)
    let instructorChip;
    if (status === 'validated') {
      instructorChip = (
        <span className="eval-chip eval-chip--validated">
          {I18n.t('revisions.evaluation_validated')}
        </span>
      );
    } else if (status === 'invalidated') {
      instructorChip = (
        <span className="eval-chip eval-chip--invalidated">
          {I18n.t('revisions.evaluation_invalidated')}
        </span>
      );
    } else {
      instructorChip = (
        <span className="eval-chip eval-chip--pending">
          {I18n.t('revisions.evaluation_pending_review')}
        </span>
      );
    }

    evaluationChip = (
      <div className="eval-chip-group">
        {revertedChip}
        {instructorChip}
      </div>
    );
  }

  return (
    <tr key={revision.id} className={rowClass}>
      <td>
        <p className="name">
          <a href={articleUrl} target="_blank">{formattedTitle}</a>
        </p>
      </td>
      <td className="desktop-only-tc date"><a href={getDiffUrl(revision)} target="_blank">{revisionDate}</a></td>
      <td className="desktop-only-tc contributions-td--center">{revision.sizediff}</td>
      <td className="desktop-only-tc revision-row__status-cell">
        <div className="revision-row__status-inner">
          {evaluationChip}
        </div>
      </td>
      <td className="desktop-only-tc revision-row__eval-cell">
        <DiffViewer
          revision={revision}
          index={index}
          editors={[student.username]}
          articleTitle={formattedTitle}
          setSelectedIndex={showDiff}
          lastIndex={revisions.length}
          selectedIndex={selectedIndex}
          acceptance={acceptance}
          canAccept={canAccept}
          onAccept={onAccept}
          onUnaccept={onUnaccept}
          onClear={onClear}
        />
      </td>
    </tr>
  );
};

RevisionRow.propTypes = {
  revision: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  current_user: PropTypes.object,
  acceptance: PropTypes.object,
  onAccept: PropTypes.func,
  onUnaccept: PropTypes.func,
  onClear: PropTypes.func
};

export default RevisionRow;
