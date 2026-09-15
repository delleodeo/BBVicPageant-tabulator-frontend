export function scoreOwnerId(value) {
  return String(value?._id || value || '');
}

export function indexJudgeScores(scores = []) {
  return Object.fromEntries(scores.map((score) => [scoreOwnerId(score.contestantId), score]));
}

export function hasCategoryScore(scoresByContestant, contestantId, categoryKey) {
  const value = scoresByContestant[scoreOwnerId(contestantId)]?.[categoryKey];
  return value !== undefined && value !== null;
}

export function categoryScoreProgress(contestants, scoresByContestant, categoryKey) {
  const total = contestants.length;
  const completed = contestants.filter((contestant) => hasCategoryScore(scoresByContestant, contestant._id, categoryKey)).length;
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
}

export function overallScoreProgress(contestants, categories, scoresByContestant) {
  const total = contestants.length * categories.length;
  const completed = categories.reduce(
    (sum, category) => sum + categoryScoreProgress(contestants, scoresByContestant, category.key).completed,
    0
  );
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
}
