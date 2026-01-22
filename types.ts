
export enum Dialect {
  CANTONESE_GZ = '粤语 (广州)',
  CANTONESE_HK = '粤语 (香港)',
  TEOCHEW = '潮汕话 (潮汕)',
  SHANGHAINESE = '吴语 (上海)',
  SUZHOUNESE = '吴语 (苏州)',
  HOKKIEN = '闽南语 (泉漳)',
  SICHUANESE_CD = '四川话 (成都)',
  SICHUANESE_ZG = '四川话 (自贡)',
  CHONGQING = '重庆话',
  BEIJING = '北京话',
  NORTHEASTERN = '东北话',
  HAKKA = '客家语 (梅州)',
  HUNANESE = '湘语 (长沙)',
  GAN = '赣语 (南昌)',
  SHANDONG = '胶辽官话 (青岛)',
  SHAANXI = '秦腔/关中话 (西安)'
}

export const DIALECT_CATEGORIES = {
  '巴蜀川渝': [Dialect.SICHUANESE_CD, Dialect.CHONGQING, Dialect.SICHUANESE_ZG],
  '岭南闽江': [Dialect.CANTONESE_GZ, Dialect.CANTONESE_HK, Dialect.TEOCHEW, Dialect.HOKKIEN, Dialect.HAKKA],
  '江浙沪湘赣': [Dialect.SHANGHAINESE, Dialect.SUZHOUNESE, Dialect.HUNANESE, Dialect.GAN],
  '北方中原': [Dialect.BEIJING, Dialect.NORTHEASTERN, Dialect.SHANDONG, Dialect.SHAANXI]
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
