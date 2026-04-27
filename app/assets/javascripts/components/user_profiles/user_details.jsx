import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, useParams } from 'react-router-dom';
import API from '../../utils/api.js';
import Loading from '../common/loading.jsx';

const columnsByMetric = {
  articles: ['article', 'language', 'type', 'view'],
  words: ['article', 'language', 'words', 'view'],
  references: ['article', 'language', 'references', 'view']
};

const UserDetails = ({ username }) => {
  const { metric } = useParams();
  const [loading, setLoading] = useState(true);
  const [coursesData, setCoursesData] = useState([]);

  useEffect(() => {
    API.fetchUserArticles(username)
      .then((data) => {
        setCoursesData(data.articles_by_course || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [username]);

  if (loading) {
    return <Loading />;
  }

  let title = I18n.t('user_profiles.detailed_impact');
  if (metric === 'words') title = I18n.t('user_profiles.words_added_per_article');
  if (metric === 'references') title = I18n.t('user_profiles.references_added_per_article');
  if (metric === 'articles') title = I18n.t('user_profiles.articles_edited_detail');

  const summaryLabels = {
    articles: I18n.t('user_profiles.summary_articles'),
    words: I18n.t('user_profiles.summary_words'),
    references: I18n.t('user_profiles.summary_references')
  };
  const summaryLabel = summaryLabels[metric] || summaryLabels.articles;
  const visibleColumns = columnsByMetric[metric] || columnsByMetric.articles;
  const renderHeaderCell = (column) => {
    if (column === 'article') return I18n.t('articles.article_title');
    if (column === 'language') return I18n.t('articles.language');
    if (column === 'words') return I18n.t('metrics.word_count');
    if (column === 'references') return I18n.t('metrics.references_count');
    if (column === 'type') return I18n.t('user_profiles.type');
    return I18n.t('articles.view');
  };

  const renderBodyCell = (article, column) => {
    if (column === 'article') {
      return (
        <td className="user-details-table__title">
          <span>{article.title}</span>
        </td>
      );
    }

    if (column === 'language') {
      return <td className="user-details-table__value">{article.language || article.wiki_language || I18n.t('user_profiles.language_not_available')}</td>;
    }

    if (column === 'words') return <td className="user-details-table__value">{article.word_count || 0}</td>;
    if (column === 'references') return <td className="user-details-table__value">{article.references_count || 0}</td>;
    if (column === 'type') {
      return (
        <td className="user-details-table__value">
          {article.new_article
            ? I18n.t('user_profiles.status_new')
            : I18n.t('user_profiles.status_edited')}
        </td>
      );
    }

    return (
      <td className="table-link-cell">
        <a href={article.url} target="_blank" rel="noopener noreferrer">
          {I18n.t('articles.view')}
        </a>
      </td>
    );
  };

  return (
    <div className="user-articles">
      <div className="user-articles__navigation">
        <Link to={`/users/${username}`} className="button ghost small">
          ← {I18n.t('users.back_to_profile')}
        </Link>
      </div>
      {coursesData.length === 0 ? (
        <div className="user-articles__empty-state">
          <h3>{title}</h3>
          <p>{I18n.t('user_profiles.no_articles_edited')}</p>
        </div>
      ) : (
        <>
          <div className="user-articles__header">
            <h3>{title}</h3>
            <div className="user-articles__downloads">
              <button type="button" className="button border ghost small">
                {I18n.t('downloads.csv')}
              </button>
              <button type="button" className="button border ghost small">
                {I18n.t('downloads.json')}
              </button>
            </div>
          </div>
          <div className="user-articles-list">
            {coursesData.map(courseGroup => (
              <section key={courseGroup.course_slug} className="course-articles-group user-details-course">
                <div className="user-details-course__header">
                  <div>
                    <h4>{courseGroup.course_title}</h4>
                    <p>
                      {summaryLabel}: {' '}
                      <strong>
                        {metric === 'words' && (courseGroup.word_count || 0)}
                        {metric === 'references' && (courseGroup.references_count || 0)}
                        {metric !== 'words' && metric !== 'references' && (courseGroup.articles_edited || 0)}
                      </strong>
                    </p>
                  </div>
                  <a href={`/courses/${courseGroup.course_slug}`} className="button border" target="_blank" rel="noopener noreferrer">
                    {I18n.t(Features.wikiEd ? 'courses.view_page' : 'courses_generic.view_page')}
                  </a>
                </div>
                <div className="user-details-table-wrap">
                  <table className="table user-details-table">
                    <thead>
                      <tr>
                        {visibleColumns.map((column) => {
                          let thClass = '';
                          if (column === 'view') thClass = 'table-link-cell';
                          else if (column === 'words' || column === 'references' || column === 'language' || column === 'type') thClass = 'user-details-table__value';
                          return (
                            <th key={column} className={thClass}>{renderHeaderCell(column)}</th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {courseGroup.articles && courseGroup.articles.map(article => (
                        <tr key={article.article_id}>
                          {visibleColumns.map(column => (
                            <React.Fragment key={column}>
                              {renderBodyCell(article, column)}
                            </React.Fragment>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
          <div className="user-articles__footer">
            <a href={`https://en.wikipedia.org/wiki/Special:Contributions/${username}`} target="_blank" rel="noopener noreferrer" className="button dark">
              {I18n.t('users.contributions_more')}
            </a>
          </div>
        </>
      )}
    </div>
  );
};

UserDetails.propTypes = {
  username: PropTypes.string.isRequired
};

export default UserDetails;