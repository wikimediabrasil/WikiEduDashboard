import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import '../testHelper';
import { RECEIVE_CAMPAIGNS_WITH_STATS, SET_FEATURED_CAMPAIGNS } from '../../app/assets/javascripts/constants';
import { fetchCampaignStatistics } from '../../app/assets/javascripts/actions/campaign_actions';
import * as requestModule from '../../app/assets/javascripts/utils/request';

const mockStore = configureMockStore([thunk]);

describe('CampaignActions', () => {
  afterEach(() => {
    requestModule.default.restore();
  });

  test('fetches every campaign for a full campaign list', async () => {
    const campaigns = [{ slug: 'miscellanea', title: 'Default Campaign' }];
    const request = sinon.stub(requestModule, 'default').resolves({
      ok: true,
      json: sinon.fake.returns({ campaigns })
    });
    const store = mockStore({});

    await store.dispatch(fetchCampaignStatistics());

    expect(request.calledOnceWith('/campaigns/statistics.json?user_only=false&newest=false')).toBe(true);
    expect(store.getActions()).toEqual([
      { type: RECEIVE_CAMPAIGNS_WITH_STATS, data: { campaigns } }
    ]);
  });

  test('fetches only the newest campaigns for Explore when none are featured', async () => {
    const campaigns = [{ slug: 'new-campaign', title: 'New Campaign' }];
    const request = sinon.stub(requestModule, 'default');
    request.onCall(0).resolves({
      ok: true,
      json: sinon.fake.returns({ featured_campaigns: [] })
    });
    request.onCall(1).resolves({
      ok: true,
      json: sinon.fake.returns({ campaigns })
    });
    const store = mockStore({});

    await store.dispatch(fetchCampaignStatistics(false, true));

    expect(request.secondCall.calledWith('/campaigns/statistics.json?user_only=false&newest=true')).toBe(true);
    expect(store.getActions()).toEqual([
      { type: SET_FEATURED_CAMPAIGNS, data: { featured_campaigns: [] } },
      { type: RECEIVE_CAMPAIGNS_WITH_STATS, data: { campaigns } }
    ]);
  });
});
