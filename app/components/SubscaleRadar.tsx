"use client";
import React from "react";
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";
import { Radar } from "react-chartjs-2";
import { SubScale } from "@/lib/utils/subscaleMeta";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Props {
  scales: SubScale[];
  scores: Record<string, { raw: number; eval: number }>;
}

export default function SubscaleRadar({ scales, scores }: Props) {
  const labels = scales.map((s) => s.label.replace(/★$/, "*"));
  const dataVals = scales.map((s) => scores[s.id]?.eval ?? 3);

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
    ],
  } as const;

  const options = {
    scales: {
      r: {
        min: 0,
        max: 5,
        ticks: { stepSize: 1 },
      },
    },
    plugins: { legend: { display: false } },
  } as const;

  return (
    <div className="w-full h-72">
      <Radar data={data} options={{ ...options, maintainAspectRatio: false }} />
    </div>
  );
}