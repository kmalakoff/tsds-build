const assert = require('assert');
const build = require('tsds-build');

describe('exports .cjs', () => {
  it('defaults', () => {
    assert.equal(typeof build, 'function');
  });
});
