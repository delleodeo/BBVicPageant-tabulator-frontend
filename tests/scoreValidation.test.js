import assert from 'node:assert/strict';
import test from 'node:test';
import { validScore } from '../src/utils/score.js';

test('accepts valid tenth-point scores from zero through ten', () => {
  assert.equal(validScore(0), true);
  assert.equal(validScore('8.7'), true);
  assert.equal(validScore(10), true);
});

test('rejects blank, out-of-range, and overly precise scores', () => {
  assert.equal(validScore(''), false);
  assert.equal(validScore(null), false);
  assert.equal(validScore(undefined), false);
  assert.equal(validScore(-0.1), false);
  assert.equal(validScore(10.1), false);
  assert.equal(validScore(8.75), false);
});
