import React, { useState } from 'react';
import PropTypes from 'prop-types';
import InstructorStats from './instructor_stats.jsx';
import StudentStats from './student_stats.jsx';
import ArticleUtils from '../../utils/article_utils';

const ContributionStats = ({ params, stats, statsGraphsData }) => {
  const [isStudent] = useState(JSON.parse(document.querySelector('#react_root')?.dataset.isstudent));
  const [isInstructor] = useState(JSON.parse(document.querySelector('#react_root')?.dataset.isinstructor));
  let contriStats;
  const graphWidth = 800;
  const graphHeight = 250;
  if (isInstructor.instructor) {
    contriStats = (
      <InstructorStats
        username={params.username}
        stats={stats}
        isStudent={isStudent.student}
        statsGraphsData={statsGraphsData}
        graphWidth={graphWidth}
        graphHeight={graphHeight}
        maxProject={stats.max_project}
      />
    );
  } else if (isStudent.student) {
    contriStats = (
      <StudentStats
        username={params.username}
        stats={stats.as_student}
        statsGraphsData={statsGraphsData}
        graphWidth={graphWidth}
        graphHeight={graphHeight}
        maxProject={stats.max_project}
      />
    );
  }

  const downloadCsvLabel = I18n.t('downloads.csv');
  const downloadJsonLabel = I18n.t('downloads.json');

  return (
    <div id="statistics">
      <div className="user-articles__header">
        <h3>{I18n.t('users.contribution_statistics')}</h3>
        <div className="user-articles__downloads">
          <button type="button" className="button border ghost small">
            {downloadCsvLabel}
          </button>
          <button type="button" className="button border ghost small">
            {downloadJsonLabel}
          </button>
        </div>
      </div>
      {contriStats}

      {/* Stats by Language/Project */}
      {stats.articles_by_language && stats.articles_by_language.length > 0 && (
        <div className="user-articles__header" style={{ marginTop: '30px' }}>
          <h5 className="user_stats__title">{I18n.t('users.contributions_by_language')}</h5>
        </div>
      )}
      {stats.articles_by_language && stats.articles_by_language.length > 0 && (
        <div className="user-details-table-wrap">
          <table className="table user-details-table">
            <thead>
              <tr>
                <th>{I18n.t('articles.language') || 'Language'}</th>
                <th>{I18n.t('articles.project') || 'Project'}</th>
                <th className="user-details-table__value">{I18n.t('metrics.word_count')}</th>
                <th className="user-details-table__value">{I18n.t('metrics.references_count')}</th>
                <th className="user-details-table__value">{I18n.t('metrics.article_count') || 'Articles'}</th>
              </tr>
            </thead>
            <tbody>
              {stats.articles_by_language.map(lang => (
                <tr key={`${lang.language}-${lang.project}`}>
                  <td>{lang.language}</td>
                  <td>{lang.project}</td>
                  <td className="user-details-table__value">{lang.word_count}</td>
                  <td className="user-details-table__value">{lang.references_count}</td>
                  <td className="user-details-table__value">{lang.article_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

ContributionStats.propTypes = {
  params: PropTypes.object,
  stats: PropTypes.object.isRequired
};

export default ContributionStats;