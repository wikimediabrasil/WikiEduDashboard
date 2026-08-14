const wikidataLocale = () => {
  const locale = (typeof I18n !== 'undefined' && I18n.locale) ? I18n.locale : 'en';
  return locale.toString().replace('_', '-').toLowerCase();
};

const normalizedText = text => (text || '')
  .toString()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

const mapWikidataItem = (item, apiRank) => ({
  id: item.id,
  match: item.id,
  label: item.display?.label?.value || item.label || item.id,
  description: item.display?.description?.value || item.description || '',
  url: `https://www.wikidata.org/wiki/${item.id}`,
  source: 'wikidata',
  matchedText: item.match?.text || item.label || '',
  matchType: item.match?.type || '',
  apiRank,
});

const localizedValue = (values, locale) => {
  if (!values) return undefined;
  const baseLocale = locale.split('-')[0];
  return values[locale]?.value || values[baseLocale]?.value || values.en?.value
    || Object.values(values)[0]?.value;
};

// Resolve already-selected QIDs again so their labels and descriptions always
// follow the current dashboard locale. When Wikidata responds successfully,
// missing/deleted entities are deliberately discarded instead of falling back
// to unverified client or database metadata.
export const localizeLabelOptions = async (options) => {
  const qids = [...new Set(options.map(option => option.match).filter(match => /^Q\d+$/.test(match)))];
  if (!qids.length) return options;

  const locale = wikidataLocale();
  const languages = [...new Set([locale, locale.split('-')[0], 'en'])];
  const url = [
    'https://www.wikidata.org/w/api.php?action=wbgetentities',
    'format=json',
    'origin=*',
    `ids=${encodeURIComponent(qids.join('|'))}`,
    'props=labels|descriptions',
    `languages=${encodeURIComponent(languages.join('|'))}`,
    'languagefallback=1',
  ].join('&');

  try {
    const resp = await fetch(url);
    if (!resp.ok) return options;
    const data = await resp.json();
    return options.flatMap((option) => {
      const entity = data.entities?.[option.match];
      if (!entity || entity.missing !== undefined) return [];
      return [{
        ...option,
        label: localizedValue(entity.labels, locale) || option.label,
        description: localizedValue(entity.descriptions, locale) || option.description,
        url: `https://www.wikidata.org/wiki/${option.match}`,
        source: 'wikidata',
      }];
    });
  } catch (_error) {
    return options;
  }
};

// Search terms may be written in English or in the dashboard locale. `uselang`
// remains fixed to the dashboard locale so every returned label/description is
// presented consistently, regardless of the language that produced the match.
export const searchWikidata = async (query) => {
  const lang = wikidataLocale();
  const languages = [...new Set(['en', lang])];

  const buildUrl = (language) => [
    'https://www.wikidata.org/w/api.php?action=wbsearchentities',
    'format=json',
    'origin=*',
    `language=${encodeURIComponent(language)}`,
    `uselang=${encodeURIComponent(lang)}`,
    `search=${encodeURIComponent(query)}`,
    'limit=8',
    'type=item',
  ].join('&');

  const fetchResults = async (language) => {
    try {
      const resp = await fetch(buildUrl(language));
      if (!resp.ok) {
        return [];
      }
      const data = await resp.json();
      return (data.search || []).map((item, index) => mapWikidataItem(item, index));
    } catch (_error) {
      // Network/CORS failures against the external Wikidata API must never
      // take down the whole search UI.
      return [];
    }
  };

  const resultsByLanguage = await Promise.all(languages.map(fetchResults));
  return resultsByLanguage.flat();
};

const relevanceScore = (option, query) => {
  const normalizedQuery = normalizedText(query);
  const qid = normalizedText(option.match);
  const matchedText = normalizedText(option.matchedText);
  const label = normalizedText(option.label);

  if (qid === normalizedQuery) return 0;
  if (matchedText === normalizedQuery) return 1;
  if (label === normalizedQuery) return 2;
  if (matchedText.startsWith(normalizedQuery)) return 3;
  if (label.startsWith(normalizedQuery)) return 4;
  if (matchedText.includes(normalizedQuery)) return 5;
  if (label.includes(normalizedQuery)) return 6;
  return 7;
};

export const rankLabelOptions = (options, query) => {
  const bestByQid = new Map();
  options.forEach((option) => {
    const current = bestByQid.get(option.match);
    if (!current) {
      bestByQid.set(option.match, option);
      return;
    }

    const optionScore = relevanceScore(option, query);
    const currentScore = relevanceScore(current, query);
    if (optionScore < currentScore
      || (optionScore === currentScore && option.apiRank < current.apiRank)) {
      bestByQid.set(option.match, option);
    }
  });

  return [...bestByQid.values()].sort((left, right) => {
    const scoreDifference = relevanceScore(left, query) - relevanceScore(right, query);
    if (scoreDifference !== 0) return scoreDifference;
    return left.apiRank - right.apiRank;
  });
};

export const searchLabelOptions = async (query) => {
  const wikidataResults = await searchWikidata(query);
  return rankLabelOptions(wikidataResults, query).slice(0, 12);
};
