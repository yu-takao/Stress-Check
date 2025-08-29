"use client";

import { useState } from "react";
import CrossStressTable from "./CrossStressTable";
import RegressionAnalysis from "./RegressionAnalysis";
import ClusterDetail from "./ClusterDetail";
import { UserData } from "../../lib/data/users";
import { GroupKey } from "../../lib/utils/grouping";

export default function GroupAnalysis() {
  const [mode, setMode] = useState<'cross' | 'regression'>('cross');
  const [clusterUsers, setClusterUsers] = useState<UserData[] | null>(null);
  const [xKey, setXKey] = useState<GroupKey>('department');
  const [yKey, setYKey] = useState<GroupKey>('none');

  const options: { key: GroupKey; label: string }[] = [
    { key: 'department', label: '部署' },
    { key: 'years', label: '勤続年数' },
    { key: 'gender', label: '性別' },
    { key: 'location', label: '拠点' },
    { key: 'none', label: 'なし' },
  ];

  const yOptions = options.filter((o) => o.key !== xKey);
  if (yKey === xKey) {
    setYKey(yOptions[0].key);
  }

  return (
    <div className="p-6 text-gray-700 space-y-6 max-w-full overflow-x-hidden">
      <h2 className="text-2xl font-semibold mb-4">集団分析</h2>

      {/* サブタブ */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'cross' ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-purple-50'
          }`}
          onClick={() => setMode('cross')}
        >
          セグメント分析
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'regression' ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-purple-50'
          }`}
          onClick={() => setMode('regression')}
        >
          因子分析
        </button>
      </div>

      {mode === 'cross' && (
        <>
          {/* 軸選択 */}
          <div className="flex gap-6 items-center mb-4">
            <label className="text-sm font-medium flex items-center gap-2">
              横軸
              <select
                className="border rounded p-1"
                value={xKey}
                onChange={(e) => setXKey(e.target.value as GroupKey)}
              >
                {options.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium flex items-center gap-2">
              縦軸
              <select
                className="border rounded p-1"
                value={yKey}
                onChange={(e) => setYKey(e.target.value as GroupKey)}
              >
                {options
                  .filter((o) => o.key !== xKey)
                  .map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <CrossStressTable xKey={xKey} yKey={yKey} onSelectCluster={(us) => setClusterUsers(us)} />
          {clusterUsers && clusterUsers.length > 0 && (
            <ClusterDetail users={clusterUsers} />
          )}
        </>
      )}

      {mode === 'regression' && <RegressionAnalysis />}
    </div>
  );
}
