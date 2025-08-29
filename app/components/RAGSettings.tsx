"use client";

import React, { useEffect, useState } from "react";

export default function RAGSettings() {
  const [language, setLanguage] = useState<string>(() => {
    if (typeof window === 'undefined') return 'ja';
    return localStorage.getItem('ai_output_language') || 'ja';
  });
  const [extraIndividual, setExtraIndividual] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('ai_extra_prompt_individual') || '';
  });
  const [extraCluster, setExtraCluster] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('ai_extra_prompt_cluster') || '';
  });

  // 保存済み設定の読み込み
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_output_language');
      if (saved) setLanguage(saved);
      setExtraIndividual(localStorage.getItem('ai_extra_prompt_individual') || '');
      setExtraCluster(localStorage.getItem('ai_extra_prompt_cluster') || '');
    }
  }, []);

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-semibold mb-6">設定</h2>
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* RAG機能は削除されました */}

        <section className="space-y-3">
          <h3 className="text-lg font-medium">AI出力言語</h3>
          <p className="text-sm text-gray-600">AIコメントの出力言語を選択します。</p>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">言語</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={language}
              onChange={(e) => {
                const v = e.target.value;
                setLanguage(v);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('ai_output_language', v);
                  window.dispatchEvent(new CustomEvent('ai-language-changed', { detail: v }));
                }
              }}
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
              <option value="zh-CN">简体中文</option>
              <option value="zh-TW">繁體中文</option>
              <option value="ko">한국어</option>
            </select>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-medium">AIプロンプト設定</h3>
          <p className="text-sm text-gray-600">生成に使うベースプロンプトは自動生成されます。下の追記欄に入力すると、個人分析/集団分析ごとにプロンプト末尾へ付与されます。</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium">個人分析 追記プロンプト</label>
              <textarea
                className="w-full border rounded p-2 text-sm min-h-28"
                placeholder="例: 専門用語は避け、5行以内で具体例を1つ含めてください。"
                value={extraIndividual}
                onChange={(e) => {
                  setExtraIndividual(e.target.value);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('ai_extra_prompt_individual', e.target.value);
                    window.dispatchEvent(new CustomEvent('ai-extra-prompt-changed', { detail: { scope: 'individual', text: e.target.value } }));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">集団分析 追記プロンプト</label>
              <textarea
                className="w-full border rounded p-2 text-sm min-h-28"
                placeholder="例: 組織改善の観点で構造的要因を明確にし、エビデンスを優先してください。"
                value={extraCluster}
                onChange={(e) => {
                  setExtraCluster(e.target.value);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('ai_extra_prompt_cluster', e.target.value);
                    window.dispatchEvent(new CustomEvent('ai-extra-prompt-changed', { detail: { scope: 'cluster', text: e.target.value } }));
                  }
                }}
              />
            </div>
          </div>
          <div className="text-xs text-gray-500">保存先: localStorage（ブラウザごと）。</div>
        </section>
      </div>
    </div>
  );
}


