import request from './request';

const wikidataLocale = () => (
  (typeof I18n !== 'undefined' && I18n.locale) ? I18n.locale : 'en'
);

const mapLocalLabel = (label) => ({
  id: label.match,
  match: label.match,
  label: label.localized_label || label.match,
  // Stored descriptions are not localized. Leave them out rather than showing
  // text in a language different from the current Dashboard locale.
  description: '',
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
  const locale = encodeURIComponent(wikidataLocale());
  const resp = await request(`/labels.json?search=${encodeURIComponent(query)}&locale=${locale}`);
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
  const locale = encodeURIComponent(wikidataLocale());
  const resp = await request(`/labels.json?match=${encodeURIComponent(matches.join(','))}&locale=${locale}`);
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
    `uselang=${lang}`,
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
  const wikidataMatches = new Set(wikidataResults.map(result => result.match));
  const localOnlyResults = localResults.filter(result => !wikidataMatches.has(result.match));
  return [...wikidataResults, ...localOnlyResults];
};
