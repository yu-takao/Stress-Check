"use client";
import { SubScale } from "@/lib/utils/subscaleMeta";
import React from "react";

interface Props {
  scales: SubScale[];
  scores: Record<string, { raw: number; eval: number }>;
  showRaw?: boolean;
  baselineScores?: Record<string, { raw: number; eval: number }>;
}

export default function SubscaleTable({ scales, scores, showRaw = true, baselineScores }: Props) {
  const hasBaseline = !!baselineScores;
  return (
    <table className="w-full text-sm border border-gray-300">
      <thead className="bg-gray-100">
        <tr>
          <th className={`px-2 py-1 text-left ${hasBaseline ? 'w-1/2' : 'w-2/3'}`}>尺度</th>
          <th className={`px-2 py-1 text-right ${hasBaseline ? 'w-1/4' : 'w-1/3'}`}>評価点</th>
          {hasBaseline && (
            <th className="px-2 py-1 text-right text-gray-600 w-1/4">全体平均</th>
          )}
          {showRaw && (
            <th className="px-2 py-1 text-right text-gray-500">素点</th>
          )}
        </tr>
      </thead>
      <tbody>
        {scales.map((s) => (
          <tr key={s.id} className="border-t">
            <td className="px-2 py-1 whitespace-nowrap truncate align-top">{s.label}</td>
            <td className="px-2 py-1 text-right font-medium tabular-nums align-top">{scores[s.id]?.eval ?? 'N/A'}</td>
            {hasBaseline && (
              <td className="px-2 py-1 text-right text-gray-600 tabular-nums align-top">{baselineScores![s.id]?.eval ?? 'N/A'}</td>
            )}
            {showRaw && (
              <td className="px-2 py-1 text-right text-gray-500">({scores[s.id]?.raw ?? 'N/A'})</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}