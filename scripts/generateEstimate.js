/*
  見積書自動生成スクリプト
  - ルートにある既存の見積テンプレート「きらめき様システム開発見積り.xlsx」を読み取り、
    先頭シートのヘッダー構成を踏襲して新しい見積ファイルを生成します。
  - 生成先: ルート直下「見積_ストレスチェック本格開発.xlsx」
*/

const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const TEMPLATE_FILENAME = 'きらめき様システム開発見積り.xlsx';
const OUTPUT_FILENAME = '見積_ストレスチェック本格開発.xlsx';

function readTemplateHeaders(templatePath) {
  if (!fs.existsSync(templatePath)) return null;
  try {
    const wb = XLSX.readFile(templatePath);
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
    if (!rows || rows.length === 0) return null;

    // ヘッダー行を推定: 最初の非空行を採用
    const headerRow = rows.find((r) => Array.isArray(r) && r.some((c) => !!c));
    if (!headerRow) return null;
    return headerRow.map((h) => (h || '').toString().trim());
  } catch (e) {
    return null;
  }
}

function getDefaultHeaders() {
  return ['項目', '内容', '数量', '単位', '単価', '金額', '備考'];
}

function yen(amount) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return amount;
  return amount;
}

function buildEstimateRows(headers) {
  // 想定単価と工数（例）
  const unitDay = 80000; // 円/人日（必要に応じて調整）

  const items = [
    { item: '要件定義', detail: '業務要件整理、画面・機能一覧、非機能要件', qty: 10, unit: '人日' },
    { item: '基本設計', detail: '画面設計、API仕様書、データモデル設計', qty: 10, unit: '人日' },
    { item: '詳細設計', detail: '採点ロジック・可視化・AI連携の詳細仕様', qty: 12, unit: '人日' },
    { item: 'フロントエンド実装', detail: 'Next.js + TypeScript + Tailwind + shadcn/ui', qty: 25, unit: '人日' },
    { item: '可視化実装', detail: 'レーダー/棒/経年グラフ、比較・ダッシュボード', qty: 8, unit: '人日' },
    { item: '採点ロジック実装', detail: '57項目採点、逆転処理、判定ロジック、テスト', qty: 8, unit: '人日' },
    { item: 'バックエンド(API)実装', detail: 'Amplify Gen2, GraphQL/REST, DynamoDB', qty: 18, unit: '人日' },
    { item: '認証・権限', detail: 'Amplify Auth、ロール設計、アクセス制御', qty: 6, unit: '人日' },
    { item: 'AI連携', detail: 'Bedrock(Claude)プロンプト設計・実装・RAG', qty: 12, unit: '人日' },
    { item: 'セキュリティ対応', detail: '個人情報保護、匿名化、WAF、暗号化', qty: 6, unit: '人日' },
    { item: 'テスト', detail: '単体/結合/E2E、自動化、カバレッジ>=80%', qty: 12, unit: '人日' },
    { item: 'ドキュメント', detail: 'README、運用設計、API/スキーマ、手順書', qty: 6, unit: '人日' },
    { item: 'CI/CD・デプロイ', detail: 'Amplify Console、自動デプロイ、環境分離', qty: 5, unit: '人日' },
    { item: 'チューニング', detail: 'パフォーマンス最適化、バンドル、キャッシュ', qty: 5, unit: '人日' },
    { item: '運用監視', detail: 'CloudWatch/アラート設計、ログ可視化', qty: 4, unit: '人日' },
    { item: 'PM/進行管理', detail: 'スプリント運営、課題管理、レビュー', qty: 12, unit: '人日' },
    { item: '予備工数', detail: '仕様変更・リスクバッファ(約10%)', qty: 14, unit: '人日' },
  ];

  const rows = [];
  let subtotal = 0;

  for (const it of items) {
    const amount = it.qty * unitDay;
    subtotal += amount;

    const row = {};
    for (const h of headers) {
      const key = h;
      switch (key) {
        case '項目':
          row[key] = it.item;
          break;
        case '内容':
          row[key] = it.detail;
          break;
        case '数量':
          row[key] = it.qty;
          break;
        case '単位':
          row[key] = it.unit;
          break;
        case '単価':
          row[key] = yen(unitDay);
          break;
        case '金額':
          row[key] = yen(amount);
          break;
        case '備考':
          row[key] = '';
          break;
        default:
          // 未知ヘッダーは空
          row[key] = '';
      }
    }
    rows.push(row);
  }

  // 小計・消費税・合計（ヘッダーに合う範囲で末尾に追記）
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  const summaryRows = [
    { label: '小計', value: subtotal },
    { label: '消費税(10%)', value: tax },
    { label: '合計', value: total },
  ];

  for (const s of summaryRows) {
    const row = {};
    for (const h of headers) {
      if (h === '項目') row[h] = s.label;
      else if (h === '金額') row[h] = yen(s.value);
      else row[h] = '';
    }
    rows.push(row);
  }

  return rows;
}

function main() {
  const root = process.cwd();
  const templatePath = path.join(root, TEMPLATE_FILENAME);
  const outputPath = path.join(root, OUTPUT_FILENAME);

  const headers = readTemplateHeaders(templatePath) || getDefaultHeaders();

  const dataRows = buildEstimateRows(headers);

  const wb = XLSX.utils.book_new();
  const aoa = [headers, ...dataRows.map((r) => headers.map((h) => r[h]))];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // ざっくり列幅設定
  const colWidths = headers.map((h) => {
    if (h === '内容') return { wch: 40 };
    if (h === '項目') return { wch: 20 };
    if (h === '備考') return { wch: 25 };
    return { wch: 12 };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, '見積');
  XLSX.writeFile(wb, outputPath);

  // コンソール出力
  console.log(`Generated: ${OUTPUT_FILENAME}`);
}

main();


