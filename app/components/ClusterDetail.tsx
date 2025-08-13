"use client";

import { SUBSCALES } from "@/lib/utils/subscaleMeta";
import { calculateSubscaleScores } from "@/lib/utils/calculateSubscaleScores";
import { UserData, users as allUsers } from "@/lib/data/users";
import DomainSection from "./DomainSection";
import ClusterAICommentGenerator from "./ClusterAICommentGenerator";

interface Props {
  users: UserData[];
}

// クラスタ内ユーザーの平均尺度スコアを算出
function aggregateScores(users: UserData[]) {
  const agg: Record<string, { raw: number; eval: number }> = {} as any;
  if (users.length === 0) return agg;
  // 初期化
  SUBSCALES.forEach((s) => {
    agg[s.id] = { raw: 0, eval: 0 };
  });

  users.forEach((u) => {
    const sub = calculateSubscaleScores(u.responses, u.gender);
    SUBSCALES.forEach((s) => {
      agg[s.id].raw += sub[s.id]?.raw ?? 0;
      agg[s.id].eval += sub[s.id]?.eval ?? 0;
    });
  });

  SUBSCALES.forEach((s) => {
    agg[s.id].raw = Math.round((agg[s.id].raw / users.length) * 10) / 10;
    agg[s.id].eval = Math.round((agg[s.id].eval / users.length) * 10) / 10;
  });

  return agg;
}

export default function ClusterDetail({ users }: Props) {
  const scores = aggregateScores(users);
  const baseline = aggregateScores(allUsers);
  return (
    <div className="mt-10 bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">選択クラスタの平均評価</h3>
      <div className="flex flex-col md:flex-row gap-8">
        {/* 左: 尺度テーブル & チャート群 */}
        <div className="flex-1 space-y-12">
          <DomainSection domain="A" scores={scores} showRaw={false} baselineScores={baseline} />
          <DomainSection domain="B" scores={scores} showRaw={false} baselineScores={baseline} />
          <DomainSection domain="C" scores={scores} showRaw={false} baselineScores={baseline} />
        </div>
        {/* 右: AI コメント */}
        <div className="md:w-96 lg:w-[28rem] flex-shrink-0">
          <ClusterAICommentGenerator users={users} />
        </div>
      </div>
    </div>
  );
}

