export type GroupKey = 'department' | 'years' | 'gender' | 'location' | 'none';

export interface CategoryDef {
  key: string;
  label: string;
  match: (user: any) => boolean;
}

export function getCategories(key: GroupKey): CategoryDef[] {
  switch (key) {

    case 'department':
      return [
        { key: '営業部', label: '営業部', match: (u) => u.department === '営業部' },
        { key: '技術部', label: '技術部', match: (u) => u.department === '技術部' },
      ];
    case 'location':
      return [
        { key: '東京', label: '東京', match: (u) => u.location === '東京' },
        { key: '新潟', label: '新潟', match: (u) => u.location === '新潟' },
      ];
    case 'gender':
      return [
        { key: 'male', label: '男性', match: (u) => u.gender === 'male' },
        { key: 'female', label: '女性', match: (u) => u.gender === 'female' },
      ];
    case 'none':
      return [
        { key: 'all', label: '全体', match: () => true },
      ];

    case 'years':
      return [
        { key: '1', label: '～1年', match: (u) => u.yearsOfService === 1 },
        { key: '2-5', label: '2～5年', match: (u) => u.yearsOfService >= 2 && u.yearsOfService <= 5 },
        { key: '6+', label: '6年～', match: (u) => u.yearsOfService >= 6 },
      ];
  }
}

