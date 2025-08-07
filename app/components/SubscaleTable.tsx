"use client";
import { SubScale } from "@/lib/utils/subscaleMeta";
import React from "react";

interface Props {
  scales: SubScale[];
  scores: Record<string, { raw: number; eval: number }>;
}

export default function SubscaleTable({ scales, scores }: Props) {
  return (
    <table className="min-w-full text-sm border border-gray-300">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-2 py-1 text-left">尺度</th>
          <th className="px-2 py-1 text-right">評価点</th>
          <th className="px-2 py-1 text-right text-gray-500">素点</th>
        </tr>
      </thead>
      <tbody>
        {scales.map((s) => (
          <tr key={s.id} className="border-t">
            <td className="px-2 py-1 whitespace-nowrap">{s.label}</td>
            <td className="px-2 py-1 text-right font-medium">{scores[s.id]?.eval ?? 'N/A'}</td>
            <td className="px-2 py-1 text-right text-gray-500">({scores[s.id]?.raw ?? 'N/A'})</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}