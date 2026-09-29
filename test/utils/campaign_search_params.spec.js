import { campaignSearchParams } from '../../app/assets/javascripts/utils/campaign_search_params';

describe('campaign search parameters', () => {
  it('removes an empty title search while retaining labels', () => {
    expect(campaignSearchParams('', [{ match: 'Q349' }])).toEqual({ label_search: 'Q349' });
  });

  it('retains title search when removing labels', () => {
    expect(campaignSearchParams('Music', [])).toEqual({ search: 'Music' });
  });

  it('clears both filters', () => {
    expect(campaignSearchParams('', [])).toEqual({});
  });

  it('combines a title and multiple labels', () => {
    expect(campaignSearchParams('Music', [{ match: 'Q349' }, { match: 'Q638' }]))
      .toEqual({ search: 'Music', label_search: 'Q349,Q638' });
  });
});
