import '../testHelper';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';

import request from '../../app/assets/javascripts/utils/request';

jest.mock('../../app/assets/javascripts/utils/request', () => jest.fn());

import CampaignSearch from '../../app/assets/javascripts/components/explore/campaign_search';

global.IS_REACT_ACT_ENVIRONMENT = true;

const mount = (element) => {
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(element));
  return {
    rerender: element => act(() => root.render(element)),
    query: selector => container.querySelector(selector),
    find: selector => ({
      simulate: (event, data) => act(() => Simulate[event](container.querySelector(selector), data))
    }),
    unmount: () => act(() => root.unmount())
  };
};

const mockSetParams = jest.fn();
let mockParams = new URLSearchParams('search=old&page=4');
jest.mock('react-router-dom', () => ({
  useSearchParams: () => [mockParams, mockSetParams]
}));

describe('Campaign search', () => {
  beforeEach(() => {
    mockParams = new URLSearchParams('search=old&page=4');
  });

  it('restores inputs and opens advanced filters when the URL changes', () => {
    const wrapper = mount(<CampaignSearch />);
    mockParams = new URLSearchParams('search=frutas&label_search=Q123&creation_start=2026-08-01');
    wrapper.rerender(<CampaignSearch />);
    expect(wrapper.query('#campaign-search').value).toEqual('frutas');
    expect(wrapper.query('#campaign-qid').value).toEqual('Q123');
    expect(wrapper.query('#campaign-creation-start').value).toEqual('2026-08-01');
    wrapper.unmount();
  });

  it('suggests matching campaigns after typing a QID and ignores stale responses', async () => {
    jest.useFakeTimers();
    let resolveOld;
    request.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
    request.mockResolvedValueOnce({ ok: true, json: async () => ({ campaigns: [{ title: 'Frutas', slug: 'frutas' }] }) });
    const wrapper = mount(<CampaignSearch />);
    wrapper.find('#campaign-search').simulate('change', { target: { value: 'old' } });
    await act(async () => { jest.advanceTimersByTime(300); });
    wrapper.find('#campaign-search').simulate('change', { target: { value: 'q123' } });
    await act(async () => { jest.advanceTimersByTime(300); });
    expect(request.mock.calls.at(-1)[0]).toContain('search=q123');
    expect(wrapper.query('.campaign-suggestions a').textContent).toEqual('Frutas');
    expect(wrapper.query('.campaign-suggestions a').getAttribute('href')).toEqual('/campaigns/frutas/programs');
    await act(async () => { resolveOld({ ok: true, json: async () => ({ campaigns: [{ title: 'Stale', slug: 'stale' }] }) }); });
    expect(wrapper.query('.campaign-suggestions a').textContent).toEqual('Frutas');
    wrapper.find('form').simulate('submit', { preventDefault() {} });
    expect(mockSetParams.mock.calls.at(-1)[0].get('search')).toEqual('q123');
    expect(wrapper.query('.campaign-suggestions')).toBeNull();
    wrapper.unmount();
    jest.useRealTimers();
  });

  it('submits campaign name and dates, resetting pagination', () => {
    const wrapper = mount(<CampaignSearch />);
    wrapper.find('.advanced-search-toggle-button').simulate('click');
    wrapper.find('#campaign-search').simulate('change', { target: { value: '  frutas  ' } });
    wrapper.find('#campaign-creation-start').simulate('change', { target: { value: '2026-08-01' } });
    wrapper.find('#campaign-creation-end').simulate('change', { target: { value: '2026-08-31' } });
    wrapper.find('form').simulate('submit', { preventDefault() {} });
    expect(mockSetParams.mock.calls.at(-1)[0].toString()).toEqual('search=frutas&creation_start=2026-08-01&creation_end=2026-08-31');
    wrapper.unmount();
  });

  it('combines normalized QIDs with campaign name and dates', () => {
    const wrapper = mount(<CampaignSearch />);
    expect(wrapper.query('#campaign-qid')).toBeNull();
    wrapper.find('.advanced-search-toggle-button').simulate('click');
    wrapper.find('#campaign-qid').simulate('change', { target: { value: 'q123, Q456' } });
    wrapper.find('.advanced-search-toggle-button').simulate('click');
    expect(wrapper.query('#campaign-qid')).toBeNull();
    wrapper.find('.advanced-search-toggle-button').simulate('click');
    expect(wrapper.query('#campaign-qid').value).toEqual('q123, Q456');
    wrapper.find('#campaign-creation-start').simulate('change', { target: { value: '2026-08-01' } });
    wrapper.find('form').simulate('submit', { preventDefault() {} });
    const params = mockSetParams.mock.calls.at(-1)[0];
    expect(params.get('label_search')).toEqual('Q123,Q456');
    expect(params.get('search')).toEqual('old');
    expect(params.get('creation_start')).toEqual('2026-08-01');
    expect(params.has('page')).toEqual(false);
    wrapper.find('#campaign-qid').simulate('change', { target: { value: '' } });
    wrapper.find('form').simulate('submit', { preventDefault() {} });
    expect(mockSetParams.mock.calls.at(-1)[0].has('label_search')).toEqual(false);
    wrapper.unmount();
  });

  it('allows clearing the previous search', () => {
    const wrapper = mount(<CampaignSearch />);
    wrapper.find('#campaign-search').simulate('change', { target: { value: '' } });
    wrapper.find('form').simulate('submit', { preventDefault() {} });
    expect(mockSetParams.mock.calls.at(-1)[0].toString()).toEqual('');
    wrapper.unmount();
  });
});
