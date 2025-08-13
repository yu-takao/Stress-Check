"use client";

import { useState } from "react";
import ScoreDashboard from "./ScoreDashboard";
import GroupAnalysis from "./GroupAnalysis";
import RAGSettings from "./RAGSettings";
import { users } from "../../lib/data/users";

export default function AnalysisTabs() {
  const [tab, setTab] = useState<'individual' | 'group' | 'settings'>('individual');

  return (
    <div className="flex min-h-screen">
      {/* サイドメニュー */}
      <aside className="w-48 bg-gray-100 border-r px-4 py-6 space-y-2">
        <button
          className={`block w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
            tab === 'individual' ? 'bg-purple-600 text-white' : 'hover:bg-purple-50'
          }`}
          onClick={() => setTab('individual')}
        >
          個人分析
        </button>
        <button
          className={`block w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
            tab === 'group' ? 'bg-purple-600 text-white' : 'hover:bg-purple-50'
          }`}
          onClick={() => setTab('group')}
        >
          集団分析
        </button>
        <button
          className={`block w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
            tab === 'settings' ? 'bg-purple-600 text-white' : 'hover:bg-purple-50'
          }`}
          onClick={() => setTab('settings')}
        >
          設定
        </button>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 bg-gray-50 p-6 overflow-auto">
        {tab === 'individual' && <ScoreDashboard users={users} />}
        {tab === 'group' && <GroupAnalysis />}
        {tab === 'settings' && <RAGSettings />}
      </main>
    </div>
  );
}

