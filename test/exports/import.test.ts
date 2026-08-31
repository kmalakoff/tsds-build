import assert from 'assert';
import build from 'tsds-build';

describe('exports .ts', () => {
  it('defaults', () => {
    assert.equal(typeof build, 'function');
  });
});
