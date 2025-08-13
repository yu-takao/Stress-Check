import { promises as fs } from 'fs';
import path from 'path';

const DUMMY_DIR = path.join(__dirname, '..', 'dummy_data');

interface UserTemplate {
  location: '東京' | '新潟';
  id: string;
  name: string;
  department: '営業部' | '技術部';
  age: number;
  yearsOfService: number;
  responses: Record<string, number>;
  submittedAt: string;
}

// 質問項目の逆転判定 (C 領域 47-55)
const isReversed = (q: number) => q >= 47 && q <= 55;

// ストレスレベル 0 (低) – 1 (高)
function generateResponses(stress: number): Record<string, number> {
  const responses: Record<string, number> = {};
  for (let i = 1; i <= 57; i += 1) {
    // 正規化ストレス値を 1〜4 へマッピング
    // 高ストレスなら通常項目は低スコア(1寄り)、逆転項目は高スコア(4寄り)
    const base = 1 + 3 * (1 - stress); // 低ストレス時 4, 高ストレス時 1
    const valueNormal = Math.max(1, Math.min(4, Math.round(base + (Math.random() - 0.5))));
    const value = isReversed(i) ? 5 - valueNormal : valueNormal;
    responses[i.toString()] = value;
  }
  return responses;
}

function randomName(idx: number): string {
  const family = ['山田', '佐藤', '鈴木', '高橋', '伊藤', '渡辺', '中村', '小林', '斎藤', '加藤'];
  const given = ['太郎', '花子', '健太', '美香', '智子', '雄一', 'あゆみ', '直樹', '光', '彩'];
  return `${family[idx % family.length]}${given[idx % given.length]}`;
}

async function ensureDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
}

async function main() {
  await ensureDir(DUMMY_DIR);

  const users: UserTemplate[] = [];
  const total = 200;
  for (let i = 1; i <= total; i += 1) {
    if (i === 1) continue; // user_001 既存
    const id = `user_${String(i).padStart(3, '0')}`;
    const department = i % 2 === 0 ? '営業部' : '技術部';
    const location = Math.random() < 0.6 ? '東京' : '新潟';

    // 勤続年数: 1-3 年多めの分布
    // 勤続年数: 1 年データを増やすために 30% の確率で 1 年固定
    let yearsOfService: number;
    const r = Math.random();
    if (r < 0.3) {
      yearsOfService = 1; // 30%
    } else if (r < 0.65) {
      // 35% → 2〜5 年を均等に
      yearsOfService = 2 + Math.floor(Math.random() * 4); // 2,3,4,5
    } else {
      // 35% → 6〜20 年を均等に
      yearsOfService = 6 + Math.floor(Math.random() * 15); // 6..20
    }

    const age = 22 + yearsOfService + Math.floor(Math.random() * 20); // 22~40+ yrs

    // ストレス: 営業部 +0.2, 年数少ないほど +0.3 (1yr) -> +0.0 (20yr)
    const stressBase = department === '営業部' ? 0.6 : 0.4; // base
    const stress = Math.min(1, stressBase + (3 - Math.min(yearsOfService, 3)) * 0.1);

    const responses = generateResponses(stress);
    const user: UserTemplate = {
      id,
      name: randomName(i),
      department,
      location,
      age,
      yearsOfService,
      responses,
      submittedAt: new Date().toISOString(),
    };
    users.push(user);
    const filePath = path.join(DUMMY_DIR, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(user, null, 2), 'utf-8');
  }
  console.log(`Generated ${users.length} users in dummy_data/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

