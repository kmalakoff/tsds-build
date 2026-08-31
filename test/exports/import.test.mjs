import assert from 'assert';
import build from 'tsds-build';

describe('exports .mjs', () => {
  it('defaults', () => {
    assert.equal(typeof build, 'function');
  });
});
