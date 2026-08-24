import '../testHelper';

const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;
global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../../app/assets/javascripts/actions/campaign_actions', () => ({
  fetchAllCampaigns: jest.fn(() => ({ type: 'FETCH_ALL_CAMPAIGNS_TEST' })),
  fetchCampaignStatistics: jest.fn(() => ({ type: 'FETCH_CAMPAIGN_STATISTICS_TEST' })),
  sortCampaigns: jest.fn(key => ({ type: 'SORT_CAMPAIGNS_TEST', key })),
}));

const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = require('react-dom/test-utils');
const { Provider } = require('react-redux');
const { createStore } = require('redux');
const { MemoryRouter } = require('react-router-dom');
const CampaignList = require('../../app/assets/javascripts/components/campaign/campaign_list').default;

const campaigns = Array.from({ length: 25 }, (_, index) => ({
  slug: `campaign-${index + 1}`,
  title: `Campaign ${index + 1}`,
}));

const CampaignRow = ({ campaign }) => (
  <tr><td>{campaign.title}</td></tr>
);

describe('CampaignList pagination', () => {
  let container;
  let root;

  beforeEach(() => {
    const store = createStore(state => state, {
      campaigns: {
        all_campaigns: campaigns,
        all_campaigns_loaded: true,
        campaign_pagination: { current_page: 1, total_entries: 11, total_pages: 2 },
        sort: { key: null, sortKey: null },
      },
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root.render(
        <Provider store={store}>
          <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <CampaignList
              keys={{ title: { label: 'Campaigns' } }}
              RowElement={CampaignRow}
              paginate
            />
          </MemoryRouter>
        </Provider>
      );
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  test('requests another page from the backend when a page is selected', () => {
    expect(container.querySelectorAll('tbody tr')).toHaveLength(25);
    expect(container.querySelector('.pagination')).not.toBeNull();

    const secondPage = container.querySelector('.pagination li:nth-child(3) a');
    act(() => secondPage.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(require('../../app/assets/javascripts/actions/campaign_actions').fetchAllCampaigns)
      .toHaveBeenLastCalledWith({
        page: 2,
        search: null,
      });
  });
});
