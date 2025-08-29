"use client";

import React, { useState, useMemo } from "react";
import { calculateScore } from "../../lib/utils/calculateScore";
import { isHighStress } from "../../lib/utils/evaluateHighStress";
import AICommentGenerator from "./AICommentGenerator";
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

      {/* 領域別 19 尺度表示（表＋レーダーのみ） */}
      <div className="mt-2 space-y-12">
        <DomainSection domain="A" scores={subscaleScores} showRaw={false} baselineScores={baselineSubscaleScores} />
        <DomainSection domain="B" scores={subscaleScores} showRaw={false} baselineScores={baselineSubscaleScores} />
        <DomainSection domain="C" scores={subscaleScores} showRaw={false} baselineScores={baselineSubscaleScores} />
      </div>

      {/* AIコメント（下部に配置） */}
      <div className="mt-6">
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
  );
};

export default ScoreDashboard;
