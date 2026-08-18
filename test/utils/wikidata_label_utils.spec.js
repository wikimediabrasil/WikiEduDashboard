import { wikidataLabelText } from '../../app/assets/javascripts/utils/wikidata_label_utils';

describe('wikidataLabelText', () => {
  it('uses the nested display label when an API response contains an object', () => {
    expect(wikidataLabelText({
      match: 'Q12147',
      label: 'salud',
      description: 'estado de bienestar',
      url: 'https://www.wikidata.org/wiki/Q12147',
    })).toBe('salud');
  });

  it('preserves an ordinary text label', () => {
    expect(wikidataLabelText('salud')).toBe('salud');
  });
});
