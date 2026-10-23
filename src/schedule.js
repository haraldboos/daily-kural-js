import { localDateISO, msUntilClock, zonedParts } from './daily.js';
import { DailyKuralError } from './errors.js';

/** @type {((options: object) => object) | null} */
let dailyPicker = null;

/** @param {(options: object) => object} fn */
export function bindDailyPicker(fn) {
  dailyPicker = fn;
}

/**
 * Fire `callback` at a local clock time every day.
 * A tab that sleeps through that moment still fires when it becomes visible,
 * if this scheduler was already armed for that civil date.
 * Returns a function that cancels the scheduler.
 *
 * @param {(kural: object) => void | Promise<void>} callback
 * @param {{ at?: string, filter?: object | string, timezone?: string, timeZone?: string, onError?: (err: unknown) => void }} [options]
 */
export function scheduleDaily(callback, options = {}) {
  if (!dailyPicker) {
    throw new DailyKuralError('NOT_READY', 'Call DailyKural.init() before scheduling.');
  }
  const at = options.at || '06:00';
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(at).trim());
  if (!match) {
    throw new DailyKuralError('DATA', `Invalid time "${at}". Use HH:MM, for example 06:00.`);
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    throw new DailyKuralError('DATA', `Invalid time "${at}". Use HH:MM, for example 06:00.`);
  }
  const timeZone = options.timezone || options.timeZone;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null;
  let stopped = false;
  /** @type {string | null} */
  let firedFor = null;
  /** @type {string | null} */
  let armedFor = null;

  const fail = (err) => {
    if (options.onError) options.onError(err);
  };

  const fire = (key) => {
    if (stopped || firedFor === key) return Promise.resolve();
    firedFor = key;
    const kural = dailyPicker({ filter: options.filter, date: key, timezone: timeZone });
    return Promise.resolve(callback(kural));
  };

  const arm = () => {
    if (stopped) return;
    const delay = msUntilClock(hours, minutes, timeZone);
    const target = new Date(Date.now() + delay);
    armedFor = localDateISO(target, timeZone);
    timer = setTimeout(() => {
      const key = armedFor;
      fire(key).catch(fail).then(() => {
        if (!stopped) arm();
      });
    }, delay);
  };

  const onWake = () => {
    if (stopped) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    const now = new Date();
    const parts = zonedParts(now, timeZone);
    const past = parts.hour * 60 + parts.minute >= hours * 60 + minutes;
    const today = localDateISO(now, timeZone);
    if (past && armedFor === today && firedFor !== today) {
      if (timer) clearTimeout(timer);
      fire(today).catch(fail).then(() => {
        if (!stopped) arm();
      });
    }
  };

  arm();
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onWake);
  if (typeof window !== 'undefined') window.addEventListener('focus', onWake);

  return function cancel() {
    stopped = true;
    if (timer) clearTimeout(timer);
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onWake);
    if (typeof window !== 'undefined') window.removeEventListener('focus', onWake);
  };
}
