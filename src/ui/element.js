import {
  describeFilter,
  findCategory,
  getByNumber,
  getDaily,
  getRandom,
  init,
  listChapters,
  listIyals,
  listPaals,
  next,
  prev,
  resolveFilter,
  stringifyFilter,
} from '../api.js';
import { FILTER_KEYS } from '../constants.js';
import { DailyKuralError } from '../errors.js';
import { normalizeFilter, parseFilterString } from '../filter.js';
import { fold } from '../text.js';
import { ensureFonts } from './fonts.js';
import { resolveView } from './render.js';
import { ELEMENT_CSS } from './styles.js';

const SHORTCUTS = ['paal', 'iyal', 'chapter', 'number', 'numbers', 'exclude', 'range'];
const BaseElement = typeof HTMLElement === 'undefined' ? class {} : HTMLElement;

/**
 * `<daily-kural>` custom element.
 */
export class DailyKuralElement extends BaseElement {
  static get observedAttributes() {
    return [
      'mode', 'filter', 'number', 'paal', 'iyal', 'chapter', 'range', 'numbers', 'exclude',
      'lang', 'commentary', 'theme', 'show-transliteration', 'show-translation', 'show-meta',
      'auto-refresh', 'sync-url', 'load-fonts', 'font-base', 'timezone',
    ];
  }

  constructor() {
    super();
    this._mounted = false;
    this._silent = false;
    this._booted = false;
    this._readySent = false;
    this._filter = {};
    this._current = null;
    this._activeNote = null;
    this._timer = null;
    /** @type {((event: HashChangeEvent) => void) | null} */
    this._onHash = null;
    if (typeof document === 'undefined') return;
    const shadow = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = ELEMENT_CSS;
    shadow.appendChild(style);
    this._root = document.createElement('div');
    this._root.className = 'dk';
    shadow.appendChild(this._root);
    this._buildShell();
  }

  get filter() {
    return this._filter || {};
  }

  set filter(value) {
    try {
      const raw = value && typeof value === 'object' ? value : (value == null ? '' : String(value));
      this._applyFilter(normalizeFilter(raw));
    } catch (err) {
      this._showError(err);
    }
  }

  get mode() {
    return this.getAttribute('mode') || 'daily';
  }

  set mode(value) {
    this.setAttribute('mode', value || 'daily');
  }

  connectedCallback() {
    this._mounted = true;
    if (!this._filter || !this._sawFilter) {
      try {
        this._filter = this._effectiveFilter();
      } catch (err) {
        this._filter = {};
        this._showError(err);
      }
    }
    this._readUrl();
    this._boot();
    if (this.hasAttribute('sync-url') && !this._onHash && typeof window !== 'undefined') {
      this._onHash = () => this._onHashChange();
      window.addEventListener('hashchange', this._onHash);
    }
  }

  disconnectedCallback() {
    this._mounted = false;
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    if (this._onHash && typeof window !== 'undefined') {
      window.removeEventListener('hashchange', this._onHash);
      this._onHash = null;
    }
  }

  /**
   * @param {string} name
   */
  attributeChangedCallback(name) {
    if (!this._mounted || this._silent || !this._booted) return;
    if (name === 'load-fonts' || name === 'font-base') {
      ensureFonts(this.getAttribute('load-fonts') || 'google', this.getAttribute('font-base') || undefined);
      return;
    }
    if (name === 'filter' || SHORTCUTS.includes(name)) {
      try {
        this._filter = this._effectiveFilter();
      } catch (err) {
        this._showError(err);
        return;
      }
      this._syncPickers();
      this._loadFromMode({ reroll: true });
      return;
    }
    if (name === 'mode' || name === 'number' || name === 'timezone') {
      this._loadFromMode({ reroll: name === 'mode' });
      return;
    }
    if (name === 'auto-refresh') {
      this._armRefresh();
      return;
    }
    this._paintCurrent();
  }

  async _boot() {
    this._setStatus('');
    this._setArticleMessage('Loading Thirukkural…');
    try {
      await init();
      await ensureFonts(this.getAttribute('load-fonts') || 'google', this.getAttribute('font-base') || undefined);
      if (!this._mounted) return;
      this._fillPickers();
      this._booted = true;
      this._loadFromMode({ reroll: true });
    } catch (err) {
      this._showError(err, { retry: true });
    }
  }

  _buildShell() {
    const root = this._root;
    root.textContent = '';

    const top = el('div', 'top');
    this._eyebrow = el('p', 'eyebrow');
    this._eyebrow.lang = 'ta';
    this._eyebrow.textContent = 'திருக்குறள்';
    const side = el('div');
    this._modeLabel = el('p', 'mode');
    this._count = el('p', 'count');
    side.append(this._modeLabel, this._count);
    top.append(this._eyebrow, side);

    this._chips = el('div', 'chips');

    this._status = el('div', 'status');
    this._status.setAttribute('role', 'status');

    this._card = el('div', 'card');
    const badges = el('div', 'badges');
    this._num = el('span', 'num');
    this._num.setAttribute('part', 'number');
    this._chapter = el('span', 'pill');
    this._chapter.lang = 'ta';
    this._chapter.setAttribute('part', 'chapter');
    this._paalLabel = el('span', 'pill');
    this._paalLabel.lang = 'ta';
    badges.append(this._num, this._chapter, this._paalLabel);

    this._article = document.createElement('article');
    this._article.setAttribute('aria-live', 'polite');
    this._article.setAttribute('aria-atomic', 'true');
    this._article.setAttribute('part', 'kural');
    this._lines = el('div', 'lines');
    this._line1 = el('p', 'line');
    this._line1.lang = 'ta';
    this._line1.setAttribute('part', 'line');
    this._line2 = el('p', 'line');
    this._line2.lang = 'ta';
    this._line2.setAttribute('part', 'line');
    this._lines.append(this._line1, this._line2);
    this._trans1 = el('p', 'translit');
    this._trans1.lang = 'en';
    this._trans2 = el('p', 'translit');
    this._trans2.lang = 'en';
    this._translation = el('p', 'translation');
    this._translation.lang = 'en';
    this._translation.setAttribute('part', 'translation');
    this._couplet = el('p', 'couplet');
    this._couplet.lang = 'en';
    this._article.append(this._lines, this._trans1, this._trans2, this._translation, this._couplet);

    this._tabs = el('div', 'tabs');
    this._tabs.setAttribute('role', 'tablist');
    this._tabs.setAttribute('aria-label', 'Commentaries');
    this._panel = el('div', 'panel');
    this._panel.setAttribute('role', 'tabpanel');
    this._noteTitle = el('p', 'note-title');
    this._noteBody = el('p', 'note-body');
    this._panel.append(this._noteTitle, this._noteBody);
    this._card.append(badges, this._article, this._tabs, this._panel);

    this._controls = el('div', 'controls');
    this._today = button('Today', () => this._showDaily());
    this._prev = button('Previous', () => this._step(-1));
    this._next = button('Next', () => this._step(1));
    this._randomBtn = button('New random kural', () => this._showRandom());
    this._randomBtn.classList.add('primary');
    this._copy = button('Copy', () => this._copyText());
    this._share = button('Share', () => this._shareText());
    this._prev.setAttribute('aria-label', 'Previous kural');
    this._next.setAttribute('aria-label', 'Next kural');
    this._controls.append(this._today, this._prev, this._randomBtn, this._next, this._copy, this._share);

    this._jump = el('form', 'jump');
    this._numberInput = document.createElement('input');
    this._numberInput.type = 'number';
    this._numberInput.min = '1';
    this._numberInput.max = '1330';
    this._numberInput.inputMode = 'numeric';
    this._numberInput.setAttribute('aria-label', 'Go to kural number');
    this._numberInput.placeholder = 'Kural number';
    const go = button('Go', () => this._jumpToInput());
    this._jump.append(this._numberInput, go);
    this._jump.addEventListener('submit', (event) => {
      event.preventDefault();
      this._jumpToInput();
    });

    this._pickers = el('div', 'pickers');
    this._paalSelect = this._select('Paal', 'paal');
    this._iyalSelect = this._select('Iyal', 'iyal');
    this._chapterSelect = this._select('Adhigaram', 'chapter');
    this._paalSelect.addEventListener('change', () => this._onPaal());
    this._iyalSelect.addEventListener('change', () => this._onIyal());
    this._chapterSelect.addEventListener('change', () => this._onChapter());

    this._tabs.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const tab = target.closest('[role="tab"]');
      if (!tab) return;
      this._activeNote = tab.getAttribute('data-note');
      this._paintNotes();
    });
    this._tabs.addEventListener('keydown', (event) => this._onTabKey(event));

    root.append(top, this._chips, this._status, this._card, this._controls, this._jump, this._pickers);
  }

  _select(labelText, key) {
    const label = document.createElement('label');
    const span = document.createElement('span');
    span.textContent = labelText;
    const select = document.createElement('select');
    select.setAttribute('aria-label', labelText);
    select.dataset.key = key;
    label.append(span, select);
    this._pickers.appendChild(label);
    return select;
  }

  async _retry() {
    try {
      await init({ force: true, cache: false });
      this._setStatus('');
      this._fillPickers();
      this._booted = true;
      this._loadFromMode({ reroll: true });
    } catch (err) {
      this._showError(err, { retry: true });
    }
  }

  _loadFromMode({ reroll = false } = {}) {
    if (!this._booted) return;
    const mode = this.getAttribute('mode') || 'daily';
    this._modeLabel.textContent = modeLabel(mode);
    try {
      if (mode === 'daily') {
        this._setKural(getDaily({
          filter: this._filter,
          timezone: this.getAttribute('timezone') || undefined,
        }));
      } else if (mode === 'random') {
        if (reroll || !this._current) this._setKural(getRandom({ filter: this._filter, avoid: 8 }));
        else this._paintCurrent();
      } else if (mode === 'number') {
        const n = this._pendingNumber || this.getAttribute('number') || (this._filter && this._filter.number);
        this._pendingNumber = null;
        if (n == null || n === '') {
          this._setStatus('Enter a kural number.');
          return;
        }
        this._silent = true;
        this.removeAttribute('number');
        this._silent = false;
        this._setKural(getByNumber(n));
      } else {
        const desired = this.getAttribute('number') || (this._current && this._current.Number);
        const numbers = resolveFilter(this._filter);
        const pick = desired && numbers.indexOf(Number(desired)) !== -1 ? Number(desired) : numbers[0];
        this._setKural(getByNumber(pick));
      }
      this._armRefresh();
    } catch (err) {
      this._showError(err, { retry: err && err.code === 'NETWORK' });
    }
  }

  _showDaily() {
    this._setMode('daily');
    try {
      this._setKural(getDaily({
        filter: this._filter,
        timezone: this.getAttribute('timezone') || undefined,
      }));
    } catch (err) {
      this._showError(err);
    }
  }

  _showRandom() {
    this._setMode('random');
    try {
      this._setKural(getRandom({ filter: this._filter, avoid: 8 }));
    } catch (err) {
      this._showError(err);
    }
  }

  _step(direction) {
    if (!this._current) return;
    try {
      const kural = direction > 0
        ? next(this._current.Number, { filter: this._filter })
        : prev(this._current.Number, { filter: this._filter });
      this._showKural(kural.Number, { mode: 'browse' });
    } catch (err) {
      this._showError(err);
    }
  }

  _jumpToInput() {
    try {
      this._showKural(this._numberInput.value, { mode: 'number' });
    } catch (err) {
      this._setStatus(err.message);
    }
  }

  /**
   * Show one kural without adding `number` to the active filter.
   * @param {number | string} n
   * @param {{ mode?: string }} [options]
   */
  showKural(n, options) {
    return this._showKural(n, options);
  }

  _showKural(n, options = {}) {
    const kural = getByNumber(n);
    let outside = false;
    try {
      outside = resolveFilter(this._filter).indexOf(kural.Number) === -1;
    } catch {
      outside = false;
    }
    this._setMode(options.mode || 'number');
    this._silent = true;
    this.removeAttribute('number');
    this._silent = false;
    this._setKural(kural);
    if (outside) {
      this._setStatus('This kural is outside the active filter. Previous and next stay inside the filter.');
    }
    return kural;
  }

  _setMode(mode) {
    this._silent = true;
    this.setAttribute('mode', mode);
    this._silent = false;
    this._modeLabel.textContent = modeLabel(mode);
  }

  _setKural(kural) {
    this._current = kural;
    this._activeNote = null;
    this._paintCurrent();
    this._emit('kural-change');
    if (!this._readySent) {
      this._readySent = true;
      this._emit('kural-ready');
    }
    this._writeUrl();
  }

  _paintCurrent() {
    const kural = this._current;
    if (!kural) return;
    const view = this._view();
    this._num.hidden = !view.showMeta;
    this._chapter.hidden = !view.showMeta;
    this._paalLabel.hidden = !view.showMeta;
    this._num.textContent = `Kural ${kural.Number}`;
    this._chapter.textContent = kural.chapter.name;
    this._paalLabel.textContent = `${kural.paal.name} · ${kural.iyal.name}`;
    this._line1.textContent = kural.Line1;
    this._line2.textContent = kural.Line2;
    this._lines.hidden = !view.showLines;
    this._trans1.textContent = kural.transliteration1;
    this._trans2.textContent = kural.transliteration2;
    const showTrans = view.showTransliteration;
    this._trans1.hidden = !showTrans;
    this._trans2.hidden = !showTrans;
    this._translation.textContent = kural.Translation;
    this._couplet.textContent = kural.couplet;
    this._translation.hidden = !view.showEnglish;
    this._couplet.hidden = !view.showEnglish;
    this._paintNotes();
    this._paintChips();
    this._numberInput.value = String(kural.Number);
    this._setStatus('');
  }

  _paintNotes() {
    const view = this._view();
    const notes = view.notes;
    this._tabs.textContent = '';
    if (!this._current || notes.length === 0) {
      this._tabs.hidden = true;
      this._panel.hidden = true;
      return;
    }
    this._panel.hidden = false;
    this._tabs.hidden = notes.length < 2;
    if (!this._activeNote || !notes.some((note) => note.id === this._activeNote)) {
      this._activeNote = notes[0].id;
    }
    notes.forEach((note, index) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('data-note', note.id);
      tab.id = `dk-tab-${note.id}`;
      tab.setAttribute('aria-controls', 'dk-note-panel');
      tab.setAttribute('aria-selected', note.id === this._activeNote ? 'true' : 'false');
      tab.tabIndex = note.id === this._activeNote ? 0 : -1;
      tab.textContent = note.short;
      tab.lang = note.lang;
      this._tabs.appendChild(tab);
      if (index === 0) this._tabs.setAttribute('aria-label', 'Commentaries');
    });
    const active = notes.find((note) => note.id === this._activeNote) || notes[0];
    this._panel.id = 'dk-note-panel';
    this._panel.setAttribute('aria-labelledby', `dk-tab-${active.id}`);
    this._noteTitle.lang = active.lang;
    this._noteBody.lang = active.lang;
    this._noteTitle.textContent = active.title;
    this._noteBody.textContent = this._current[active.field] || '';
  }

  _paintChips() {
    this._chips.textContent = '';
    let described = [];
    let total = 0;
    try {
      described = describeFilter(this._filter);
      total = resolveFilter(this._filter).length;
    } catch (err) {
      this._count.textContent = '';
      if (err && err.code === 'EMPTY_FILTER') this._setStatus(err.message);
      return;
    }
    this._count.textContent = total === 1 ? '1 kural' : `${total} kurals`;
    for (const chip of described) {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'chip';
      const label = document.createElement('span');
      label.textContent = chip.label;
      const x = document.createElement('span');
      x.className = 'x';
      x.setAttribute('aria-hidden', 'true');
      x.textContent = '×';
      node.append(label, x);
      node.setAttribute('aria-label', `Remove ${chip.label}`);
      node.addEventListener('click', () => this._removeChip(chip));
      this._chips.appendChild(node);
    }
    if (described.length) {
      const clear = button('Clear filter', () => this._applyFilter({}));
      clear.classList.add('ghost');
      this._chips.appendChild(clear);
    }
  }

  _removeChip(chip) {
    const next = cloneFilter(this._filter);
    if (chip.key === 'range' || chip.key === 'number' || !Array.isArray(next[chip.key])) {
      delete next[chip.key];
    } else {
      const list = next[chip.key].filter((item) => !sameValue(item, chip.value));
      if (list.length === 0) delete next[chip.key];
      else next[chip.key] = list;
    }
    this._applyFilter(next);
  }

  _fillPickers() {
    fillSelect(this._paalSelect, listPaals(), 'All paal');
    this._refillIyal();
    this._refillChapter();
    this._syncPickers();
  }

  _refillIyal() {
    const paal = this._paalSelect.value;
    const rows = listIyals(paal || undefined);
    fillSelect(this._iyalSelect, rows, 'All iyal');
  }

  _refillChapter() {
    const paal = this._paalSelect.value;
    const iyal = this._iyalSelect.value;
    const rows = listChapters({
      paal: paal || undefined,
      iyal: iyal || undefined,
    });
    fillSelect(this._chapterSelect, rows, 'All adhigaram');
  }

  _syncPickers() {
    const paal = singleCategory('paal', this._filter.paal);
    const iyal = singleCategory('iyal', this._filter.iyal);
    const chapter = singleCategory('chapter', this._filter.chapter);
    this._paalSelect.value = paal ? String(paal.number) : '';
    this._refillIyal();
    this._iyalSelect.value = iyal ? String(iyal.number) : '';
    this._refillChapter();
    this._chapterSelect.value = chapter ? String(chapter.number) : '';
  }

  _onPaal() {
    const next = cloneFilter(this._filter);
    const value = this._paalSelect.value;
    if (!value) delete next.paal;
    else next.paal = Number(value);
    if (next.iyal && !categoryFits('iyal', next.iyal, { paalNumber: value ? Number(value) : null })) delete next.iyal;
    if (next.chapter && !categoryFits('chapter', next.chapter, { paalNumber: value ? Number(value) : null })) {
      delete next.chapter;
    }
    this._applyFilter(next);
  }

  _onIyal() {
    const next = cloneFilter(this._filter);
    const value = this._iyalSelect.value;
    if (!value) delete next.iyal;
    else {
      next.iyal = Number(value);
      const hit = findCategory('iyal', Number(value));
      if (hit) next.paal = hit.paalNumber;
    }
    if (next.chapter && !categoryFits('chapter', next.chapter, {
      paalNumber: next.paal && !Array.isArray(next.paal) ? numberOf('paal', next.paal) : null,
      iyalNumber: value ? Number(value) : null,
    })) delete next.chapter;
    this._applyFilter(next);
  }

  _onChapter() {
    const next = cloneFilter(this._filter);
    const value = this._chapterSelect.value;
    if (!value) delete next.chapter;
    else {
      next.chapter = Number(value);
      const hit = findCategory('chapter', Number(value));
      if (hit) {
        next.paal = hit.paalNumber;
        next.iyal = hit.iyalNumber;
      }
    }
    this._applyFilter(next);
  }

  _applyFilter(next) {
    this._filter = next || {};
    this._sawFilter = true;
    this._silent = true;
    this.setAttribute('filter', stringifyFilter(this._filter));
    for (const key of SHORTCUTS) this.removeAttribute(key);
    this._silent = false;
    if (!this._booted) return;
    this._syncPickers();
    const mode = this.getAttribute('mode') || 'daily';
    this._loadFromMode({ reroll: mode === 'random' || mode === 'daily' || mode === 'browse' });
  }

  _view() {
    return resolveView({
      lang: this.getAttribute('lang') || 'both',
      commentary: this.getAttribute('commentary') || 'all',
      showTransliteration: attrFlag(this, 'show-transliteration', false),
      showTranslation: attrFlag(this, 'show-translation', true),
      showMeta: attrFlag(this, 'show-meta', true),
    });
  }

  _effectiveFilter() {
    const filter = parseFilterString(this.getAttribute('filter') || '');
    for (const key of SHORTCUTS) {
      if (!this.hasAttribute(key)) continue;
      const value = this.getAttribute(key);
      if (value == null || value === '') continue;
      const parsed = parseFilterString(`${key}=${value}`);
      if (parsed[key] != null) filter[key] = parsed[key];
    }
    return filter;
  }

  _readUrl() {
    if (!this.hasAttribute('sync-url') || typeof location === 'undefined') return;
    const params = new URLSearchParams(location.search);
    if (params.get('mode')) {
      this._silent = true;
      this.setAttribute('mode', params.get('mode'));
      this._silent = false;
    }
    /** @type {Record<string, any>} */
    const gathered = {};
    let any = false;
    for (const key of FILTER_KEYS) {
      if (!params.has(key)) continue;
      any = true;
      const parsed = parseFilterString(`${key}=${params.get(key)}`);
      gathered[key] = parsed[key];
    }
    if (any) {
      this._filter = gathered;
      this._sawFilter = true;
    }
    const hash = location.hash || '';
    const match = /^#kural-(\d+)$/.exec(hash);
    if (match) {
      this._silent = true;
      this.setAttribute('mode', 'number');
      this._silent = false;
      this._pendingNumber = match[1];
    }
  }

  _writeUrl() {
    if (!this.hasAttribute('sync-url') || typeof history === 'undefined' || typeof location === 'undefined') return;
    const mode = this.getAttribute('mode') || 'daily';
    const filterStr = stringifyFilter(this._filter || {});
    const qs = filterStr ? `mode=${encodeURIComponent(mode)}&${filterStr}` : `mode=${encodeURIComponent(mode)}`;
    const hash = this._current ? `#kural-${this._current.Number}` : '';
    const nextUrl = `${location.pathname}?${qs}${hash}`;
    const current = `${location.pathname}${location.search}${location.hash}`;
    if (nextUrl === current) return;
    history.replaceState({ dailyKural: true }, '', nextUrl);
  }

  _onHashChange() {
    const match = /^#kural-(\d+)$/.exec(location.hash || '');
    if (!match || !this._booted) return;
    if (this._current && String(this._current.Number) === match[1]) return;
    try {
      this._showKural(match[1], { mode: 'number' });
    } catch (err) {
      this._showError(err);
    }
  }

  _armRefresh() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    const ms = Number(this.getAttribute('auto-refresh'));
    if (!Number.isFinite(ms) || ms <= 0) return;
    const mode = this.getAttribute('mode') || 'daily';
    this._timer = setInterval(() => {
      if (!this._mounted) return;
      if (mode === 'random') this._showRandom();
      else if ((this.getAttribute('mode') || 'daily') === 'daily') this._showDaily();
    }, ms);
  }

  _copyText() {
    const text = this._sharePayload().text;
    const done = () => this._setStatus('Copied.');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => this._fallbackCopy(text));
      return;
    }
    this._fallbackCopy(text);
  }

  _shareText() {
    const payload = this._sharePayload();
    if (navigator.share) {
      navigator.share(payload).catch((err) => {
        if (err && err.name === 'AbortError') return;
        this._fallbackCopy(`${payload.text}\n${payload.url || ''}`);
      });
      return;
    }
    this._fallbackCopy(`${payload.text}\n${payload.url || ''}`);
    this._setStatus('Sharing is unavailable here. The kural was copied instead.');
  }

  _sharePayload() {
    const kural = this._current;
    const text = kural
      ? `${kural.Line1}\n${kural.Line2}\n— திருக்குறள் ${kural.Number}`
      : '';
    const url = typeof location !== 'undefined' ? location.href : undefined;
    return { title: kural ? `திருக்குறள் ${kural.Number}` : 'திருக்குறள்', text, url };
  }

  _fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    this._root.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    this._setStatus(ok ? 'Copied.' : 'Could not copy this kural.');
  }

  _onTabKey(event) {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    const tabs = [...this._tabs.querySelectorAll('[role="tab"]')];
    if (!tabs.length) return;
    const current = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
    let nextIndex = current;
    if (event.key === 'ArrowRight') nextIndex = (current + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (current - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    event.preventDefault();
    const tab = tabs[nextIndex];
    this._activeNote = tab.getAttribute('data-note');
    this._paintNotes();
    const fresh = this._tabs.querySelector('[aria-selected="true"]');
    if (fresh instanceof HTMLElement) fresh.focus();
  }

  _showError(err, options = {}) {
    const full = err && err.message ? err.message : 'Something went wrong.';
    const message = full.length > 420 ? `${full.slice(0, 420)}…` : full;
    this._setStatus(message);
    if (!this._current) this._setArticleMessage(message);
    this._emitError(err);
    if (options.retry && this._status) {
      const retry = button('Retry', () => this._retry());
      retry.classList.add('primary');
      this._status.appendChild(document.createTextNode(' '));
      this._status.appendChild(retry);
    }
    if (err && err.code === 'EMPTY_FILTER') {
      const clear = button('Clear filter', () => this._applyFilter({}));
      this._status.appendChild(document.createTextNode(' '));
      this._status.appendChild(clear);
    }
  }

  _setStatus(message) {
    if (!this._status) return;
    this._status.textContent = message || '';
  }

  _setArticleMessage(message) {
    if (!this._line1) return;
    this._line1.textContent = message;
    this._line2.textContent = '';
    this._translation.textContent = '';
    this._couplet.textContent = '';
    this._trans1.textContent = '';
    this._trans2.textContent = '';
  }

  _emit(name) {
    this.dispatchEvent(new CustomEvent(name, {
      bubbles: true,
      composed: true,
      detail: { kural: this._current, filter: this._filter },
    }));
  }

  _emitError(err) {
    this.dispatchEvent(new CustomEvent('kural-error', {
      bubbles: true,
      composed: true,
      detail: {
        error: err,
        code: err && err.code ? err.code : 'ERROR',
        message: err && err.message ? err.message : String(err),
      },
    }));
  }
}

export function registerDailyKuralElement() {
  if (typeof customElements === 'undefined') return;
  if (!customElements.get('daily-kural')) customElements.define('daily-kural', DailyKuralElement);
}

/**
 * Mount a `<daily-kural>` into a selector or element.
 * @param {string | Element} selector
 * @param {object} [options]
 */
export function mount(selector, options = {}) {
  if (typeof document === 'undefined') {
    throw new DailyKuralError('NOT_READY', 'mount() requires a browser document.');
  }
  registerDailyKuralElement();
  const host = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!host) throw new DailyKuralError('NOT_READY', `mount() could not find ${selector}.`);
  const el = host.tagName === 'DAILY-KURAL' ? host : document.createElement('daily-kural');
  if (el !== host) host.replaceChildren(el);
  applyOptions(el, options);
  return el;
}

function applyOptions(el, options) {
  if (options.filter && typeof options.filter === 'object') el.filter = options.filter;
  else if (typeof options.filter === 'string') el.setAttribute('filter', options.filter);
  const map = {
    mode: 'mode',
    number: 'number',
    paal: 'paal',
    iyal: 'iyal',
    chapter: 'chapter',
    range: 'range',
    lang: 'lang',
    commentary: 'commentary',
    theme: 'theme',
    autoRefresh: 'auto-refresh',
    loadFonts: 'load-fonts',
    fontBase: 'font-base',
    timezone: 'timezone',
  };
  for (const [key, attr] of Object.entries(map)) {
    if (options[key] != null && options[key] !== '') el.setAttribute(attr, String(options[key]));
  }
  setBoolAttr(el, 'sync-url', options.syncUrl);
  setBoolAttr(el, 'show-transliteration', options.showTransliteration);
  setBoolAttr(el, 'show-translation', options.showTranslation);
  setBoolAttr(el, 'show-meta', options.showMeta);
  if (typeof options.onChange === 'function') {
    el.addEventListener('kural-change', (event) => options.onChange(event.detail));
  }
}

function setBoolAttr(el, name, value) {
  if (value == null) return;
  if (value === false || value === 'false') el.setAttribute(name, 'false');
  else el.setAttribute(name, '');
}

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function button(label, onClick) {
  const node = document.createElement('button');
  node.type = 'button';
  node.textContent = label;
  node.addEventListener('click', onClick);
  return node;
}

function fillSelect(select, rows, placeholder) {
  const current = select.value;
  select.textContent = '';
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = placeholder;
  select.appendChild(blank);
  for (const row of rows) {
    const option = document.createElement('option');
    option.value = String(row.number);
    option.textContent = `${row.name} · ${row.translation}`;
    option.lang = 'ta';
    select.appendChild(option);
  }
  if ([...select.options].some((option) => option.value === current)) select.value = current;
}

function attrFlag(node, name, fallback) {
  if (!node.hasAttribute(name)) return fallback;
  const value = node.getAttribute(name);
  if (value === '' || value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function modeLabel(mode) {
  if (mode === 'random') return 'Random kural';
  if (mode === 'number') return 'Kural by number';
  if (mode === 'browse') return 'Browse';
  return 'Kural of the day';
}

function cloneFilter(filter) {
  const next = { ...(filter || {}) };
  for (const key of Object.keys(next)) {
    if (Array.isArray(next[key])) next[key] = next[key].slice();
    else if (Array.isArray(next[key]) === false && next[key] && typeof next[key] === 'object') {
      next[key] = Array.isArray(next[key]) ? next[key].slice() : next[key];
    }
  }
  if (Array.isArray(next.range)) next.range = next.range.slice();
  return next;
}

function sameValue(a, b) {
  if (typeof a === 'number' || typeof b === 'number') return Number(a) === Number(b);
  return fold(a) === fold(b);
}

function singleCategory(kind, value) {
  if (value == null || value === '' || Array.isArray(value)) return null;
  return findCategory(kind, value);
}

function numberOf(kind, value) {
  const hit = singleCategory(kind, value);
  return hit ? hit.number : null;
}

function categoryFits(kind, value, expected) {
  const hit = singleCategory(kind, value);
  if (!hit) return false;
  if (expected.paalNumber != null && hit.paalNumber != null && hit.paalNumber !== expected.paalNumber) return false;
  if (expected.iyalNumber != null && hit.iyalNumber != null && hit.iyalNumber !== expected.iyalNumber) return false;
  return true;
}
