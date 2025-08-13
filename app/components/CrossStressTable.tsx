"use client";

import { users } from "../../lib/data/users";
import { GroupKey, getCategories } from "../../lib/utils/grouping";

function calcStress(res: Record<string, number>): number {
  let sum = 0;
  for (let q = 18; q <= 46; q++) {
    let v = res[q.toString()] ?? 0;
    if (q === 27) {
      // B10 は逆転項目: 1→4, 2→3, 3→2, 4→1
      if (v >= 1 && v <= 4) v = 5 - v;
    }
    sum += v;
  }
  return sum;
}

function average(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

import { UserData } from "@/lib/data/users";

interface Props {
  xKey: GroupKey;
  yKey: GroupKey;
  onSelectCluster?: (users: UserData[]) => void;
}

export default function CrossStressTable({ xKey, yKey, onSelectCluster }: Props) {
  const cols = getCategories(xKey);
  const rows = getCategories(yKey);

  // matrix (値) と対応ユーザー
  const matrixVals: Record<string, Record<string, number[]>> = {} as any;
  const matrixUsers: Record<string, Record<string, UserData[]>> = {} as any;
  rows.forEach((r) => {
    matrixVals[r.key] = {} as any;
    matrixUsers[r.key] = {} as any;
    cols.forEach((c) => {
      matrixVals[r.key][c.key] = [];
      matrixUsers[r.key][c.key] = [];
    });
  });

  users.forEach((u) => {
    const row = rows.find((r) => r.match(u));
    const col = cols.find((c) => c.match(u));
    if (!row || !col) return;
    matrixVals[row.key][col.key].push(calcStress(u.responses));
    matrixUsers[row.key][col.key].push(u);
  });

  // 平均値行列と min/max
  const avgMatrix: Record<string, Record<string, number>> = {} as any;
  let min = Infinity;
  let max = -Infinity;
  rows.forEach((r) => {
    avgMatrix[r.key] = {} as any;
    cols.forEach((c) => {
      const avgVal = average(matrixVals[r.key][c.key]);
      avgMatrix[r.key][c.key] = avgVal;
      if (avgVal > 0) {
        min = Math.min(min, avgVal);
        max = Math.max(max, avgVal);
      }
    });
  });

  const colorOf = (val: number) => {
    if (val === 0 || max === min) return "transparent";
    const ratio = (val - min) / (max - min); // 0-1
    const alpha = 0.2 + 0.5 * ratio; // 0.2 - 0.7
    return `rgba(239,68,68,${alpha.toFixed(2)})`; // red-500 with varying alpha
  };

  // 全組み合わせから高ストレス上位3クラスタを抽出
  type ClusterEntry = {
    avg: number;
    size: number;
    xKey: GroupKey;
    yKey: GroupKey;
    xLabel: string;
    yLabel: string;
    users: UserData[];
  };

  const candidateKeys: GroupKey[] = ["department", "years", "gender", "location"];
  const topCandidates: ClusterEntry[] = [];

  for (let i = 0; i < candidateKeys.length; i += 1) {
    for (let j = i + 1; j < candidateKeys.length; j += 1) {
      const X = candidateKeys[i];
      const Y = candidateKeys[j];
      const cCols = getCategories(X);
      const cRows = getCategories(Y);
      const cellVals: Record<string, Record<string, number[]>> = {} as any;
      const cellUsers: Record<string, Record<string, UserData[]>> = {} as any;
      cRows.forEach((r) => {
        cellVals[r.key] = {} as any;
        cellUsers[r.key] = {} as any;
        cCols.forEach((c) => {
          cellVals[r.key][c.key] = [];
          cellUsers[r.key][c.key] = [];
        });
      });
      users.forEach((u) => {
        const rr = cRows.find((r) => r.match(u));
        const cc = cCols.find((c) => c.match(u));
        if (!rr || !cc) return;
        cellVals[rr.key][cc.key].push(calcStress(u.responses));
        cellUsers[rr.key][cc.key].push(u);
      });
      cRows.forEach((r) => {
        cCols.forEach((c) => {
          const arr = cellVals[r.key][c.key];
          if (!arr.length) return;
          const avgVal = average(arr);
          topCandidates.push({
            avg: avgVal,
            size: arr.length,
            xKey: X,
            yKey: Y,
            xLabel: c.label,
            yLabel: r.label,
            users: cellUsers[r.key][c.key],
          });
        });
      });
    }
  }

  topCandidates.sort((a, b) => (b.avg - a.avg) || (b.size - a.size));
  const top3 = topCandidates.slice(0, 3);

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">ストレス値</h3>
      <p className="text-xs text-gray-500">セルはストレス値を示し、背景が赤いほどストレスが高いことを示しています。</p>
      <div className="md:flex md:gap-4">
        <div className="overflow-x-auto md:flex-1">
      <table className="min-w-max border text-sm">
        <thead>
          <tr>
            <th className="border px-3 py-2 bg-gray-50" rowSpan={1} colSpan={1}></th>
            {cols.map((c) => (
              <th key={c.key} className="border px-3 py-2 bg-gray-100 font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="border px-3 py-2 bg-gray-50 font-medium whitespace-nowrap">{r.label}</td>
              {cols.map((c) => {
                const avg = avgMatrix[r.key][c.key];
                return (
                  <td
                    key={c.key}
                    className="border px-3 py-2 text-center cursor-pointer hover:ring-2 hover:ring-purple-400"
                    style={{ backgroundColor: colorOf(avg) }}
                    onClick={() => onSelectCluster?.(matrixUsers[r.key][c.key])}
                  >
                    {avg > 0 ? avg : "-"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
        </div>

        {/* 右: 全組合せの上位3クラスタ */}
        <div className="mt-4 md:mt-0 md:w-80 lg:w-96">
          <div className="border rounded-md p-3 bg-white shadow-sm">
            <h4 className="font-semibold text-sm mb-2">高ストレス上位クラスタ</h4>
            <ol className="space-y-2 text-sm">
              {top3.map((t, idx) => (
                <li key={idx}>
                  <button
                    className="w-full text-left p-2 rounded hover:bg-purple-50 border border-transparent hover:border-purple-200"
                    onClick={() => onSelectCluster?.(t.users)}
                    title="クリックで詳細を表示"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-medium">{t.avg}</span>
                      <span className="text-gray-400">n={t.size}</span>
                    </div>
                    <div className="mt-1 text-gray-600">
                      <span className="inline-block mr-2 px-1.5 py-0.5 bg-gray-100 rounded">{t.yKey}</span>
                      <span className="inline-block mr-2">{t.yLabel}</span>
                    </div>
                    <div className="text-gray-600">
                      <span className="inline-block mr-2 px-1.5 py-0.5 bg-gray-100 rounded">{t.xKey}</span>
                      <span className="inline-block mr-2">{t.xLabel}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

