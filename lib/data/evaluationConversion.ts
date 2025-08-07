// This file maps raw subscale scores to a 1-5 evaluation score.
// Based on MD資料/kansanhyou.md

type EvaluationTable = Record<string, number[]>; // Thresholds for scores 1, 2, 3, 4, 5

const MALE_EVAL_TABLE: EvaluationTable = {
  // A領域
  A1: [4, 6, 8, 10], // <=4:1, <=6:2, <=8:3, <=10:4, >10:5
  A2: [4, 6, 8, 10],
  A3: [1, 2, 3, 3], // 1:1, 2:2, 3:3, 4:5
  A4: [4, 6, 8, 10],
  A5: [1, 2, 3, 3],
  A6: [10, 8, 6, 4], // reverse
  A7: [3, 2, 2, 1],  // reverse
  A8: [3, 2, 2, 1],  // reverse
  A9: [3, 2, 2, 1],  // reverse
  // B領域
  B1: [10, 8, 6, 4], // reverse
  B2: [4, 6, 8, 10],
  B3: [4, 6, 8, 10],
  B4: [4, 6, 8, 10],
  B5: [9, 12, 15, 18],
  B6: [15, 20, 25, 30],
  // C領域
  C1: [10, 8, 6, 4], // reverse
  C2: [13, 10, 7, 4], // reverse
  C3: [7, 5, 4, 2],   // reverse
  C4: [7, 5, 4, 2],   // reverse
};

// TODO: Fill in with actual female data
const FEMALE_EVAL_TABLE: EvaluationTable = MALE_EVAL_TABLE;

export const EVAL_TABLES = {
  male: MALE_EVAL_TABLE,
  female: FEMALE_EVAL_TABLE,
};
