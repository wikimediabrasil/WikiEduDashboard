import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server.node';
import { useDispatch, useSelector } from 'react-redux';
import DownloadsBell from '../../app/assets/javascripts/components/nav/downloads_bell';

jest.mock('react-redux', () => ({ useDispatch: jest.fn(), useSelector: jest.fn() }));

describe('DownloadsBell', () => {
  it('renders the profile filename while retaining timed-out report retries', () => {
    useDispatch.mockReturnValue(jest.fn());
    useSelector.mockImplementation(selector => selector({
      downloads: {
        unreadCount: 1,
        items: [
          {
            id: 'profile',
            label: 'Profile',
            status: 'ready',
            downloadUrl: 'data:text/csv,test',
            filename: 'Example_statistics.csv'
          },
          { id: 'report', label: 'Report', status: 'timeout' }
        ]
      }
    }));
    const container = document.createElement('div');
    container.innerHTML = renderToStaticMarkup(<DownloadsBell />);
    const link = container.querySelector('.downloads-list__download-button');

    expect(link.getAttribute('download')).toBe('Example_statistics.csv');
    expect(link.getAttribute('href')).toBe('data:text/csv,test');
    expect(container.querySelector('.downloads-list__retry-button').textContent).toBe(I18n.t('downloads.retry'));
  });
});
