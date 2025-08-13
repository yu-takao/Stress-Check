"use client";
import { SUBSCALES, SubScale } from "@/lib/utils/subscaleMeta";
import SubscaleTable from "./SubscaleTable";
import SubscaleRadar from "./SubscaleRadar";
import React from "react";

interface Props {
  domain: 'A' | 'B' | 'C';
  scores: Record<string, { raw: number; eval: number }>;
  showRaw?: boolean;
  baselineScores?: Record<string, { raw: number; eval: number }>;
}

const DOMAIN_TITLE: Record<'A' | 'B' | 'C', string> = {
  A: 'ストレスの原因と考えられる因子',
  B: 'ストレスによっておこる心身の反応',
  C: 'ストレス反応に影響を与える他の因子',
};

export default function DomainSection({ domain, scores, showRaw = true, baselineScores }: Props) {
  const scales: SubScale[] = SUBSCALES.filter((s) => s.domain === domain);
  return (
    <section className="space-y-4">
      <h3 className="font-semibold text-gray-800">{DOMAIN_TITLE[domain]}</h3>
      <div className="flex flex-col md:flex-row gap-4">
        {/* 表（テーブル） */}
        {/* 表（テーブル） */}
        <div className="w-full md:w-[360px] flex-none">
          <SubscaleTable scales={scales} scores={scores} showRaw={showRaw} baselineScores={baselineScores} />
        </div>
        {/* レーダーチャート */}
        <div className="flex-none w-72 h-72 mx-auto md:mx-0 md:ml-6">
          <SubscaleRadar scales={scales} scores={scores} baselineScores={baselineScores} />
        </div>
      </div>
    </section>
  );
}