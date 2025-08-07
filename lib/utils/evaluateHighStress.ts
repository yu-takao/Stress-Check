import { DomainScores } from "./calculateScore";

/**
 * 高ストレス者かどうか判定する
 *  - B 領域 ≥ 77 点   または
 *  - (A + C) ≥ 76 点 かつ B ≥ 63 点
 */
export const isHighStress = ({ A, B, C }: DomainScores): boolean => {
  return B >= 77 || (A + C >= 76 && B >= 63);
};
