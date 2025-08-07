import { users } from "../lib/data/users";
import ScoreDashboard from "./components/ScoreDashboard";

export default function HomePage() {
  return (
    <main className="p-8 min-h-screen flex flex-col items-center justify-start">
      <h1 className="text-2xl font-bold mb-6">ストレスチェック結果ビューア</h1>
      
      {/* AWS Amplify 統合テスト */}
      <div className="mb-8 text-center">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            🎉 AWS Amplify Gen 2 連携完了！
          </h2>
          <p className="text-blue-700 mb-3">
            認証・データベース・APIが利用可能になりました
          </p>
          <a 
            href="/auth"
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            認証機能をテスト →
          </a>
        </div>
      </div>
      
      {/* 既存のダミーデータダッシュボード */}
      <div className="text-center mb-4">
        <h3 className="text-lg text-gray-600">現在表示中: ダミーデータ</h3>
        <p className="text-sm text-gray-500">（実際のAmplifyデータベースとの連携は次のステップ）</p>
      </div>
      
      <ScoreDashboard users={users} />
    </main>
  );
}
