import deepFreeze from 'deep-freeze';
import downloads from '../../app/assets/javascripts/reducers/downloads';
import { ADD_DOWNLOAD, UPDATE_DOWNLOAD } from '../../app/assets/javascripts/constants';

describe('downloads reducer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('adds a new download', () => {
    const initialState = { items: [], unreadCount: 0 };
    const download = { id: 'campaign-students', status: 'pending' };
    deepFreeze(initialState);

    expect(downloads(initialState, { type: ADD_DOWNLOAD, download })).toEqual({
      items: [download],
      unreadCount: 1
    });
  });

  test('replaces an existing download with the same id when it is retried', () => {
    const oldDownload = { id: 'campaign-students', status: 'error', createdAt: 1 };
    const retriedDownload = { id: 'campaign-students', status: 'pending', createdAt: 2 };
    const initialState = { items: [oldDownload], unreadCount: 0 };
    deepFreeze(initialState);

    expect(downloads(initialState, { type: ADD_DOWNLOAD, download: retriedDownload })).toEqual({
      items: [retriedDownload],
      unreadCount: 0
    });
  });

  test('updates the matching download without affecting other entries', () => {
    const initialState = {
      items: [
        { id: 'campaign-students', status: 'pending' },
        { id: 'campaign-courses', status: 'ready' }
      ],
      unreadCount: 0
    };
    deepFreeze(initialState);

    const result = downloads(initialState, {
      type: UPDATE_DOWNLOAD,
      id: 'campaign-students',
      changes: { status: 'ready', downloadUrl: '/students.csv' }
    });

    expect(result.items).toEqual([
      { id: 'campaign-students', status: 'ready', downloadUrl: '/students.csv' },
      { id: 'campaign-courses', status: 'ready' }
    ]);
    expect(result.unreadCount).toBe(1);
  });
});
