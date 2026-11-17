import reducer, { revisionKey } from '../../app/assets/javascripts/reducers/revision_acceptances';
import { RECEIVE_REVISION_ACCEPTANCES, UNACCEPT_REVISION } from '../../app/assets/javascripts/constants/revision_acceptances';

describe('revision acceptances', () => {
  test('keeps reviews of identical revision IDs on different wikis separate', () => {
    const first = { wiki_id: 1, mw_rev_id: 42, status: 'validated' };
    const second = { wiki_id: 2, mw_rev_id: 42, status: 'invalidated' };
    const state = reducer(undefined, { type: RECEIVE_REVISION_ACCEPTANCES, data: [first, second] });
    expect(state.byMwRevId[revisionKey(1, 42)]).toEqual(first);
    expect(state.byMwRevId[revisionKey(2, 42)]).toEqual(second);

    const cleared = reducer(state, { type: UNACCEPT_REVISION, wikiId: 1, mwRevId: 42 });
    expect(cleared.byMwRevId[revisionKey(1, 42)]).toBeUndefined();
    expect(cleared.byMwRevId[revisionKey(2, 42)]).toEqual(second);
  });
});
