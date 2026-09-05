import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import request from '../../utils/request';

const CampaignSearch = () => {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [qid, setQid] = useState(params.get('label_search') || '');
  const [start, setStart] = useState(params.get('creation_start') || '');
  const [end, setEnd] = useState(params.get('creation_end') || '');
  const [advancedOpen, setAdvancedOpen] = useState(Boolean(qid || start || end));
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);

  useEffect(() => {
    setSearch(params.get('search') || '');
    setQid(params.get('label_search') || '');
    setStart(params.get('creation_start') || '');
    setEnd(params.get('creation_end') || '');
    if (params.get('label_search') || params.get('creation_start') || params.get('creation_end')) setAdvancedOpen(true);
    setSuggestionsOpen(false);
  }, [params]);

  useEffect(() => {
    setSuggestions([]);
    setSuggestionsLoaded(false);
    if (!suggestionsOpen || search.trim().length < 2) return undefined;
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const query = new URLSearchParams({ search: search.trim() });
      if (qid.trim()) query.set('label_search', qid.trim().toUpperCase().replace(/\s+/g, ''));
      if (start) query.set('creation_start', start);
      if (end) query.set('creation_end', end);
      try {
        const response = await request(`/campaigns/suggestions?${query}`, { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        if (active) {
          setSuggestions(data.campaigns || []);
          setSuggestionsLoaded(true);
        }
      } catch (_error) {
        // A failed suggestion request must not prevent submitting the search.
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, qid, start, end, suggestionsOpen]);

  const submit = (event) => {
    event.preventDefault();
    const next = new URLSearchParams();
    if (search.trim()) next.set('search', search.trim());
    if (qid.trim()) next.set('label_search', qid.trim().toUpperCase().replace(/\s+/g, ''));
    if (start) next.set('creation_start', start);
    if (end) next.set('creation_end', end);
    setSuggestionsOpen(false);
    setParams(next);
  };
  return (
    <form className="explore-courses" onSubmit={submit}>
      <div className="form-fields">
        <div className="form-row campaign-autocomplete" onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setSuggestionsOpen(false);
        }}>
          <input aria-label={I18n.t('campaign.search_by_name')} id="campaign-search" className="w100" type="search" value={search} autoComplete="off" onFocus={() => setSuggestionsOpen(true)} onKeyDown={(event) => {
            if (event.key === 'Escape') setSuggestionsOpen(false);
            if (event.key === 'ArrowDown') {
              const firstSuggestion = event.currentTarget.parentElement.querySelector('.campaign-suggestions a');
              if (firstSuggestion) {
                event.preventDefault();
                firstSuggestion.focus();
              }
            }
          }} onChange={(event) => { setSearch(event.target.value); setSuggestionsOpen(true); }} placeholder={I18n.t('campaign.search_by_name')} />
          {suggestionsOpen && suggestionsLoaded && (
            <div className="campaign-suggestions">
              {suggestions.length > 0 ? (
                <ul aria-label={I18n.t('campaign.suggestions')}>
                  {suggestions.map(campaign => <li key={campaign.slug}><a href={`/campaigns/${encodeURIComponent(campaign.slug)}/programs`}>{campaign.title}</a></li>)}
                </ul>
              ) : <p role="status">{I18n.t('application.no_results', { query: search })}</p>}
            </div>
          )}
        </div>
        <div className="form-row">
          <button className="button border small advanced-search-toggle-button" type="button" aria-expanded={advancedOpen} aria-controls="campaign-advanced-filters" onClick={() => setAdvancedOpen(!advancedOpen)}>
            {I18n.t('form_search.advanced_search')}
          </button>
        </div>
        {advancedOpen && <div id="campaign-advanced-filters" className="advanced-search advanced-search-container">
          <div className="form-row advanced-search-grid-small campaign-filter-row">
            <label htmlFor="campaign-qid">{I18n.t('campaign.filter_qid')}</label>
            <div className="campaign-qid-field">
              <input id="campaign-qid" type="text" value={qid} onChange={event => setQid(event.target.value)} pattern="[Qq][1-9][0-9]*( *, *[Qq][1-9][0-9]*)*" placeholder={I18n.t('campaign.filter_qid_example')} aria-describedby="campaign-qid-help" title={I18n.t('campaign.filter_qid_help')} />
              <span id="campaign-qid-help" className="sr-only">{I18n.t('campaign.filter_qid_help')}</span>
            </div>
          </div>
          <div className="form-row advanced-search-grid-small campaign-filter-row">
            <label htmlFor="campaign-creation-start">{I18n.t('courses.creation_date')}</label>
            <div className="flex-input-group campaign-date-range">
              <input id="campaign-creation-start" aria-label={I18n.t('campaign.created_from')} type="date" value={start} max={end || undefined} onChange={event => setStart(event.target.value)} />
              <span aria-hidden="true">-</span>
              <input id="campaign-creation-end" aria-label={I18n.t('campaign.created_until')} type="date" value={end} min={start || undefined} onChange={event => setEnd(event.target.value)} />
            </div>
          </div>
        </div>}
      </div>
      <div className="form-actions"><button className="button" type="submit">{I18n.t('campaign.search')}</button></div>
    </form>
  );
};

export default CampaignSearch;
