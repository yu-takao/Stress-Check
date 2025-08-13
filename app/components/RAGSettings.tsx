"use client";

import React, { useEffect, useState } from "react";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
//

if (typeof window !== "undefined") {
  Amplify.configure(outputs);
}

const client = generateClient<Schema>({ authMode: "apiKey" });

export default function RAGSettings() {
  const [prefix] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // 保存済み設定の読み込み
  useEffect(() => {
    // プレフィックス設定は廃止（常にバケット直下）
  }, []);

  // 設定保存は不要（KB接続は固定）

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
  }

  async function handleUploadSubmit() {
    if (!file) return;
    try {
      setUploading(true);
      if (file.type !== "application/pdf") {
        setStatus("PDFファイルのみアップロードできます");
        setTimeout(() => setStatus(null), 2000);
        setUploading(false);
        return;
      }
      // PDFを安全にBase64化（大きいファイルでも安定）
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
        reader.onload = () => {
          const res = String(reader.result || '');
          const comma = res.indexOf(',');
          resolve(comma >= 0 ? res.slice(comma + 1) : res);
        };
        reader.readAsDataURL(file);
      });

      const result = await client.mutations.uploadKnowledge({
        fileName: file.name,
        contentBase64: base64,
        // prefixは送らない（バケット直下）
      } as any, { authMode: 'apiKey' });

      // LambdaからはJSON文字列（場合により二重文字列）になるため堅牢にパース
      const payload = (() => {
        try {
          const first = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
          return typeof first === 'string' ? JSON.parse(first) : first;
        } catch {
          return result.data as unknown;
        }
      })() as { success?: boolean; key?: string; error?: string } | unknown;

      if ((payload as any)?.success) {
        setStatus(`アップロード完了: ${file.name} -> ${(payload as any).key}`);
        // 一覧更新を促す（画面リセット不要）
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('kb-docs-reload'));
        }
      } else {
        setStatus(`アップロード失敗: ${(payload as any)?.error || '不明なエラー'}`);
      }
      setTimeout(() => setStatus(null), 2500);
    } catch (e) {
      setStatus("アップロードに失敗しました");
    }
    finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-semibold mb-6">設定</h2>
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <section className="space-y-3">
          <h3 className="text-lg font-medium">RAG（Knowledge Bases for Bedrock）</h3>
          <p className="text-sm text-gray-600">PDFをアップロードすると、AIの参考資料として利用されます。</p>

          {/* 設定保存は不要（KB接続は固定） */}

          <div className="pt-2">
            <label className="block text-sm mb-1">参考PDFのアップロード</label>
            <div className="flex items-center gap-2">
              <input type="file" accept="application/pdf" onChange={handleUpload} disabled={uploading} />
              <button
                onClick={handleUploadSubmit}
                disabled={uploading || !file}
                className={`px-3 py-2 rounded text-white ${uploading ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600'}`}
                aria-busy={uploading}
              >
                {uploading ? 'アップロード中…' : 'アップロード'}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <DocsList prefix="" />
          </div>
        </section>

        {status && <p className="text-sm text-gray-700">{status}</p>}
      </div>
    </div>
  );
}

function DocsList({ prefix }: { prefix: string }) {
  const client = generateClient<Schema>({ authMode: 'apiKey' });
  const [items, setItems] = React.useState<Array<{ key?: string; size?: number; lastModified?: string }>>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [deletingKey, setDeletingKey] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await client.queries.listKnowledgeDocs({ prefix } as any, { authMode: 'apiKey' });
      // 二重にJSON文字列化されるケースへ対応
      const first = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      const payload = typeof first === 'string' ? JSON.parse(first) : first;
      if (payload?.success) {
        setItems(payload.items || []);
        // 空配列でもエラーは表示しない（UIで「ファイルがありません」を表示）
      } else {
        setError(payload?.error || '一覧取得に失敗しました');
      }
    } catch (e) {
      setError('一覧取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    const onReload = () => load();
    window.addEventListener('kb-docs-reload', onReload);
    return () => window.removeEventListener('kb-docs-reload', onReload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h4 className="font-medium">アップロード済み文書一覧</h4>
        <button onClick={load} className="text-sm px-3 py-1 bg-gray-100 rounded border">再読み込み</button>
      </div>
      {loading && <p className="text-sm text-gray-500 mt-2">読み込み中...</p>}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <ul className="mt-2 space-y-1 max-h-60 overflow-auto border rounded p-2 bg-white">
        {items.map((it) => (
          <li key={it.key} className="text-sm flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <span className="truncate max-w-[32rem]">{it.key}</span>
              <span className="text-gray-500 text-xs ml-2">{(it.size ?? 0).toLocaleString()} bytes</span>
            </div>
            <button
              className={`text-xs px-2 py-1 rounded border ${deletingKey===it.key ? 'bg-red-300 text-white' : 'bg-white text-red-600'}`}
              onClick={async () => {
                if (!it.key || deletingKey) return;
                setDeletingKey(it.key);
                try {
                  const res = await client.mutations.deleteKnowledgeDoc({ key: it.key } as any, { authMode: 'apiKey' });
                  const first = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
                  const payload = typeof first === 'string' ? JSON.parse(first) : first;
                  if (payload?.success) {
                    setItems((prev) => prev.filter((x) => x.key !== it.key));
                  } else {
                    setError(payload?.error || '削除に失敗しました');
                  }
                } catch {
                  setError('削除に失敗しました');
                } finally {
                  setDeletingKey(null);
                }
              }}
              disabled={!!deletingKey}
            >
              {deletingKey===it.key ? '削除中…' : '削除'}
            </button>
          </li>
        ))}
        {!loading && items.length === 0 && <li className="text-sm text-gray-500">ファイルがありません</li>}
      </ul>
    </div>
  );
}


