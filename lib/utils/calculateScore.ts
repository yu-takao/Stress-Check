/**
 * ストレスチェック 57 項目の回答から A/B/C 各領域の合計点を算出するユーティリティ。
 *
 * - A 領域: 仕事のストレス要因 (1–17)
 * - B 領域: 心身のストレス反応 (18–46)
 * - C 領域: 周囲のサポート (47–57)
 *   全 11 項目（47–57）が逆転項目として扱われる。
 *
 * 通常項目の採点: 1→4, 2→3, 3→2, 4→1  (score = 5 - response)
 * 逆転項目の採点: 1→1, 2→2, 3→3, 4→4  (score = response)
 */

export type Responses = Record<string, number>;

export interface DomainScores {
  A: number;
  B: number;
  C: number;
}

const scoreNormal = (value: number): number => (value >= 1 && value <= 4 ? 5 - value : 0);
const scoreInverse = (value: number): number => (value >= 1 && value <= 4 ? value : 0);

/**
 * 回答オブジェクトから領域別スコアを計算する
 */
export const calculateScore = (responses: Responses): DomainScores => {
  let A = 0;
  let B = 0;
  let C = 0;

  // A: 1–17 (通常採点)
  for (let i = 1; i <= 17; i += 1) {
    A += scoreNormal(responses[i.toString()] ?? 0);
  }

  // B: 18–46 (通常採点)
  for (let i = 18; i <= 46; i += 1) {
    B += scoreNormal(responses[i.toString()] ?? 0);
  }

  // C: 47–57 (逆転採点)
  for (let i = 47; i <= 57; i += 1) {
    C += scoreInverse(responses[i.toString()] ?? 0);
  }

  return { A, B, C };
};
