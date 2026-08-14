import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink, useLocation } from 'react-router-dom';
import CourseUtils from '../../utils/course_utils';
import LabelSearchFilter from './label_search_filter';
import { localizeLabelOptions } from '../../utils/wikidata_label_search';

const tagsFromSearchParam = (searchParams, paramName, excluded) => (
  searchParams.getAll(paramName).flatMap((tagJson) => {
    try {
      const tag = JSON.parse(tagJson);
      if (!/^Q\d+$/i.test(tag.qNumber || '')) return [];

      return [{
        match: tag.qNumber.toUpperCase(),
        label: tag.label || tag.qNumber.toUpperCase(),
        description: tag.description || '',
        url: `https://www.wikidata.org/wiki/${tag.qNumber.toUpperCase()}`,
        excluded,
      }];
    } catch (_error) {
      return [];
    }
  })
);

const selectedTagsFromSearch = (search) => {
  const searchParams = new URLSearchParams(search);
  const tagsByMatch = new Map();

  tagsFromSearchParam(searchParams, 'tag_details[]', false)
    .forEach(tag => tagsByMatch.set(tag.match, tag));
  // Exclusion wins if a manually crafted URL contains the same tag in both lists.
  tagsFromSearchParam(searchParams, 'excluded_tag_details[]', true)
    .forEach(tag => tagsByMatch.set(tag.match, tag));

  return Array.from(tagsByMatch.values());
};

const serializedTag = tag => JSON.stringify({
  qNumber: tag.match,
  label: tag.label,
  description: tag.description || '',
  url: `https://www.wikidata.org/wiki/${tag.match}`,
});

const CampaignNavbar = ({ campaign }) => {
  const location = useLocation();
  const [selectedTags, setSelectedTags] = useState(() => selectedTagsFromSearch(location.search));
  const pathSegments = location.pathname.split('/');
  const currentTab = pathSegments[pathSegments.length - 1];
  const searchParams = new URLSearchParams(location.search);
  const searchAction = `/campaigns/${campaign.slug}/programs`;
  const initialQuery = searchParams.get('title_query') || searchParams.get('courses_query') || '';

  useEffect(() => {
    const tagsFromUrl = selectedTagsFromSearch(location.search);
    let cancelled = false;
    setSelectedTags(tagsFromUrl);

    localizeLabelOptions(tagsFromUrl).then((localizedTags) => {
      if (!cancelled) setSelectedTags(localizedTags);
    });

    return () => { cancelled = true; };
  }, [location.search]);

  //  useEffect needed only for links not using Navlink and can be removed once the server-rendered pages are turned into React pages that use NavLink.
  useEffect(() => {
    const links = document.querySelectorAll('.nav__item a');
    links.forEach((link) => {
      if (window.location.pathname === link.getAttribute('href')) {
      link.classList.add('active');
      } else {
      link.classList.remove('active');
      }
    });
  }, [window.location.pathname]);
  return (
    <div className="campaign-nav__wrapper">
      <h1 className="screen-reader">{I18n.t('campaign.campaign')}: {campaign.title}</h1>
      <div className="campaign_navigation">
        <div className="container">
          <div className="nav__item">
            <h2 id="campaign-nav-label" className="title">{I18n.t('campaign.campaign')}: {campaign.title}</h2>
          </div>
          <nav aria-labelledby="campaign-nav-label">
            <div className={`nav__item ${currentTab === 'overview' ? 'active' : ''}`} id="overview-link">
              <p>
                <a href={`/campaigns/${campaign.slug}/overview`}>{I18n.t('courses.overview')}</a>
              </p>
            </div>
            <div className={`nav__item ${currentTab === 'programs' ? 'active' : ''}`}>
              <p>
                <a href={`/campaigns/${campaign.slug}/programs`}>{CourseUtils.i18n('courses', campaign.course_string_prefix)}</a>
              </p>
            </div>
            <div className={`nav__item ${currentTab === 'articles' ? 'active' : ''}`} id="articles-link">
              <p>
                <a href={`/campaigns/${campaign.slug}/articles`}>{I18n.t('courses.articles')}</a>
              </p>
            </div>
            <div className={`nav__item ${currentTab === 'users' ? 'active' : ''}`}>
              <p>
                <a href={`/campaigns/${campaign.slug}/users`}>{CourseUtils.i18n('students', campaign.course_string_prefix)}</a>
              </p>
            </div>
            {/* Disabling ores plot feature for every campaign until re-implementing. See issue #6327 */}
            {/* <div className="nav__item">
              <p><NavLink to={`/campaigns/${campaign.slug}/ores_plot`}>{I18n.t('courses.ores_plot')}</NavLink></p>
            </div> */}
            <div className="nav__item">
              <p><NavLink to={`/campaigns/${campaign.slug}/alerts`}>{I18n.t('courses.alerts')}</NavLink></p>
            </div>
            <div className={`nav__item ${currentTab === 'tags' ? 'active' : ''}`} id="tags-link">
              <p>
                <a href={`/campaigns/${campaign.slug}/tags`}>{I18n.t('campaign.tags')}</a>
              </p>
            </div>
            <div className="campaign-nav__search" >
              <form action={searchAction} acceptCharset="UTF-8" method="get">
                <LabelSearchFilter
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                  placeholder={I18n.t('campaign.search_programs_and_tags')}
                  inputName="title_query"
                  inputId="campaign_search_query"
                  initialQuery={initialQuery}
                />
                {selectedTags.map(tag => (
                  <input
                    key={tag.match}
                    type="hidden"
                    name={tag.excluded ? 'excluded_tag_details[]' : 'tag_details[]'}
                    value={serializedTag(tag)}
                  />
                ))}
                <button className="icon icon-search" type="submit" aria-label={`${I18n.t('form_search.search')} ${campaign.title}`} />
              </form>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

CampaignNavbar.propTypes = {
  campaign: PropTypes.object,
};

export default CampaignNavbar;
