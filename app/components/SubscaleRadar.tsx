"use client";
import React from "react";
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";
import { Radar } from "react-chartjs-2";
import { SubScale } from "@/lib/utils/subscaleMeta";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Props {
  scales: SubScale[];
  scores: Record<string, { raw: number; eval: number }>;
  baselineScores?: Record<string, { raw: number; eval: number }>;
}

function wrapJapaneseLabel(label: string, maxPerLine = 7): string | string[] {
  const clean = label.replace(/★$/, "*");
  // 句読点や中点で優先的に分割
  const separators = ["・", "／", "/", "(", "（", " ）", ")"];
  for (const sep of separators) {
    if (clean.includes(sep)) {
      const parts = clean.split(sep).filter(Boolean);
      const lines: string[] = [];
      for (const p of parts) {
        for (let i = 0; i < p.length; i += maxPerLine) {
          lines.push(p.slice(i, i + maxPerLine));
        }
      }
      return lines;
    }
  }
  if (clean.length <= maxPerLine) return clean;
  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += maxPerLine) {
    chunks.push(clean.slice(i, i + maxPerLine));
  }
  return chunks;
}

export default function SubscaleRadar({ scales, scores, baselineScores }: Props) {
  const labels = scales.map((s) => wrapJapaneseLabel(s.label, 7));
  const dataVals = scales.map((s) => scores[s.id]?.eval ?? 3);
  const baseVals = baselineScores ? scales.map((s) => baselineScores[s.id]?.eval ?? 3) : undefined;

  const data = {
    labels,
    datasets: [
      {
        label: "評価点",
        data: dataVals,
        backgroundColor: "rgba(59,130,246,0.2)",
        borderColor: "rgba(59,130,246,1)",
        borderWidth: 2,
        pointRadius: 2,
      },
      ...(baseVals
        ? [{
            label: "全体平均",
            data: baseVals,
            backgroundColor: "rgba(107,114,128,0.15)",
            borderColor: "rgba(107,114,128,0.9)",
            borderWidth: 1.5,
            pointRadius: 1.5,
          }] as const
        : []),
    ],
  } as const;

  const options = {
    scales: {
      r: {
        min: 0,
        max: 5,
        ticks: { stepSize: 1 },
        pointLabels: {
          font: { size: 10 },
        },
      },
    },
    plugins: { legend: { display: true, position: "bottom" } },
    layout: { padding: 12 },
  } as const;

  return (
    <div className="w-full h-72">
      <Radar data={data} options={{ ...options, maintainAspectRatio: false }} />
    </div>
  );
}