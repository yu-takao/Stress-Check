import { promises as fs } from 'fs';
import path from 'path';
import { calculateScore } from '../lib/utils/calculateScore';
import { calculateSubscaleScores } from '../lib/utils/calculateSubscaleScores';
import { isHighStress } from '../lib/utils/evaluateHighStress';
import { users as dummyType } from '../lib/data/users';

interface UserDataRaw {
  id: string;
  name: string;
  department: string;
  age: number;
  yearsOfService?: number;
  responses: Record<string, number>;
  submittedAt: string;
  [key: string]: any;
}

const DUMMY_DIR = path.join(__dirname, '..', 'dummy_data');
const OUTPUT_DIR = path.join(__dirname, '..', 'generated_data');

async function ensureDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // ignore
  }
}

async function processFile(file: string) {
  const fullPath = path.join(DUMMY_DIR, file);
  const content = await fs.readFile(fullPath, 'utf-8');
  const data = JSON.parse(content) as UserDataRaw;

  const domainScores = calculateScore(data.responses);
  const highStress = isHighStress(domainScores);
  const subscaleScores = calculateSubscaleScores(data.responses, 'male'); // 性別情報が無い場合は仮に male

  const enriched = {
    ...data,
    domainScores,
    highStress,
    subscaleScores,
  };

  const outPath = path.join(OUTPUT_DIR, file);
  await fs.writeFile(outPath, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log(`Generated: ${outPath}`);
}

async function main() {
  await ensureDir(OUTPUT_DIR);
  const files = await fs.readdir(DUMMY_DIR);
  const targets = files.filter((f) => f.endsWith('.json'));

  for (const file of targets) {
    await processFile(file);
  }
  console.log('All files processed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

