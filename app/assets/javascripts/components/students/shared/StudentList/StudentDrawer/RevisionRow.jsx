import React from 'react';
import PropTypes from 'prop-types';

// Components
import DiffViewer from '@components/revisions/diff_viewer.jsx';

// Helpers
import RevisionStatus from './RevisionStatus';
import CourseUtils from '~/app/assets/javascripts/utils/course_utils';
import { formatDateWithTime } from '../../../../../utils/date_utils';
import { getArticleUrl, getDiffUrl } from '../../../../../utils/wiki_utils';

export const RevisionRow = ({
  course, current_user, index, revision, revisions, selectedIndex,
  student, wikidataLabels, showDiff, acceptance, onAccept, onUnaccept
}) => {
  const article = revision.article;
  const label = wikidataLabels[article.title];
  const formattedTitle = CourseUtils.formattedArticleTitle(article, course.home_wiki, label);
  const articleUrl = getArticleUrl(revision.wiki, formattedTitle);
  const revisionDate = formatDateWithTime(revision.timestamp);
  const rowClass = revision.reverted ? 'revision-row revision-row--reverted' : 'revision-row';
  const canAccept = current_user && current_user.isAdvancedRole;

  return (
    <tr key={revision.id} className={rowClass}>
      <td>
        <p className="name">
          <a href={articleUrl} target="_blank">{formattedTitle}</a>
        </p>
      </td>
      <td className="desktop-only-tc date"><a href={getDiffUrl(revision)} target="_blank">{revisionDate}</a></td>
      <td className="desktop-only-tc">{revision.sizediff}</td>
      <td className="desktop-only-tc">
        <RevisionStatus revision={revision} />
      </td>
      <td className="desktop-only-tc revision-row__diff-cell">
        {canAccept && (
          <span className={`revision-review-badge${acceptance ? ' revision-review-badge--reviewed' : ' revision-review-badge--pending'}`}>
            {acceptance ? I18n.t('revisions.reviewed') : I18n.t('revisions.pending')}
          </span>
        )}
        <DiffViewer
          revision={revision}
          index={index}
          editors={[student.username]}
          articleTitle={formattedTitle}
          setSelectedIndex={showDiff}
          lastIndex={revisions.length}
          selectedIndex={selectedIndex}
          acceptance={acceptance}
          canAccept={canAccept && !revision.reverted}
          onAccept={onAccept}
          onUnaccept={onUnaccept}
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
  onUnaccept: PropTypes.func
};

export default RevisionRow;
