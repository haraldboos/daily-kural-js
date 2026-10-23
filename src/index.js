import {
  count,
  describeFilter,
  findCategory,
  getByChapter,
  getByIyal,
  getByNumber,
  getByPaal,
  getDaily,
  getDailyFor,
  getNextDaily,
  getRandom,
  getRange,
  init,
  list,
  listChapters,
  listIyals,
  listPaals,
  next,
  prev,
  resolveFilter,
  search,
  useBundledData,
} from './api.js';
import { EPOCH } from './daily.js';
import { DailyKuralError } from './errors.js';
import { parseFilterString, stringifyFilter } from './filter.js';
import { scheduleDaily } from './schedule.js';
import { VERSION } from './constants.js';
import { mount, registerDailyKuralElement } from './ui/element.js';
import { ensureFonts } from './ui/fonts.js';
import { renderKuralHTML } from './ui/render.js';
import { autoInitWidgets } from './ui/widget.js';

export { DailyKuralError, EPOCH, parseFilterString, renderKuralHTML, stringifyFilter };

/**
 * Public API. The browser bundle assigns this object to `window.DailyKural`.
 */
export const DailyKural = {
  version: VERSION,
  EPOCH,
  Error: DailyKuralError,
  DailyKuralError,
  init,
  useBundledData,
  getByNumber,
  getRandom,
  getDaily,
  getDailyFor,
  getNextDaily,
  list,
  count,
  getByChapter,
  getByIyal,
  getByPaal,
  listPaals,
  listIyals,
  listChapters,
  search,
  getRange,
  next,
  prev,
  resolveFilter,
  parseFilterString,
  stringifyFilter,
  describeFilter,
  findCategory,
  scheduleDaily,
  renderKuralHTML,
  mount,
  loadFonts: ensureFonts,
  register: registerDailyKuralElement,
};

export function startBrowser() {
  if (typeof document === 'undefined') return;
  registerDailyKuralElement();
  autoInitWidgets();
  if (typeof window !== 'undefined') window.DailyKural = DailyKural;
}

if (typeof document !== 'undefined') startBrowser();

export default DailyKural;

export {
  count,
  describeFilter,
  findCategory,
  getByChapter,
  getByIyal,
  getByNumber,
  getByPaal,
  getDaily,
  getDailyFor,
  getNextDaily,
  getRandom,
  getRange,
  init,
  list,
  listChapters,
  listIyals,
  listPaals,
  mount,
  next,
  prev,
  resolveFilter,
  scheduleDaily,
  search,
  useBundledData,
};
