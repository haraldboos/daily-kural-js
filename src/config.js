/**
 * Pinned revision of the Thirukkural data.
 * https://github.com/tk120404/thirukkural (Apache-2.0)
 *
 * Change this one constant when you intentionally move the pin.
 * Do not point it at `master` or any other moving branch.
 */
export const THIRUKKURAL_DATA_REV = 'cf3ff6c5a73c23b4092913156830457caab65fd4';

const REPO = 'tk120404/thirukkural';

function raw(file) {
  return `https://raw.githubusercontent.com/${REPO}/${THIRUKKURAL_DATA_REV}/${file}`;
}

function mirror(file) {
  return `https://cdn.jsdelivr.net/gh/${REPO}@${THIRUKKURAL_DATA_REV}/${file}`;
}

/** Primary verse file. GitHub raw, pinned commit, CORS `*`. */
export const PRIMARY_KURAL_URL = raw('thirukkural.json');

/** Same verses on jsDelivr, used when the primary URL fails. */
export const FALLBACK_KURAL_URL = mirror('thirukkural.json');

/** Primary structure file (பால், இயல், அதிகாரம்). */
export const PRIMARY_DETAIL_URL = raw('detail.json');

/** Same structure file on jsDelivr. */
export const FALLBACK_DETAIL_URL = mirror('detail.json');
