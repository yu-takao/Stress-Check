"use client";

import React, { useState, useMemo } from "react";
import { calculateScore } from "../../lib/utils/calculateScore";
import { isHighStress } from "../../lib/utils/evaluateHighStress";
import RadarChart from "./RadarChart";
import AICommentGenerator from "./AICommentGenerator";
import SubscaleTable from "./SubscaleTable";
import SubscaleRadar from "./SubscaleRadar";
import DomainSection from "./DomainSection";
import { calculateSubscaleScores } from "@/lib/utils/calculateSubscaleScores";
import { SUBSCALES } from "@/lib/utils/subscaleMeta";
import { UserData, users as allUsers } from "../../lib/data/users";

interface Props {
  users: UserData[];
}

const ScoreDashboard: React.FC<Props> = ({ users }) => {
  const [selectedId, setSelectedId] = useState<string>(users[0]?.id ?? "");

  const selectedUser = users.find((u) => u.id === selectedId) ?? users[0];
  const { yearsOfService } = selectedUser;

    const scores = useMemo(() => calculateScore(selectedUser.responses), [selectedUser]);
  const highStress = useMemo(() => isHighStress(scores), [scores]);
  const subscaleScores = useMemo(() => calculateSubscaleScores(selectedUser.responses, selectedUser.gender), [selectedUser]);
  const baselineSubscaleScores = useMemo(() => {
    if (!allUsers.length) return {} as Record<string, { raw: number; eval: number }>;
    const agg: Record<string, { raw: number; eval: number }> = {} as any;
    SUBSCALES.forEach((s) => {
      agg[s.id] = { raw: 0, eval: 0 };
    });
    allUsers.forEach((u) => {
      const subs = calculateSubscaleScores(u.responses, u.gender);
      SUBSCALES.forEach((s) => {
        agg[s.id].raw += subs[s.id]?.raw ?? 0;
        agg[s.id].eval += subs[s.id]?.eval ?? 0;
      });
    });
    SUBSCALES.forEach((s) => {
      agg[s.id].raw = Math.round((agg[s.id].raw / allUsers.length) * 10) / 10;
      agg[s.id].eval = Math.round((agg[s.id].eval / allUsers.length) * 10) / 10;
    });
    return agg;
  }, []);
  const detailedSubscaleScores = useMemo(() => {
    const details: Record<string, { label: string; reverse: boolean; raw: number; eval: number }> = {};
    SUBSCALES.forEach((s) => {
      details[s.id] = {
        label: s.label.replace(/★$/, ''),
        reverse: !!s.reverse,
        raw: subscaleScores[s.id]?.raw ?? 0,
        eval: subscaleScores[s.id]?.eval ?? 0,
      };
    });
    return details;
  }, [subscaleScores]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto bg-white shadow rounded-lg p-8">
      {/* ユーザー選択 */}
      <label className="block text-sm font-medium">
        ユーザーを選択
        <select
          className="mt-1 block w-60 rounded border border-gray-300 p-2"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.id})
            </option>
          ))}
        </select>
      </label>

      {/* メイン表示 */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* 左カラム */}
        <div className="flex-1 space-y-6">
          {/* レーダーチャート */}
          <div className="mx-auto md:mx-0 w-72 md:w-96 h-72 md:h-96">
            <RadarChart scores={scores} />
          </div>

          {/* スコア詳細 */}
          <section>
            <h2 className="font-semibold mb-2">スコア詳細</h2>
            <ul className="list-disc ml-6 space-y-1 text-sm md:text-base">
              <li>A 領域 (仕事のストレス要因): {scores.A} 点</li>
              <li>B 領域 (心身のストレス反応): {scores.B} 点</li>
                        <li>C 領域 (周囲のサポート): {scores.C} 点</li>
            </ul>

            {/* 高ストレス判定 */}
            <p className={`mt-4 text-base md:text-lg font-bold ${highStress ? "text-red-600" : "text-emerald-600"}`}>
              高ストレス者判定: {highStress ? "該当" : "非該当"}
            </p>
          </section>
        </div>

        {/* 右カラム */}
        <div className="flex-1 md:max-w-md lg:max-w-lg xl:max-w-xl">
          <AICommentGenerator
            scores={{
              scoreA: scores.A,
              scoreB: scores.B,
              scoreC: scores.C,
              total: scores.A + scores.B + scores.C,
              highStress,
            }}
            userName={selectedUser.name}
            department={selectedUser.department}
            age={selectedUser.age}
            yearsOfService={selectedUser.yearsOfService}
            gender={selectedUser.gender}
            subscaleScores={detailedSubscaleScores}
          />
        </div>
      </div>

      {/* 領域別 19 尺度表示 */}
      <div className="mt-10 space-y-12">
        <DomainSection domain="A" scores={subscaleScores} showRaw={false} baselineScores={baselineSubscaleScores} />
        <DomainSection domain="B" scores={subscaleScores} showRaw={false} baselineScores={baselineSubscaleScores} />
        <DomainSection domain="C" scores={subscaleScores} showRaw={false} baselineScores={baselineSubscaleScores} />
      </div>
    </div>
  );
};

export default ScoreDashboard;
