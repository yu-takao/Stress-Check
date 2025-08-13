"use client";

import { users } from "../../lib/data/users";

const COLS = ["営業部", "技術部"] as const;
const ROWS: { key: string; label: string; range: (y: number) => boolean }[] = [
  { key: "1", label: "～1年", range: (y) => y === 1 },
  { key: "2-5", label: "2～5年", range: (y) => y >= 2 && y <= 5 },
  { key: "6+", label: "6年～", range: (y) => y >= 6 },
];

function calcStress(res: Record<string, number>): number {
  let sum = 0;
  for (let q = 18; q <= 46; q++) {
    let v = res[q.toString()] ?? 0;
    if (q === 27) {
      if (v >= 1 && v <= 4) v = 5 - v; // 逆転
    }
    sum += v;
  }
  return sum;
}

// 集計マトリクス
function buildMatrix() {
  const matrix: Record<string, Record<string, number[]>> = {};
  ROWS.forEach((r) => {
    matrix[r.key] = {} as any;
    COLS.forEach((c) => (matrix[r.key][c] = []));
  });

  users.forEach((u) => {
    const y = u.yearsOfService ?? 1;
    const row = ROWS.find((r) => r.range(y));
    if (!row) return;
    const stress = calcStress(u.responses);
    matrix[row.key][u.department].push(stress);
  });
  return matrix;
}

function average(arr: number[]): number {
  if (!arr.length) return 0;
  return (
    Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 // 1 小数
  );
}

export default function StressDeptYearsTable() {
  const matrix = buildMatrix();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-max border text-sm">
        <thead>
          <tr>
            <th className="border px-3 py-2 bg-gray-50" rowSpan={2} colSpan={1}>
              勤続年数
            </th>
            {COLS.map((c) => (
              <th key={c} className="border px-3 py-2 bg-gray-100">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.key}>
              <td className="border px-3 py-2 font-medium bg-gray-50">{r.label}</td>
              {COLS.map((c) => {
                const vals = matrix[r.key][c];
                const avg = average(vals);
                return (
                  <td key={c} className="border px-3 py-2 text-center">
                    {vals.length ? avg : "-"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

