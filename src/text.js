/** Keep source text in Unicode NFC. Already-normalized text is unchanged. */
export function asNfc(value) {
  if (value == null) return '';
  return String(value).normalize('NFC');
}

/** Case-fold for comparison. Tamil has no case; English uses a stable lowercase. */
export function fold(value) {
  return asNfc(value).trim().toLowerCase();
}

export function collapseSpace(value) {
  return fold(value).replace(/\s+/g, ' ').trim();
}
