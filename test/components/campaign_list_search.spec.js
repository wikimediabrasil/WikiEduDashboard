import '../testHelper';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import CampaignList from '../../app/assets/javascripts/components/campaign/campaign_list';

const mockSetSearchParams = jest.fn();
jest.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams('search=Music'), mockSetSearchParams]
}));
jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: selector => selector({
    campaigns: { all_campaigns: [], all_campaigns_loaded: true, sort: {} }
  })
}));
jest.mock('../../app/assets/javascripts/actions/campaign_actions', () => ({
  fetchAllCampaigns: jest.fn()
}));
jest.mock('../../app/assets/javascripts/components/common/list', () => () => null);
jest.mock('../../app/assets/javascripts/components/common/label_search_filter', () => () => null);

describe('CampaignList title search', () => {
  const previousActEnvironment = global.IS_REACT_ACT_ENVIRONMENT;
  beforeAll(() => { global.IS_REACT_ACT_ENVIRONMENT = true; });
  afterAll(() => { global.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment; });

  it('removes the previous URL filter after clearing the input and searching', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      act(() => root.render(<CampaignList keys={[]} showSearch RowElement={() => null} />));
      const input = container.querySelector('.search-bar input');
      expect(input.value).toBe('Music');
      input.value = '';
      act(() => container.querySelector('.search-bar button').click());
      expect(mockSetSearchParams).toHaveBeenCalledWith({});
    } finally {
      act(() => root.unmount());
      container.remove();
    }
  });
});
