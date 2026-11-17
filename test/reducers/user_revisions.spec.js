import reducer from '../../app/assets/javascripts/reducers/user_revisions';
import { RECEIVE_USER_REVISIONS } from '../../app/assets/javascripts/constants';

test('preserves the wiki of each user revision', () => {
  const wiki = { id: 2, language: 'es', project: 'wikipedia' };
  const state = reducer(undefined, {
    type: RECEIVE_USER_REVISIONS,
    courseSlug: 'school/program',
    username: 'Editor',
    wiki: { id: 1, language: 'en', project: 'wikipedia' },
    revisions: [{ revid: 42, title: 'Artículo', wiki }]
  });
  expect(state['school/program'].Editor[0].wiki).toEqual(wiki);
  expect(state['school/program'].Editor[0].article.language).toBe('es');
});

test('keeps the same editor’s revisions separate for each program', () => {
  const wiki = { id: 1, language: 'en', project: 'wikipedia' };
  const action = { type: RECEIVE_USER_REVISIONS, username: 'Editor', wiki };
  const first = reducer(undefined, { ...action, courseSlug: 'first', revisions: [{ revid: 1 }] });
  const second = reducer(first, { ...action, courseSlug: 'second', revisions: [{ revid: 2 }] });
  expect(second.first.Editor[0].revid).toBe(1);
  expect(second.second.Editor[0].revid).toBe(2);
});
