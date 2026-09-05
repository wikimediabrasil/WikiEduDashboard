import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import Select from 'react-select';
import { searchPrograms, sortCourseSearchResults } from '../../actions/course_actions';
import Loading from '../common/loading';
import CourseList from './course_list';
import CourseRow from './course_row';
import LabelSearchFilter from '../common/label_search_filter';
import selectStyles from '../../styles/select';
import { fetchLabelsByMatch } from '../../utils/wikidata_label_search';
import request from '../../utils/request';

const defaultCourseStringPrefix = Features.default_course_string_prefix;
const keys = {
  title: { label: I18n.t(`${defaultCourseStringPrefix}.courses`) },
  school: { label: I18n.t(`${defaultCourseStringPrefix}.school_and_term`) },
  ...(Features.wikiEd ? { instructor: { label: I18n.t('courses.instructor', { count: 1 }), sortable: false } } : {}),
  recent_revision_count: { label: I18n.t('metrics.revisions') },
  word_count: { label: I18n.t('metrics.word_count'), desktop_only: false },
  references_count: { label: I18n.t('metrics.references_count'), desktop_only: false },
  view_sum: { label: I18n.t('metrics.view'), desktop_only: false },
  user_count: { label: I18n.t('users.editors'), desktop_only: false },
  ...(!Features.wikiEd ? { creation_date: { label: I18n.t('courses.creation_date'), desktop_only: false } } : {}),
};

const SearchableCourseList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { results, loaded, sort } = useSelector(state => state.course_search_results);
  const dispatch = useDispatch();
  const tagMatches = searchParams.getAll('tag');
  const [advancedOpen, setAdvancedOpen] = useState(Boolean(searchParams.get('campaign_id') || searchParams.get('creation_start') || searchParams.get('creation_end') || tagMatches.length));
  const [title, setTitle] = useState(searchParams.get('title_query') || searchParams.get('search') || '');
  const [campaignId, setCampaignId] = useState(searchParams.get('campaign_id') || '');
  const [creationStart, setCreationStart] = useState(searchParams.get('creation_start') || '');
  const [creationEnd, setCreationEnd] = useState(searchParams.get('creation_end') || '');
  const [selectedTags, setSelectedTags] = useState(tagMatches.map(match => ({ match, label: match, description: '', url: '' })));
  const [campaignOptions, setCampaignOptions] = useState([]);
  const hasFilters = Boolean(searchParams.get('title_query') || searchParams.get('search') || searchParams.get('campaign_id') || searchParams.get('creation_start') || searchParams.get('creation_end') || tagMatches.length);

  useEffect(() => {
    request('/lookups/campaign.json')
      .then(response => response.json())
      .then(data => setCampaignOptions(data.campaigns.map(campaign => ({ value: String(campaign.id), label: campaign.title }))))
      .catch(() => setCampaignOptions([]));
  }, []);
  useEffect(() => {
    if (!tagMatches.length) return;
    fetchLabelsByMatch(tagMatches).then((labels) => {
      const byMatch = Object.fromEntries(labels.map(label => [label.match, label]));
      setSelectedTags(tagMatches.map(match => byMatch[match] || { match, label: match, description: '', url: '' }));
    }).catch(() => {});
  }, []);

  const getFilters = () => ({ title_query: title, campaign_id: campaignId, creation_start: creationStart, creation_end: creationEnd, tag: selectedTags.map(tag => tag.match) });
  const fetchResults = () => {
    const filters = getFilters();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => Array.isArray(value) ? value.forEach(item => params.append(key, item)) : value && params.set(key, value));
    setSearchParams(params);
  };
  useEffect(() => {
    setTitle(searchParams.get('title_query') || searchParams.get('search') || '');
    setCampaignId(searchParams.get('campaign_id') || '');
    setCreationStart(searchParams.get('creation_start') || '');
    setCreationEnd(searchParams.get('creation_end') || '');
    setSelectedTags(searchParams.getAll('tag').map(match => ({ match, label: match, description: '', url: '' })));
    if (hasFilters) {
      dispatch(searchPrograms({ ...Object.fromEntries(searchParams), tag: searchParams.getAll('tag') }));
    }
  }, [searchParams, dispatch]);

  if (sort.key) Object.keys(keys).forEach((key) => { keys[key].order = key === sort.key ? (sort.sortKey ? 'asc' : 'desc') : undefined; });
  const selectedCampaign = campaignOptions.find(option => option.value === String(campaignId)) || null;

  return (
    <section className="container" id="courses">
      <div className="section-header"><h2>{I18n.t(`${defaultCourseStringPrefix}.courses`)}</h2></div>
      <form className="explore-courses" onSubmit={(event) => { event.preventDefault(); fetchResults(); }}>
        <div className="form-fields">
          <div className="form-row"><input id="program-search" name="program-search" aria-label={I18n.t('campaign.find_programs')} className="w100" type="text" value={title} onChange={event => setTitle(event.target.value)} placeholder={`${I18n.t('form_search.search')} ${I18n.t(`${defaultCourseStringPrefix}.course`)}`} /></div>
          <div className="form-row"><button className="button border small advanced-search-toggle-button" type="button" onClick={() => setAdvancedOpen(!advancedOpen)}>{I18n.t('form_search.advanced_search')}</button></div>
          {advancedOpen && <div className="advanced-search advanced-search-container">
            <div className="form-row advanced-search-grid-large"><label htmlFor="explore-campaign">{I18n.t('campaign.campaign')}</label><Select inputId="explore-campaign" value={selectedCampaign} onChange={option => setCampaignId(option?.value || '')} options={campaignOptions} styles={selectStyles} isClearable placeholder={I18n.t('courses.campaign_select')} /></div>
            <div className="form-row advanced-search-grid-large"><label>{I18n.t('campaign.wikidata_tags')}</label><LabelSearchFilter selectedTags={selectedTags} onChange={setSelectedTags} placeholder={I18n.t('campaign.search_programs_and_tags')} /></div>
            <div className="form-row advanced-search-grid-small"><label>{I18n.t('courses.creation_date')}</label><div className="flex-input-group"><input type="date" value={creationStart} onChange={event => setCreationStart(event.target.value)} /><span>-</span><input type="date" value={creationEnd} onChange={event => setCreationEnd(event.target.value)} /></div></div>
          </div>}
        </div>
        <div className="form-actions"><button className="button" type="submit">{I18n.t('campaign.search')}</button></div>
      </form>
      {hasFilters && !loaded && <Loading />}
      {hasFilters && loaded && <CourseList keys={keys} courses={results} none_message={I18n.t('application.no_results', { query: searchParams.get('title_query') || searchParams.get('search') || '' })} sortBy={key => dispatch(sortCourseSearchResults(key))} RowElement={CourseRow} />}
      <Link to="/explore">{I18n.t('campaign.explore_campaigns')}</Link>
    </section>
  );
};

export default SearchableCourseList;
