import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { startDownload } from '../../app/assets/javascripts/actions/download_actions';
import { ADD_DOWNLOAD, UPDATE_DOWNLOAD } from '../../app/assets/javascripts/constants';

const mockStore = configureMockStore([thunk]);

const headers = contentType => ({
  get: name => (name === 'content-type' ? contentType : null)
});

const flushPromises = () => Promise.resolve();

describe('download actions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('marks a generated file as ready', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      url: 'http://localhost:3000/system/analytics/students.csv',
      headers: headers('text/csv')
    });
    const store = mockStore({});

    await store.dispatch(startDownload({
      id: 'campaign-students',
      href: '/campaigns/example/students.csv',
      label: 'Students'
    }));
    await jest.advanceTimersByTimeAsync(100);
    await flushPromises();

    expect(store.getActions().map(action => action.type)).toEqual([ADD_DOWNLOAD, UPDATE_DOWNLOAD]);
    expect(store.getActions()[1]).toEqual({
      type: UPDATE_DOWNLOAD,
      id: 'campaign-students',
      changes: {
        status: 'ready',
        downloadUrl: 'http://localhost:3000/system/analytics/students.csv',
        filename: 'students.csv'
      }
    });
  });

  test('marks an HTTP failure as an error instead of a ready download', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      url: 'http://localhost:3000/campaigns/example/students.csv',
      headers: headers('text/html')
    });
    const store = mockStore({});

    await store.dispatch(startDownload({
      id: 'campaign-error',
      href: '/campaigns/example/students.csv',
      label: 'Students'
    }));
    await jest.advanceTimersByTimeAsync(100);
    await flushPromises();

    expect(store.getActions()[1]).toEqual({
      type: UPDATE_DOWNLOAD,
      id: 'campaign-error',
      changes: { status: 'error' }
    });
  });

  test('waits and polls again while the file is being generated', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        url: 'http://localhost:3000/campaigns/example/students.csv',
        headers: headers('text/plain'),
        text: () => Promise.resolve('This file is being generated. Please try again shortly.')
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        url: 'http://localhost:3000/system/analytics/students.csv',
        headers: headers('text/csv')
      });
    const store = mockStore({});

    await store.dispatch(startDownload({
      id: 'campaign-polling',
      href: '/campaigns/example/students.csv',
      label: 'Students'
    }));
    await jest.advanceTimersByTimeAsync(100);
    expect(store.getActions().map(action => action.type)).toEqual([ADD_DOWNLOAD]);

    await jest.advanceTimersByTimeAsync(1000);
    await flushPromises();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(store.getActions()[1].changes.status).toBe('ready');
  });
});
