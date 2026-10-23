import {
  FALLBACK_DETAIL_URL,
  FALLBACK_KURAL_URL,
  PRIMARY_DETAIL_URL,
  PRIMARY_KURAL_URL,
  THIRUKKURAL_DATA_REV,
} from './config.js';

/** Inclusive kural numbers shipped in thirukkural.json. */
export const KURAL_MIN = 1;
export const KURAL_MAX = 1330;

/** Civil date used as day zero for the kural-of-the-day cycle. */
export const EPOCH = '2024-01-01';

/** Keep this equal to package.json "version". The lint script checks it. */
export const VERSION = '0.1.0';

export {
  FALLBACK_DETAIL_URL,
  FALLBACK_KURAL_URL,
  PRIMARY_DETAIL_URL,
  PRIMARY_KURAL_URL,
  THIRUKKURAL_DATA_REV,
};

/** Includes the data pin so a new pin does not reuse an old browser cache. */
export const CACHE_KEY = `daily-kural-js:v1:${THIRUKKURAL_DATA_REV.slice(0, 12)}`;

export const DEFAULT_KURAL_URLS = [PRIMARY_KURAL_URL, FALLBACK_KURAL_URL];
export const DEFAULT_DETAIL_URLS = [PRIMARY_DETAIL_URL, FALLBACK_DETAIL_URL];

export const TAMIL_FONT_STACK = '"Noto Serif Tamil", "Noto Sans Tamil", "Latha", "Nirmala UI", "Tamil Sangam MN", "Lohit Tamil", serif';

export const LATIN_FONT_STACK = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';

export const GOOGLE_FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Noto+Serif+Tamil:wght@400;600;700&family=Noto+Sans+Tamil:wght@400;600;700&display=swap';

export const FILTER_KEYS = ['number', 'numbers', 'range', 'paal', 'iyal', 'chapter', 'exclude'];

export const COMMENTARY_META = [
  { id: 'mv', title: 'மு. வரதராசனார்', short: 'மு.வ', field: 'mv', lang: 'ta' },
  { id: 'sp', title: 'சாலமன் பாப்பையா', short: 'சாலமன் பாப்பையா', field: 'sp', lang: 'ta' },
  { id: 'mk', title: 'மு. கருணாநிதி', short: 'மு.க', field: 'mk', lang: 'ta' },
  { id: 'explanation', title: 'English explanation', short: 'Explanation', field: 'explanation', lang: 'en' },
];
