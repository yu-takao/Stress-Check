"use client";

import { useState, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';

// Amplify設定を確実に行う
if (typeof window !== 'undefined') {
  Amplify.configure(outputs);
}

const client = generateClient<Schema>({
  authMode: 'apiKey', // APIキー認証を明示的に使用
});

interface StressScores {
  scoreA: number;
  scoreB: number;
  scoreC: number;
  total: number;
  highStress: boolean;
}

interface AICommentResponse {
  success: boolean;
  aiComment?: string;
  prompt?: string;
  analysisDetails?: {
    workStressLevel: string;
    physicalStressLevel: string;
    supportLevel: string;
    overallRisk: string;
    priorityAreas: string[];
  };
  error?: string;
}

interface Props {
  scores: StressScores;
  subscaleScores: Record<string, { label: string; reverse: boolean; raw: number; eval: number }>;
  userName?: string;
  department?: string;
  age?: number;
  yearsOfService?: number;
  gender?: 'male' | 'female';
  isCluster?: boolean;
  extraPromptOverride?: string;
}


export default function AICommentGenerator({ scores, subscaleScores, userName, department, age, yearsOfService, gender, isCluster, extraPromptOverride }: Props) {
  const [aiComment, setAiComment] = useState<string>(''); // full text
  const [streamed, setStreamed] = useState<string>('');   // progressively shown text
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [analysisDetails, setAnalysisDetails] = useState<any>(null);
  const [promptText, setPromptText] = useState<string>('');
  const [language, setLanguage] = useState<string>(() => {
    if (typeof window === 'undefined') return 'ja';
    return localStorage.getItem('ai_output_language') || 'ja';
  });
  const [extraPrompt, setExtraPrompt] = useState<string>('');

  // 初期の追加プロンプトを読み込み（個人/集団でキーを切替、overrideがあれば優先）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof extraPromptOverride === 'string') {
      setExtraPrompt(extraPromptOverride);
      return;
    }
    const key = isCluster ? 'ai_extra_prompt_cluster' : 'ai_extra_prompt_individual';
    setExtraPrompt(localStorage.getItem(key) || '');
  }, [isCluster, extraPromptOverride]);

  // 設定タブからの変更を反映（言語・追記プロンプト）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onLang = (e: any) => {
      const v = e?.detail || localStorage.getItem('ai_output_language') || 'ja';
      setLanguage(v);
    };
    const onExtra = (e: any) => {
      const scope = e?.detail?.scope as 'individual' | 'cluster' | undefined;
      if ((isCluster && scope === 'cluster') || (!isCluster && scope === 'individual')) {
        setExtraPrompt(e?.detail?.text || '');
      }
    };
    window.addEventListener('ai-language-changed', onLang);
    window.addEventListener('ai-extra-prompt-changed', onExtra);
    return () => {
      window.removeEventListener('ai-language-changed', onLang);
      window.removeEventListener('ai-extra-prompt-changed', onExtra);
    };
  }, [isCluster]);

  const generateComment = async () => {
    setIsLoading(true);
    setError('');
    // reset streaming state
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    setStreamed('');

    try {
      console.log('Starting AI comment generation with params:', {
        scoreA: scores.scoreA,
        scoreB: scores.scoreB,
        scoreC: scores.scoreC,
        total: scores.total,
        highStress: scores.highStress,
        subscaleScores,
        userName,
        department,
        age,
        yearsOfService,
        gender,
        isCluster,
      });

      const result = await client.queries.generateAiComment({
        scoreA: scores.scoreA,
        scoreB: scores.scoreB,
        scoreC: scores.scoreC,
        total: scores.total,
        highStress: scores.highStress,
        userName,
        department,
        age,
        yearsOfService,
        gender,
        isCluster,
        language,
        extraPrompt,
        subscaleScores: JSON.stringify(subscaleScores),
            } as any);

      console.log('GraphQL query result:', result);

      if (result.data) {
        console.log('Raw response data:', result.data);
        let parsed = JSON.parse(result.data as string);
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        const data: AICommentResponse = parsed;
        console.log('Parsed response data:', data);
        
        if (data.success && data.aiComment) {
          // start streaming display
          const full = data.aiComment;
          setAiComment(full);
          setStreamed('');
          if (streamTimerRef.current) {
            clearInterval(streamTimerRef.current);
            streamTimerRef.current = null;
          }
          // reveal by chunks (word-based) to feel like streaming
          const tokens = full.split(/(\s+)/); // keep spaces
          let idx = 0;
          streamTimerRef.current = setInterval(() => {
            idx += 1;
            setStreamed(tokens.slice(0, idx).join(''));
            if (idx >= tokens.length && streamTimerRef.current) {
              clearInterval(streamTimerRef.current);
              streamTimerRef.current = null;
            }
          }, 30); // ~30ms per token
          setPromptText(data.prompt || '');
          setAnalysisDetails(data.analysisDetails);
        } else {
          throw new Error(data.error || 'AI コメントの生成に失敗しました');
        }
      } else if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        throw new Error(`GraphQL エラー: ${result.errors.map(e => e.message).join(', ')}`);
      } else {
        console.error('No data and no errors in result:', result);
        throw new Error('AIコメントの生成に失敗しました');
      }
    } catch (err) {
      console.error('AI comment generation error details:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(`AIコメント生成でエラー: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200 w-full max-w-full overflow-x-hidden">

      


      {/* 生成ボタン */}
      {!aiComment && (
        <button
          onClick={generateComment}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              AI分析中...
            </div>
          ) : (
            '🧠 AI ストレス分析を開始'
          )}
        </button>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <div>
              <p className="text-red-700 font-medium">エラーが発生しました</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={generateComment}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            再試行
          </button>
        </div>
      )}

      {/* プロンプト表示（開発用） */}
      {promptText && (
        <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs whitespace-pre-wrap break-words max-w-full overflow-x-auto">
          <details>
            <summary className="cursor-pointer font-semibold text-gray-700">📝 送信プロンプト (クリックで表示)</summary>
            <pre className="mt-2 text-[10px] leading-snug whitespace-pre-wrap break-words max-w-full overflow-x-auto">{promptText}</pre>
          </details>
        </div>
      )}

      {/* AI コメント表示 */}
      {aiComment && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-purple-300 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💬</span>
              <h4 className="font-medium text-purple-800">AI からのアドバイス</h4>
            </div>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{streamed || aiComment}</p>
            {aiComment && streamed !== aiComment && (
              <div className="mt-2">
                <button
                  className="text-xs text-purple-600 hover:text-purple-800 underline"
                  onClick={() => {
                    if (streamTimerRef.current) {
                      clearInterval(streamTimerRef.current);
                      streamTimerRef.current = null;
                    }
                    setStreamed(aiComment);
                  }}
                >
                  すぐに全文を表示
                </button>
              </div>
            )}
          </div>

          {/* 分析詳細 */}
          {analysisDetails && (
            <div className="bg-white rounded-lg p-4 border border-purple-300 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📊</span>
                <h4 className="font-medium text-purple-800">詳細分析結果</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">仕事ストレス:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    analysisDetails.workStressLevel === 'high' ? 'bg-red-100 text-red-700' :
                    analysisDetails.workStressLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {analysisDetails.workStressLevel}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">心身反応:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    analysisDetails.physicalStressLevel === 'high' ? 'bg-red-100 text-red-700' :
                    analysisDetails.physicalStressLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {analysisDetails.physicalStressLevel}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">サポート:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    analysisDetails.supportLevel === 'high' ? 'bg-green-100 text-green-700' :
                    analysisDetails.supportLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {analysisDetails.supportLevel}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">総合リスク:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    analysisDetails.overallRisk === 'high' ? 'bg-red-100 text-red-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {analysisDetails.overallRisk}
                  </span>
                </div>
              </div>
              
              {analysisDetails.priorityAreas?.length > 0 && (
                <div className="mt-3">
                  <span className="text-gray-600 text-sm">優先改善領域:</span>
                  <div className="mt-1">
                    {analysisDetails.priorityAreas.map((area: string, index: number) => (
                      <span
                        key={index}
                        className="inline-block bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs mr-2 mb-1"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 再生成ボタン */}
          <button
            onClick={() => {
              setAiComment('');
              setAnalysisDetails(null);
              if (streamTimerRef.current) {
                clearInterval(streamTimerRef.current);
                streamTimerRef.current = null;
              }
              setStreamed('');
            }}
            className="text-purple-600 hover:text-purple-800 text-sm underline"
          >
            🔄 新しいアドバイスを生成
          </button>
        </div>
      )}
    </div>
  );
}