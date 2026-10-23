import { buildCatalog, copyKural, toPublicChapter, toPublicIyal, toPublicPaal } from './catalog.js';
import { CACHE_KEY, DEFAULT_DETAIL_URLS, DEFAULT_KURAL_URLS } from './constants.js';
import { clearDailyCache } from './daily.js';
import { DailyKuralError } from './errors.js';
import { clearFilterCache } from './filter.js';

const state = {
  catalog: null,
  bundled: null,
  info: null,
};

let initPromise = null;

/**
 * Inline data for the bundled browser build. Call before init.
 * @param {unknown} kural
 * @param {unknown} detail
 */
export function useBundledData(kural, detail) {
  state.bundled = { kural, detail };
  return true;
}

export function getCatalog() {
  if (!state.catalog) {
    throw new DailyKuralError('NOT_READY', 'Call DailyKural.init() before reading kurals.');
  }
  return state.catalog;
}

export function getInitInfo() {
  return state.info;
}

/**
 * @param {object} [options]
 */
export function init(options = {}) {
  if (state.catalog && !options.force) return Promise.resolve(state.info);
  if (initPromise && !options.force) return initPromise;
  const run = doInit(options).then(() => state.info);
  initPromise = run;
  return run.then(
    (info) => info,
    (err) => {
      if (initPromise === run) initPromise = null;
      throw err;
    },
  );
}

async function doInit(options) {
  clearFilterCache();
  clearDailyCache();
  state.catalog = null;

  if (options.data && options.detail) {
    ingest(options.data, options.detail, 'data');
    return;
  }
  if (options.source === 'file' || options.dataPath || options.detailPath) {
    const dataPath = options.dataPath;
    const detailPath = options.detailPath;
    if (!dataPath || !detailPath) {
      throw new DailyKuralError('DATA', 'File source requires dataPath and detailPath.');
    }
    const data = await readJsonFile(dataPath);
    const detail = await readJsonFile(detailPath);
    ingest(data, detail, 'file');
    return;
  }
  if (state.bundled && options.source !== 'network') {
    ingest(state.bundled.kural, state.bundled.detail, 'bundle');
    return;
  }
  await loadNetwork(options);
}

function ingest(kural, detail, source) {
  const catalog = buildCatalog(detail, kural);
  state.catalog = catalog;
  state.info = { source, count: catalog.byNumber.size, fromCache: source === 'cache' };
}

async function loadNetwork(options) {
  const useCache = options.cache !== false && options.cache !== 'memory';
  if (useCache) {
    const cached = await readCache();
    if (cached && cached.kural && cached.detail) {
      try {
        ingest(cached.kural, cached.detail, 'cache');
        state.info = { source: 'cache', count: state.catalog.byNumber.size, fromCache: true };
        return;
      } catch {
        await clearCache();
      }
    }
  }
  const kural = await fetchFirst(urlList(options.dataUrl, DEFAULT_KURAL_URLS));
  const detail = await fetchFirst(urlList(options.detailUrl, DEFAULT_DETAIL_URLS));
  ingest(kural, detail, 'network');
  state.info = { source: 'network', count: state.catalog.byNumber.size, fromCache: false };
  if (useCache) {
    try {
      await writeCache({ v: 1, kural, detail });
    } catch {
      // Storage can fail (private mode, quota). Memory cache still works.
    }
  }
}

function urlList(value, defaults) {
  if (value == null) return defaults.slice();
  const list = Array.isArray(value) ? value.slice() : [value];
  for (const fallback of defaults) {
    if (!list.includes(fallback)) list.push(fallback);
  }
  return list;
}

async function fetchFirst(urls) {
  /** @type {unknown} */
  let last = null;
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      return await response.json();
    } catch (err) {
      last = err;
    }
  }
  const detail = last && last.message ? last.message : 'unknown error';
  throw new DailyKuralError('NETWORK', `Could not load Thirukkural data (${detail}).`);
}

async function readJsonFile(filePath) {
  const specifier = 'node:' + 'fs/promises';
  const fs = await import(specifier);
  const text = await fs.readFile(filePath, 'utf8');
  return JSON.parse(text);
}

async function readCache() {
  const fromLocal = readLocalStorage();
  if (fromLocal) return fromLocal;
  return readIndexedDb();
}

function readLocalStorage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeCache(payload) {
  const raw = JSON.stringify(payload);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CACHE_KEY, raw);
      return;
    }
  } catch {
    // Quota exceeded. Fall through to IndexedDB.
  }
  await writeIndexedDb(payload);
}

async function clearCache() {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
  try {
    await deleteIndexedDb();
  } catch {
    // ignore
  }
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }
    const request = indexedDB.open('daily-kural-js', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readIndexedDb() {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readonly');
      const request = tx.objectStore('kv').get(CACHE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function writeIndexedDb(payload) {
  if (typeof indexedDB === 'undefined') return;
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(payload, CACHE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteIndexedDb() {
  if (typeof indexedDB === 'undefined') return;
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').delete(CACHE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function present(n) {
  const record = getCatalog().byNumber.get(n);
  if (!record) {
    throw new DailyKuralError('INVALID_NUMBER', `Invalid kural number: ${n}. Expected an integer from 1 to 1330.`);
  }
  return copyKural(record);
}

export { toPublicChapter, toPublicIyal, toPublicPaal };
