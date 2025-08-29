"use client";

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import React from "react";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Props {
  scores: {
    A: number;
    B: number;
    C: number;
  };
}

const RadarChart: React.FC<Props> = ({ scores }) => {
  const maxValue = Math.max(scores.A, scores.B, scores.C) * 1.1;

  // Chart.js の型に合わせて明示的に mutable な型で定義する
  const data: import('chart.js').ChartData<'radar', number[], unknown> = {
    labels: ["仕事のストレス要因 (A)", "心身のストレス反応 (B)", "周囲のサポート (C)"],
    datasets: [
      {
        label: "ストレススコア",
        data: [scores.A, scores.B, scores.C],
        backgroundColor: "rgba(34,197,94,0.2)",
        borderColor: "rgba(34,197,94,1)",
        borderWidth: 2,
      },
    ],
  };

  const options: import('chart.js').ChartOptions<'radar'> = {
    scales: {
      r: {
        min: 0,
        max: maxValue,
        ticks: {
          stepSize: 10,
        },
      },
    },
  };

  return <Radar data={data} options={{ ...options, maintainAspectRatio: false }} width={384} height={384} />;
};

export default RadarChart;
