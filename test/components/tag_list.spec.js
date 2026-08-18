import '../testHelper';

import { tagText } from '../../app/assets/javascripts/components/overview/tag_list.jsx';

describe('tagText', () => {
  it('uses the display label for a Wikidata tag object', () => {
    expect(tagText({
      tag: {
        match: 'Q12147',
        label: 'salud',
        description: 'estado de bienestar',
        url: 'https://www.wikidata.org/wiki/Q12147',
      },
    })).toBe('salud');
  });

  it('preserves a legacy text tag', () => {
    expect(tagText({ tag: 'health' })).toBe('health');
  });
});
