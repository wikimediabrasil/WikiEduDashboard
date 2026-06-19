import request from './request';

const wikidataLocale = () => (
  (typeof I18n !== 'undefined' && I18n.locale) ? I18n.locale : 'en'
);

const mapLocalLabel = (label) => ({
  id: label.match,
  match: label.match,
  label: label.labels,
  description: label.description || '',
  url: label.url || '',
  source: 'local',
});

const mapWikidataItem = (item) => ({
  id: item.id,
  match: item.id,
  label: item.label || item.id,
  description: item.description || '',
  url: `https://www.wikidata.org/wiki/${item.id}`,
  source: 'wikidata',
});

export const searchLocalLabels = async (query) => {
  const resp = await request(`/labels.json?search=${encodeURIComponent(query)}`);
  if (!resp.ok) {
    return [];
  }
  const data = await resp.json();
  return (data.labels || []).map(mapLocalLabel);
};

export const fetchLabelsByMatch = async (matches) => {
  if (!matches.length) {
    return [];
  }
  const resp = await request(`/labels.json?match=${encodeURIComponent(matches.join(','))}`);
  if (!resp.ok) {
    return [];
  }
  const data = await resp.json();
  return (data.labels || []).map(mapLocalLabel);
};

export const searchWikidata = async (query) => {
  const lang = wikidataLocale();
  const url = [
    'https://www.wikidata.org/w/api.php?action=wbsearchentities',
    'format=json',
    'origin=*',
    `language=${lang}`,
    `search=${encodeURIComponent(query)}`,
    'limit=8',
    'type=item',
  ].join('&');
  const resp = await fetch(url);
  if (!resp.ok) {
    return [];
  }
  const data = await resp.json();
  return (data.search || []).map(mapWikidataItem);
};

export const searchLabelOptions = async (query) => {
  const localResults = await searchLocalLabels(query);
  const wikidataResults = await searchWikidata(query);
  const localMatches = new Set(localResults.map(result => result.match));
  const dedupedWikidata = wikidataResults.filter(result => !localMatches.has(result.match));
  return [...localResults, ...dedupedWikidata];
};