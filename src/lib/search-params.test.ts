import { describe, expect, it } from 'vitest';
import { compactSearch } from './search-params';
describe('compactSearch', () => {
  it('keeps only params with a value', () => expect(compactSearch({ type: '', city: 'Helsinki', archive: false, view: 'list' }, { view: 'list' })).toEqual({ city: 'Helsinki' }));
});
