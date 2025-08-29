"use client";

export default function UsageHelp() {
  return (
    <div className="p-6 text-gray-800 space-y-4">
      <h2 className="text-2xl font-semibold">このアプリの使い方</h2>

      <section className="space-y-2">
        <h3 className="text-lg font-medium">1. 個人分析</h3>
        <ul className="list-disc ml-6 space-y-1 text-sm">
          <li>画面上部のセレクトから対象ユーザーを選択します。</li>
          <li>各領域（A/B/C）の表とレーダーチャートで尺度ごとの状況を確認します。</li>
          <li>下部の「AIストレス分析を開始」を押すと、ストレスチェック結果に基づいた分析コメントが表示されます。</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-medium">2. 集団分析</h3>
        <ul className="list-disc ml-6 space-y-1 text-sm">
          <li>「集団分析」タブで「セグメント分析」を開き、横軸/縦軸（部署・勤続年数・性別・拠点など）を選択します。</li>
          <li>表示されるクロス表は、各セルにおけるストレス値の平均を色の濃淡で示します（赤いほど高い）。</li>
          <li>気になるセルをクリックすると、下に「詳細」セクションが表示されます。</li>
          <li>詳細セクションでは、A/B/C 各領域の尺度ごとの表とレーダーチャートで傾向を確認できます。</li>
          <li>下部の「AIストレス分析を開始」を押すと、選択した条件に基づいた分析コメントが表示されます。</li>
          <li>「因子分析」では、データ全体を対象に、ストレス（B領域合計）と統計的に関連の強い尺度を上位から表示します。</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-medium">3. 設定</h3>
        <ul className="list-disc ml-6 space-y-1 text-sm">
          <li>出力言語の選択（日本語/英語/中国語（簡体/繁体）/韓国語）。</li>
          <li>追加プロンプトの設定（個人分析/集団分析ごと）。AIへの指示を追記できます。</li>
        </ul>
      </section>

      {/* ヒントは不要のため削除 */}
    </div>
  );
}


