import { SUBSCALES } from './subscaleMeta';
import { EVAL_TABLES } from '../data/evaluationConversion';

export type Responses = Record<string, number>;

const scoreNormal = (v: number) => (v >= 1 && v <= 4 ? v : 0);
const scoreInverse = (v: number) => (v >= 1 && v <= 4 ? 5 - v : 0);

function getEvaluationScore(raw: number, thresholds: number[]): number {
  if (thresholds.length !== 4) return 3; // Default
  const [t1, t2, t3, t4] = thresholds;

  // Reversed scales (e.g., A6)
  if (t1 > t4) {
    if (raw >= t1) return 1;
    if (raw >= t2) return 2;
    if (raw >= t3) return 3;
    if (raw >= t4) return 4;
    return 5;
  }
  
  // Normal scales
  if (raw <= t1) return 1;
  if (raw <= t2) return 2;
  if (raw <= t3) return 3;
  if (raw <= t4) return 4;
  return 5;
}

export const calculateSubscaleScores = (
  responses: Responses,
  gender: 'male' | 'female'
): Record<string, { raw: number; eval: number }> => {
  const scores: Record<string, { raw: number; eval: number }> = {};
  const evalTable = EVAL_TABLES[gender];

  SUBSCALES.forEach(scale => {
    let sum = 0;
    for (const q of scale.items) {
      const ans = responses[q.toString()] ?? 0;
      sum += scale.reverse ? scoreInverse(ans) : scoreNormal(ans);
    }
    scores[scale.id] = {
      raw: sum,
      eval: getEvaluationScore(sum, evalTable[scale.id] ?? [0, 0, 0, 0]),
    };
  });
  return scores;
};