import user001 from "../../dummy_data/user_001.json";
import user002 from "../../dummy_data/user_002.json";
import user003 from "../../dummy_data/user_003.json";
import user004 from "../../dummy_data/user_004.json";
import user005 from "../../dummy_data/user_005.json";
import user006 from "../../dummy_data/user_006.json";
import user007 from "../../dummy_data/user_007.json";
import user008 from "../../dummy_data/user_008.json";

export interface UserData {
  id: string;
  name: string;
  department: string;
  age: number;
  gender: 'male' | 'female';
  responses: Record<string, number>;
}

export const users: UserData[] = [
  { ...user001, gender: 'male' },
  { ...user002, gender: 'female' },
  { ...user003, gender: 'male' },
  { ...user004, gender: 'female' },
  { ...user005, gender: 'male' },
  { ...user006, gender: 'female' },
  { ...user007, gender: 'male' },
  { ...user008, gender: 'female' },
];
