export interface SubScale {
  id: string;
  label: string;
  items: number[];
  domain: 'A' | 'B' | 'C';
  reverse?: boolean;
}

export const SUBSCALES: SubScale[] = [
  // A領域 9尺度
  { id: 'A1', label: '心理的仕事量(量)', domain: 'A', items: [1, 2, 3] },
  { id: 'A2', label: '心理的仕事量(質)', domain: 'A', items: [4, 5, 6] },
  { id: 'A3', label: '身体的負担度', domain: 'A', items: [7] },
  { id: 'A4', label: '対人関係ストレス', domain: 'A', items: [12, 13, 14] },
  { id: 'A5', label: '職場環境ストレス', domain: 'A', items: [15] },
  { id: 'A6', label: '仕事のコントロール度★', domain: 'A', items: [8, 9, 10], reverse: true },
  { id: 'A7', label: '技能活用度★', domain: 'A', items: [11], reverse: true },
  { id: 'A8', label: '仕事適性度★', domain: 'A', items: [16], reverse: true },
  { id: 'A9', label: '働きがい★', domain: 'A', items: [17], reverse: true },

  // B領域
  { id: 'B1', label: '活気★', domain: 'B', items: [18, 19, 20], reverse: true },
  { id: 'B2', label: 'イライラ感', domain: 'B', items: [21, 22, 23] },
  { id: 'B3', label: '疲労感', domain: 'B', items: [24, 25, 26] },
  { id: 'B4', label: '不安感', domain: 'B', items: [27, 28, 29] },
  { id: 'B5', label: '抑うつ感', domain: 'B', items: [30, 31, 32, 33, 34, 35] },
  { id: 'B6', label: '身体愁訴', domain: 'B', items: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46] },

  // C領域
  { id: 'C1', label: '上司からのサポート★', domain: 'C', items: [47, 48, 49], reverse: true },
  { id: 'C2', label: '同僚からのサポート★', domain: 'C', items: [50, 51, 52, 53], reverse: true },
  { id: 'C3', label: '家族・友人サポート★', domain: 'C', items: [54, 55], reverse: true },
  { id: 'C4', label: '仕事と生活の満足度★', domain: 'C', items: [56, 57], reverse: true },
];