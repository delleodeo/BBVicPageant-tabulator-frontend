import assert from 'node:assert/strict';
import test from 'node:test';
import {
  categoryScoreProgress,
  indexJudgeScores,
  overallScoreProgress
} from '../src/utils/judgeScoreProgress.js';

test('counts each confirmed category score, including a score of zero', () => {
  const contestants = [{ _id: 'a' }, { _id: 'b' }, { _id: 'c' }];
  const categories = [{ key: 'outfit' }, { key: 'swimsuit' }];
  const scores = indexJudgeScores([
    { contestantId: 'a', outfit: 0, swimsuit: 8.1 },
    { contestantId: { _id: 'b' }, outfit: 9.4 },
    { contestantId: 'c', swimsuit: null }
  ]);

  assert.deepEqual(categoryScoreProgress(contestants, scores, 'outfit'), {
    completed: 2, total: 3, percent: 67
  });
  assert.deepEqual(categoryScoreProgress(contestants, scores, 'swimsuit'), {
    completed: 1, total: 3, percent: 33
  });
  assert.deepEqual(overallScoreProgress(contestants, categories, scores), {
    completed: 3, total: 6, percent: 50
  });
});

test('ignores scores for candidates outside the active roster', () => {
  const scores = indexJudgeScores([
    { contestantId: 'a', beauty: 9.2 },
    { contestantId: 'eliminated', beauty: 10 }
  ]);

  assert.deepEqual(categoryScoreProgress([{ _id: 'a' }], scores, 'beauty'), {
    completed: 1, total: 1, percent: 100
  });
  assert.deepEqual(overallScoreProgress([], [{ key: 'beauty' }], scores), {
    completed: 0, total: 0, percent: 0
  });
});
