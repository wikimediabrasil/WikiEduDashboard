import { fetchWikiContributions } from '../../../app/assets/javascripts/components/user_profiles/course_contributions';
import request from '../../../app/assets/javascripts/utils/request';

jest.mock('react-router-dom', () => ({ Link: 'a', useLocation: jest.fn() }));
jest.mock('../../../app/assets/javascripts/utils/request', () => ({
  __esModule: true,
  default: jest.fn(),
  ensureOk: jest.fn(response => Promise.resolve(response))
}));

describe('program contribution history', () => {
  const course = { start: '2024-01-01T00:00:00Z', end: '2024-12-31T00:00:00Z' };
  const wiki = { id: 1, language: 'en', project: 'wikipedia', domain: 'en.wikipedia.org',
    excluded_page_ids: [2], scoped_titles: ['Tracked page'], scoped_page_ids: [] };

  beforeEach(() => request.mockReset());

  test('follows continuation and keeps only pages tracked by the program', async () => {
    request.mockResolvedValueOnce({ json: async () => ({
      query: { usercontribs: [{ revid: 1, pageid: 1, title: 'Tracked_page' }] },
      continue: { uccontinue: 'next', continue: '-||' }
    }) }).mockResolvedValueOnce({ json: async () => ({
      query: { usercontribs: [{ revid: 2, pageid: 2, title: 'Tracked page' },
        { revid: 3, pageid: 3, title: 'Other page' }] }
    }) });

    const revisions = await fetchWikiContributions('Editor', course, wiki);
    expect(revisions.map(revision => revision.revid)).toEqual([1]);
    expect(request).toHaveBeenCalledTimes(2);
  });

  test('reports API errors instead of returning an incomplete history', async () => {
    request.mockResolvedValue({ json: async () => ({ error: { code: 'error' } }) });
    await expect(fetchWikiContributions('Editor', course, wiki)).rejects.toThrow();
  });
});
