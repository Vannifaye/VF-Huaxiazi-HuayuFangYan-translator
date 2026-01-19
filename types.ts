
export enum Dialect {
  CANTONESE = '粤语 (广州/香港)',
  TEOCHEW = '潮汕话 (潮州/汕头)',
  SHANGHAINESE = '吴语 (上海)',
  SUZHOUNESE = '吴语 (苏州)',
  HOKKIEN = '闽南语 (泉漳/台湾)',
  SICHUANESE = '西南官话 (四川/重庆)',
  BEIJING = '北京话',
  NORTHEASTERN = '东北话 (黑吉辽)',
  HAKKA = '客家语 (梅州/赣南)',
  HUNANESE = '湘语 (长沙)',
  GAN = '赣语 (南昌)',
  JIN = '晋语 (太原)',
  HAINANESE = '海南话',
  FUZHOU = '闽东语 (福州)',
  SHANDONG = '胶辽官话 (山东)'
}

export const DIALECT_CATEGORIES = {
  '岭南闽江': [Dialect.CANTONESE, Dialect.TEOCHEW, Dialect.HOKKIEN, Dialect.HAINANESE, Dialect.FUZHOU, Dialect.HAKKA],
  '吴越湘赣': [Dialect.SHANGHAINESE, Dialect.SUZHOUNESE, Dialect.HUNANESE, Dialect.GAN],
  '燕赵秦陇': [Dialect.BEIJING, Dialect.NORTHEASTERN, Dialect.SICHUANESE, Dialect.JIN, Dialect.SHANDONG]
};

export enum TranslationMode {
  TO_DIALECT = 'TO_DIALECT',
  TO_MANDARIN = 'TO_MANDARIN'
}

export interface TranslationResult {
  translatedText: string;
  phonetic: string;
  meaning: string;
  dialectName: string;
  originalText?: string;
}

export interface HistoryItem extends TranslationResult {
  id: string;
  originalText: string;
  timestamp: number;
  mode: TranslationMode;
}

export interface AtlasItem {
  name: string;
  region: string;
  description: string;
  classicPhrase: string;
  classicMeaning: string;
  features: string[];
  history: string;
}

export interface UserProfile {
  nickname: string;
  hometown: string;
  bio: string;
  joinedDate: string;
  dialectPreference: string;
  identityVerified: boolean;
  avatar: string;
}
