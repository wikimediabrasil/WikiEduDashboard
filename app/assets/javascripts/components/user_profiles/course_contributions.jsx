import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import request, { ensureOk } from '../../utils/request';
import { toWikiDomain } from '../../utils/wiki_utils';
import Loading from '../common/loading.jsx';

const PAGE_SIZE = 50;
const normalizedTitle = title => (title || '').replace(/_/g, ' ');
const wikiDomain = wiki => wiki.domain || toWikiDomain(wiki);

export const fetchWikiContributions = async (username, course, wiki) => {
  const params = new URLSearchParams({
    action: 'query', format: 'json', origin: '*', list: 'usercontribs',
    ucuser: username, ucprop: 'ids|title|timestamp|sizediff', uclimit: '500',
    ucstart: new Date(course.end).toISOString(), ucend: new Date(course.start).toISOString()
  });
  const revisions = [];
  let hasMore = true;
  do {
    const response = await request(`https://${wikiDomain(wiki)}/w/api.php?${params}`);
    await ensureOk(response);
    const data = await response.json();
    if (data.error || !data.query?.usercontribs) throw new Error('MediaWiki query failed');
    revisions.push(...data.query.usercontribs);
    hasMore = !!data.continue?.uccontinue;
    if (hasMore) {
      params.set('uccontinue', data.continue.uccontinue);
      params.set('continue', data.continue.continue);
    }
  } while (hasMore);

  const excluded = new Set(wiki.excluded_page_ids);
  const scopedTitles = wiki.scoped_titles && new Set(wiki.scoped_titles.map(normalizedTitle));
  const scopedPages = new Set(wiki.scoped_page_ids || []);
  return revisions.filter(revision => !excluded.has(revision.pageid)
    && (!scopedTitles || scopedTitles.has(normalizedTitle(revision.title)) || scopedPages.has(revision.pageid)))
    .map(revision => ({ ...revision, wiki }));
};

const CourseContributions = ({ username }) => {
  const location = useLocation();
  const courseId = new URLSearchParams(location.search).get('course_id');
  const wikiId = new URLSearchParams(location.search).get('wiki_id');
  const validated = new URLSearchParams(location.search).get('validated') === '1';
  const [data, setData] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [error, setError] = useState(false);
  const [partial, setPartial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setPartial(false);
    setVisibleCount(PAGE_SIZE);
    const load = async () => {
      const response = await request(`/users/${encodeURIComponent(username)}/course_contributions.json?course_id=${encodeURIComponent(courseId || '')}${validated ? '&validated=1' : ''}`);
      await ensureOk(response);
      const course = await response.json();
      const wikis = wikiId ? course.wikis.filter(wiki => String(wiki.id) === wikiId) : course.wikis;
      if (wikiId && wikis.length === 0) throw new Error('Wiki not found');
      let edits;
      if (course.reviewed) {
        const wikiById = new Map(wikis.map(wiki => [wiki.id, wiki]));
        edits = course.revisions.map(revision => ({
          ...revision.metadata, revid: revision.revid, wiki: wikiById.get(revision.wiki_id)
        })).filter(revision => revision.wiki);
      } else {
        const batches = await Promise.allSettled(wikis.map(wiki => fetchWikiContributions(username, course, wiki)));
        if (batches.every(batch => batch.status === 'rejected')) throw new Error('Wiki queries failed');
        edits = batches.filter(batch => batch.status === 'fulfilled').flatMap(batch => batch.value);
        if (!cancelled) setPartial(batches.some(batch => batch.status === 'rejected'));
      }
      if (cancelled) return;
      setData({ ...course, selectedWiki: wikiId ? wikis[0] : null });
      setRevisions(edits.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')));
      setLoading(false);
    };
    load().catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [username, courseId, wikiId, validated]);

  if (loading) return <Loading />;
  return (
    <div className="user-articles">
      <div className="user-articles__navigation">
        <Link to={`/users/${encodeURIComponent(username)}`} className="button ghost small">
          ← {I18n.t('users.back_to_profile')}
        </Link>
      </div>
      {error ? <p role="alert">{I18n.t('users.course_contributions_load_failed')}</p> : (
        <>
          <h3>{I18n.t('users.course_contributions_title')}: {data.course_title}</h3>
          {data.selectedWiki && <p>{I18n.t('articles.project')}: {wikiDomain(data.selectedWiki)}</p>}
          <p>{I18n.t('users.course_contributions_total')}: {' '}
            <strong>{data.selectedWiki ? data.selectedWiki.revision_count : (data.total ?? '—')}</strong>
          </p>
          {!data.reviewed && <p>{I18n.t('users.course_contributions_live_notice')}</p>}
          {partial && <p role="alert">{I18n.t('users.course_contributions_partial')}</p>}
          {revisions.length === 0 ? <p>{I18n.t('users.course_contributions_empty')}</p> : (
            <div className="user-details-table-wrap">
              <table className="table user-details-table">
                <thead><tr>
                  <th>{I18n.t('articles.article_title')}</th>
                  <th>{I18n.t('articles.project')}</th>
                  <th>{I18n.t('metrics.date_time')}</th>
                  <th>{I18n.t('articles.view')}</th>
                </tr></thead>
                <tbody>{revisions.slice(0, visibleCount).map(revision => (
                  <tr key={`${revision.wiki.id}:${revision.revid}`}>
                    <td>{revision.title || `#${revision.revid}`}</td>
                    <td>{wikiDomain(revision.wiki)}</td>
                    <td>{revision.timestamp ? new Date(revision.timestamp).toLocaleString() : '—'}</td>
                    <td><a href={`https://${wikiDomain(revision.wiki)}/w/index.php?diff=${revision.revid}`} target="_blank" rel="noopener noreferrer">{I18n.t('revisions.diff')}</a></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {visibleCount < revisions.length && (
            <button type="button" className="button border" onClick={() => setVisibleCount(count => count + PAGE_SIZE)}>
              {I18n.t('revisions.see_more')}
            </button>
          )}
        </>
      )}
    </div>
  );
};

CourseContributions.propTypes = { username: PropTypes.string.isRequired };

export default CourseContributions;
