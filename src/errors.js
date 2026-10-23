/**
 * Error raised by daily-kural-js.
 * `code` is one of EMPTY_FILTER, INVALID_NUMBER, UNKNOWN_CATEGORY, NETWORK, NOT_READY, DATA.
 */
export class DailyKuralError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = 'DailyKuralError';
    this.code = code;
  }
}

/**
 * @param {unknown} value
 * @param {string} [label]
 * @returns {number}
 */
export function assertKuralNumber(value, label = 'number') {
  let n = NaN;
  if (typeof value === 'number') n = value;
  else if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) n = Number(value.trim());
  if (!Number.isInteger(n) || n < 1 || n > 1330) {
    throw new DailyKuralError(
      'INVALID_NUMBER',
      `Invalid kural ${label}: ${value}. Expected an integer from 1 to 1330.`,
    );
  }
  return n;
}
