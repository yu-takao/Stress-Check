"use client";

import { useMemo } from "react";
import { users } from "../../lib/data/users";
import { calculateSubscaleScores } from "../../lib/utils/calculateSubscaleScores";
import { SUBSCALES } from "../../lib/utils/subscaleMeta";
// mathjs is a lightweight math library (≈ 90 kB gzip) and works in the browser
import { multiply, transpose, inv } from "mathjs";

// 解析に使用する尺度（A と C 領域）
const PREDICTOR_IDS = SUBSCALES.filter((s) => s.domain === "A" || s.domain === "C").map((s) => s.id);

type RegressionResult = {
  intercept: number;
  coefficients: { id: string; beta: number }[];
};

function runRegression(): RegressionResult {
  const X: number[][] = [];
  const Y: number[] = [];

  users.forEach((u) => {
    // 評価点計算（性別はデータに無い場合 male とみなす）
    const gender = (u as any).gender === "女性" ? "female" : "male";
    const sub = calculateSubscaleScores(u.responses, gender);

    // 1 行分の説明変数（先頭は定数項）
    const row: number[] = [1];
    PREDICTOR_IDS.forEach((id) => {
      row.push(sub[id]?.eval ?? 0);
    });
    X.push(row);

    // 目的変数：B 領域合計 (B10 を除外する)
    let stress = 0;
    for (let q = 18; q <= 46; q++) {
      let v = u.responses[q.toString()] ?? 0;
      if (q === 27) {
        // B10 は逆転項目
        if (v >= 1 && v <= 4) v = 5 - v;
      }
      stress += v;
    }
    Y.push(stress);
  });

  // β = (Xᵀ X)⁻¹ Xᵀ y
  const Xt = transpose(X);
  const betaVec = multiply(inv(multiply(Xt, X)), multiply(Xt, Y)) as number[];

  return {
    intercept: betaVec[0],
    coefficients: PREDICTOR_IDS.map((id, idx) => ({ id, beta: betaVec[idx + 1] })),
  };
}

export default function RegressionAnalysis() {
  const result = useMemo(() => runRegression(), []);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">ストレスに影響を与える因子</h3>
      <table className="min-w-full border text-sm bg-white">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border px-3 py-2 w-16">順位</th>
            <th className="border px-3 py-2">尺度</th>
          </tr>
        </thead>
        <tbody>
          {result.coefficients
            .slice()
            .sort((a, b) => Math.abs(b.beta) - Math.abs(a.beta))
            .slice(0, 3)
            .map(({ id }, idx) => {
              const label = SUBSCALES.find((s) => s.id === id)?.label ?? id;
              return (
                <tr key={id}>
                  <td className="border px-3 py-1 text-center">{idx + 1}</td>
                  <td className="border px-3 py-1">{label}</td>
                </tr>
              );
            })}
        </tbody>
        
      </table>
    </div>
  );
}

