export type CategoryQuery = number | string;

export interface Filter {
  /** A single kural number, 1 through 1330. */
  number?: number;
  /** Several kural numbers. Combined with AND against the other keys. */
  numbers?: number[];
  /** Inclusive start and end. */
  range?: [number, number];
  /** பால். Tamil name, English translation, transliteration, number 1–3, or an OR-list. */
  paal?: CategoryQuery | CategoryQuery[];
  /** இயல். Same matching rules as paal. */
  iyal?: CategoryQuery | CategoryQuery[];
  /** அதிகாரம். Same matching rules as paal. */
  chapter?: CategoryQuery | CategoryQuery[];
  /** Kural numbers to leave out. */
  exclude?: number[];
}

export interface Category {
  name: string;
  transliteration: string;
  translation: string;
  number: number;
  count: number;
}

export interface Iyal extends Category {
  paalNumber: number;
}

export interface Chapter extends Category {
  start: number;
  end: number;
  paalNumber: number;
  iyalNumber: number;
}

export interface Kural {
  Number: number;
  Line1: string;
  Line2: string;
  Translation: string;
  mv: string;
  sp: string;
  mk: string;
  explanation: string;
  couplet: string;
  transliteration1: string;
  transliteration2: string;
  chapter: Chapter;
  iyal: Iyal;
  paal: Category;
}

export type ErrorCode =
  | 'EMPTY_FILTER'
  | 'INVALID_NUMBER'
  | 'UNKNOWN_CATEGORY'
  | 'NETWORK'
  | 'NOT_READY'
  | 'DATA';

export class DailyKuralError extends Error {
  code: ErrorCode;
  constructor(code: ErrorCode, message: string);
}

export interface InitOptions {
  source?: 'network' | 'file' | 'bundle' | 'data';
  dataUrl?: string | string[];
  detailUrl?: string | string[];
  dataPath?: string;
  detailPath?: string;
  data?: unknown;
  detail?: unknown;
  cache?: boolean | 'memory' | 'storage';
  force?: boolean;
}

export interface InitInfo {
  source: string;
  count: number;
  fromCache: boolean;
}

export interface Page<T> {
  total: number;
  offset: number;
  limit: number;
  items: T[];
}

export interface DailyOptions {
  filter?: Filter | string;
  date?: string | Date;
  timezone?: string;
  timeZone?: string;
}

export interface RandomOptions {
  filter?: Filter | string;
  /** Last N shown numbers, or an explicit list to skip. */
  avoid?: number | number[];
}

export interface ListOptions {
  filter?: Filter | string;
  limit?: number;
  offset?: number;
}

export interface SearchOptions extends ListOptions {
  fields?: string[];
}

export type Lang = 'ta' | 'en' | 'both';
export type Commentary = 'mv' | 'sp' | 'mk' | 'all' | 'none';
export type Theme = 'light' | 'dark' | 'auto';
export type Mode = 'daily' | 'random' | 'number' | 'browse';
export type FontMode = 'google' | 'self' | 'none';

export interface RenderOptions {
  lang?: Lang;
  commentary?: Commentary;
  showTransliteration?: boolean;
  showTranslation?: boolean;
  showMeta?: boolean;
}

export interface MountOptions extends RenderOptions {
  mode?: Mode;
  filter?: Filter | string;
  number?: number | string;
  paal?: CategoryQuery;
  iyal?: CategoryQuery;
  chapter?: CategoryQuery;
  range?: string;
  theme?: Theme;
  autoRefresh?: number;
  syncUrl?: boolean;
  loadFonts?: FontMode;
  fontBase?: string;
  timezone?: string;
  onChange?: (detail: { kural: Kural; filter: Filter }) => void;
}

export interface FilterChip {
  key: keyof Filter;
  value: number | string | [number, number];
  label: string;
}

export interface ScheduleOptions {
  at?: string;
  filter?: Filter | string;
  timezone?: string;
  timeZone?: string;
  onError?: (err: unknown) => void;
}

export interface DailyKuralAPI {
  version: string;
  /** Civil date used as day zero. `2024-01-01`. */
  EPOCH: string;
  Error: typeof DailyKuralError;
  DailyKuralError: typeof DailyKuralError;
  init(options?: InitOptions): Promise<InitInfo>;
  useBundledData(kural: unknown, detail: unknown): void;
  getByNumber(n: number | string): Kural;
  getRandom(options?: RandomOptions): Kural;
  getDaily(options?: DailyOptions): Kural;
  getDailyFor(date: string | Date, options?: Omit<DailyOptions, 'date'>): Kural;
  getNextDaily(options?: DailyOptions): Kural;
  list(options?: ListOptions): Page<Kural>;
  count(options?: { filter?: Filter | string }): number;
  getByChapter(chapter: CategoryQuery): Kural[];
  getByIyal(iyal: CategoryQuery): Kural[];
  getByPaal(paal: CategoryQuery): Kural[];
  listPaals(): Category[];
  listIyals(paal?: CategoryQuery): Iyal[];
  listChapters(options?: { paal?: CategoryQuery; iyal?: CategoryQuery }): Chapter[];
  search(query: string, options?: SearchOptions): Page<Kural>;
  getRange(start: number | string, end: number | string): Kural[];
  next(n: number | string, options?: { filter?: Filter | string }): Kural;
  prev(n: number | string, options?: { filter?: Filter | string }): Kural;
  resolveFilter(filter?: Filter | string | null): readonly number[];
  parseFilterString(input: string): Filter;
  stringifyFilter(filter?: Filter | string | null): string;
  describeFilter(filter?: Filter | string | null): FilterChip[];
  findCategory(kind: 'paal' | 'iyal' | 'chapter', query: CategoryQuery | null | undefined): Category | Iyal | Chapter | null;
  scheduleDaily(callback: (kural: Kural) => void | Promise<void>, options?: ScheduleOptions): () => void;
  renderKuralHTML(kural: Kural, options?: RenderOptions): string;
  mount(selector: string | Element, options?: MountOptions): Element;
  loadFonts(mode?: FontMode, fontBase?: string): Promise<void>;
  register(): void;
}

export const DailyKural: DailyKuralAPI;
export const EPOCH: string;
export function parseFilterString(input: string): Filter;
export function stringifyFilter(filter?: Filter | string | null): string;
export function renderKuralHTML(kural: Kural, options?: RenderOptions): string;
export function init(options?: InitOptions): Promise<InitInfo>;
export function getByNumber(n: number | string): Kural;
export function getRandom(options?: RandomOptions): Kural;
export function getDaily(options?: DailyOptions): Kural;
export function getDailyFor(date: string | Date, options?: Omit<DailyOptions, 'date'>): Kural;
export function getNextDaily(options?: DailyOptions): Kural;
export function list(options?: ListOptions): Page<Kural>;
export function count(options?: { filter?: Filter | string }): number;
export function search(query: string, options?: SearchOptions): Page<Kural>;
export function resolveFilter(filter?: Filter | string | null): readonly number[];
export function scheduleDaily(callback: (kural: Kural) => void | Promise<void>, options?: ScheduleOptions): () => void;
export function mount(selector: string | Element, options?: MountOptions): Element;

export default DailyKural;
