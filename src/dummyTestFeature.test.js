import test from 'node:test';
import assert from 'node:assert';
import { dummyTestFeature } from './dummyTestFeature.js';

test('dummyTestFeature returns the fixed string dummy-test-feature-ok', () => {
  const result = dummyTestFeature();
  assert.strictEqual(result, 'dummy-test-feature-ok');
});
