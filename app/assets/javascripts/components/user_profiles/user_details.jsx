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

const defaultParams = {
  wiki: 'all',
  newness: 'both'
};

const getSearchParam = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  return new URLSearchParams(window.location.search).get(key) || fallback;
};

const wikiValueToFilter = (value) => {
  if (!value || value === 'all') return { project: 'all' };

  const [language, project] = value.split('.');
  if (project) return { language, project };

  return { language: null, project: value };
};

const wikiFilterToValue = (wikiFilter) => {
  if (wikiFilter.language) {
    return `${wikiFilter.language}.${wikiFilter.project}`;
  }

  return wikiFilter.project;
};

const getWikiOptions = (wikis) => {
  return wikis.map(([language, project]) => {
    const value = language ? `${language}.${project}` : project;
    return { value, label: value };
  }).sort((a, b) => a.label.localeCompare(b.label));
};

const updateSearchParams = (filter, value) => {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  if (defaultParams[filter] === value) {
    params.delete(filter);
  } else {
    params.set(filter, value);
  }

  const search = params.toString();
  const nextUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
  window.history.replaceState(null, null, nextUrl);
};

const UserDetails = ({ username }) => {
  const { metric } = useParams();
  const [loading, setLoading] = useState(true);
  const [coursesData, setCoursesData] = useState([]);
  const [wikiFilter, setWikiFilter] = useState(() => wikiValueToFilter(getSearchParam('wiki', defaultParams.wiki)));
  const [newnessFilter, setNewnessFilter] = useState(() => getSearchParam('newness', defaultParams.newness));
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [unfilteredCount, setUnfilteredCount] = useState(0);
  const [wikiOptions, setWikiOptions] = useState([]);
  const [newnessOptions, setNewnessOptions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    API.fetchUserArticles(username, {
      page: currentPage,
      per_page: 20,
      wiki: wikiFilterToValue(wikiFilter),
      newness: newnessFilter
    })
      .then((data) => {
        if (cancelled) return;
        setCoursesData(data.articles_by_course || []);
        setTotalCount(data.total_count || 0);
        setUnfilteredCount(data.unfiltered_count || 0);
        setWikiOptions(getWikiOptions(data.wiki_options || []));
        setNewnessOptions(data.newness_options || []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setCoursesData([]);
        setTotalCount(0);
        setUnfilteredCount(0);
        setWikiOptions([]);
        setNewnessOptions([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username, currentPage, wikiFilter, newnessFilter]);

  const newnessFilterEnabled = newnessOptions.includes(true) && newnessOptions.includes(false);
  const hasNoFilteredResults = unfilteredCount > 0 && totalCount === 0;

  const onWikiChange = (e) => {
    const value = e.target.value;
    updateSearchParams('wiki', value);
    setWikiFilter(wikiValueToFilter(value));
    setCurrentPage(1);
  };

  const onNewnessChange = (e) => {
    const value = e.target.value;
    updateSearchParams('newness', value);
    setNewnessFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(totalCount / 20)) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };

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
  const showWikiFilter = wikiOptions.length > 1 || wikiFilter.project !== 'all';
  const showNewnessFilter = newnessFilterEnabled || newnessFilter !== 'both';
  const showFilters = showWikiFilter || showNewnessFilter;

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
      {unfilteredCount === 0 ? (
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
          {showFilters && (
            <div
              className="user-articles__filters"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                margin: '16px 0 24px',
              }}
            >
              <b>{I18n.t('articles.filter_text')}</b>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {showNewnessFilter && (
                  <select
                    className="filter-articles"
                    value={newnessFilter}
                    onChange={onNewnessChange}
                  >
                    <option value="new">{I18n.t('articles.filter.new')}</option>
                    <option value="existing">{I18n.t('articles.filter.existing')}</option>
                    <option value="both">{I18n.t('articles.filter.new_and_existing')}</option>
                  </select>
                )}
                {showWikiFilter && (
                  <select
                    className="filter-articles"
                    value={wikiFilterToValue(wikiFilter)}
                    onChange={onWikiChange}
                  >
                    <option value="all">{I18n.t('articles.filter.wiki_all')}</option>
                    {wikiOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {hasNoFilteredResults ? (
            <div className="user-articles__empty-state">
              <h3>{title}</h3>
              <p>{I18n.t('user_profiles.no_filtered_articles')}</p>
            </div>
          ) : (
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
              {totalCount > 20 && (
                <div className="user-articles__pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px', marginBottom: '24px' }}>
                  <button
                    type="button"
                    className="button border ghost small"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    {I18n.t('pagination.previous')}
                  </button>
                  <span className="user-articles__page-info">
                    {I18n.t('pagination.page', { current: currentPage, total: Math.ceil(totalCount / 20) })}
                  </span>
                  <button
                    type="button"
                    className="button border ghost small"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(totalCount / 20)}
                  >
                    {I18n.t('pagination.next')}
                  </button>
                </div>
              )}

            </div>
          )}
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