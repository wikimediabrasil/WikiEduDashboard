import '../testHelper';

import {
  fetchLabelsByMatch,
  localizeLabelOptions,
  rankLabelOptions,
  searchLabelOptions,
} from '../../app/assets/javascripts/utils/wikidata_label_search';

const response = data => ({
  ok: true,
  json: jest.fn().mockResolvedValue(data),
});

describe('Wikidata label search', () => {
  const originalLocale = I18n.locale;

  beforeEach(() => {
    I18n.locale = 'en';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    I18n.locale = originalLocale;
    jest.clearAllMocks();
  });

  test('ranks an exact Wikidata alias ahead of a less relevant result', () => {
    const options = [{
      match: 'Q2338283', label: 'Soccer', matchedText: 'Soccer', apiRank: 1,
    }, {
      match: 'Q2736', label: 'association football', matchedText: 'soccer', apiRank: 0,
    }];

    expect(rankLabelOptions(options, 'soccer').map(option => option.match))
      .toEqual(['Q2736', 'Q2338283']);
  });

  test('shows search matches in the dashboard language', async () => {
    I18n.locale = 'es';
    global.fetch.mockImplementation((url) => {
      if (url.includes('wbsearchentities')) {
        expect(url).toContain('uselang=es');
        return Promise.resolve(response({
          search: [{
            id: 'Q2736',
            label: 'fútbol',
            description: 'deporte practicado entre dos equipos',
            match: { type: 'alias', language: 'en', text: 'soccer' },
          }],
        }));
      }
      return Promise.resolve(response({ entities: {} }));
    });

    const results = await searchLabelOptions('soccer');

    expect(results[0]).toMatchObject({ match: 'Q2736', label: 'fútbol' });
  });

  test('searches Wikidata directly without querying stored dashboard labels', async () => {
    global.fetch.mockResolvedValue(response({ search: [] }));

    await searchLabelOptions('sport');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toContain('wbsearchentities');
    expect(global.fetch.mock.calls[0][0]).not.toContain('/labels.json');
  });

  test('localizes both label and description and discards missing QIDs', async () => {
    I18n.locale = 'es';
    global.fetch.mockResolvedValue(response({
      entities: {
        Q349: {
          labels: { es: { value: 'deporte' }, en: { value: 'sport' } },
          descriptions: {
            es: { value: 'formas de actividad recreativa' },
            en: { value: 'competitive activity' },
          },
        },
        Q999999999: { id: 'Q999999999', missing: '' },
      },
    }));

    const results = await localizeLabelOptions([
      { match: 'Q349', label: 'sport', description: 'old description' },
      { match: 'Q999999999', label: 'invented', description: 'invented' },
    ]);

    expect(results).toEqual([expect.objectContaining({
      match: 'Q349',
      label: 'deporte',
      description: 'formas de actividad recreativa',
      url: 'https://www.wikidata.org/wiki/Q349',
      source: 'wikidata',
    })]);
  });

  test('fetchLabelsByMatch localizes matching QIDs', async () => {
    I18n.locale = 'es';
    global.fetch.mockResolvedValue(response({
      entities: {
        Q349: {
          labels: { es: { value: 'deporte' } },
          descriptions: { es: { value: 'formas de actividad recreativa' } },
        },
      },
    }));

    const results = await fetchLabelsByMatch(['Q349']);
    expect(results).toEqual([expect.objectContaining({
      match: 'Q349',
      label: 'deporte',
      description: 'formas de actividad recreativa',
    })]);
  });
});
