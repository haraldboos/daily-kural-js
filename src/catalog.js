import { DailyKuralError } from './errors.js';
import { asNfc, collapseSpace } from './text.js';

/**
 * Build indexes from the real tk120404/thirukkural files.
 *
 * detail.json is a one-item array. The hierarchy is:
 *   detail[0].section.detail[]                         பால் (paal)
 *     .chapterGroup.detail[]                           இயல் (iyal)
 *       .chapters.detail[]                             அதிகாரம் (chapter, with start/end)
 *
 * thirukkural.json stores the 1330 poems on the `kural` key.
 *
 * @param {unknown} detailJson
 * @param {unknown} kuralJson
 */
export function buildCatalog(detailJson, kuralJson) {
  const root = Array.isArray(detailJson) ? detailJson[0] : detailJson;
  const sections = root && root.section && root.section.detail;
  if (!Array.isArray(sections)) {
    throw new DailyKuralError('DATA', 'detail.json: expected section.detail to be an array of paal entries.');
  }

  /** @type {InternalPaal[]} */
  const paals = [];
  /** @type {InternalIyal[]} */
  const iyals = [];
  /** @type {InternalChapter[]} */
  const chapters = [];

  for (const section of sections) {
    const groups = section.chapterGroup && section.chapterGroup.detail;
    if (!Array.isArray(groups)) {
      throw new DailyKuralError('DATA', `detail.json: paal ${section.number} is missing chapterGroup.detail.`);
    }
    /** @type {number[]} */
    const paalNumbers = [];
    const paal = {
      name: asNfc(section.name),
      transliteration: asNfc(section.transliteration),
      translation: asNfc(section.translation),
      number: section.number,
      numbers: paalNumbers,
    };
    for (const group of groups) {
      const chapterList = group.chapters && group.chapters.detail;
      if (!Array.isArray(chapterList)) {
        throw new DailyKuralError('DATA', `detail.json: iyal ${group.number} is missing chapters.detail.`);
      }
      /** @type {number[]} */
      const iyalNumbers = [];
      const iyal = {
        name: asNfc(group.name),
        transliteration: asNfc(group.transliteration),
        translation: asNfc(group.translation),
        number: group.number,
        paalNumber: section.number,
        numbers: iyalNumbers,
      };
      for (const chapter of chapterList) {
        if (!Number.isInteger(chapter.start) || !Number.isInteger(chapter.end) || chapter.start > chapter.end) {
          throw new DailyKuralError('DATA', `detail.json: chapter ${chapter.number} has an invalid start/end range.`);
        }
        /** @type {number[]} */
        const numbers = [];
        for (let n = chapter.start; n <= chapter.end; n += 1) numbers.push(n);
        chapters.push({
          name: asNfc(chapter.name),
          transliteration: asNfc(chapter.transliteration),
          translation: asNfc(chapter.translation),
          number: chapter.number,
          start: chapter.start,
          end: chapter.end,
          paalNumber: section.number,
          iyalNumber: group.number,
          numbers,
        });
        for (const n of numbers) {
          iyalNumbers.push(n);
          paalNumbers.push(n);
        }
      }
      iyals.push(iyal);
    }
    paals.push(paal);
  }

  chapters.sort((a, b) => a.start - b.start);
  const rawList = Array.isArray(kuralJson) ? kuralJson : kuralJson && /** @type {{ kural?: unknown }} */ (kuralJson).kural;
  if (!Array.isArray(rawList)) {
    throw new DailyKuralError('DATA', 'thirukkural.json: expected a kural array.');
  }

  /** @type {Map<number, KuralRecord>} */
  const byNumber = new Map();
  /** @type {Map<number, Record<string, string>>} */
  const searchIndex = new Map();

  for (const raw of rawList) {
    const num = raw && raw.Number;
    const chapter = findChapter(chapters, num);
    if (!chapter) {
      throw new DailyKuralError('DATA', `Kural ${num} does not fall inside any chapter range.`);
    }
    const iyal = iyals.find((entry) => entry.number === chapter.iyalNumber);
    const paal = paals.find((entry) => entry.number === chapter.paalNumber);
    const record = {
      Number: num,
      Line1: asNfc(raw.Line1),
      Line2: asNfc(raw.Line2),
      Translation: asNfc(raw.Translation),
      mv: asNfc(raw.mv),
      sp: asNfc(raw.sp),
      mk: asNfc(raw.mk),
      explanation: asNfc(raw.explanation),
      couplet: asNfc(raw.couplet),
      transliteration1: asNfc(raw.transliteration1),
      transliteration2: asNfc(raw.transliteration2),
      chapter: toPublicChapter(chapter),
      iyal: toPublicIyal(iyal),
      paal: toPublicPaal(paal),
    };
    byNumber.set(num, record);
    searchIndex.set(num, haystack(record));
  }

  if (byNumber.size !== 1330) {
    throw new DailyKuralError('DATA', `Expected 1330 kurals, received ${byNumber.size}.`);
  }
  for (let n = 1; n <= 1330; n += 1) {
    if (!byNumber.has(n)) throw new DailyKuralError('DATA', `Missing kural ${n}.`);
  }

  const allNumbers = [];
  for (let n = 1; n <= 1330; n += 1) allNumbers.push(n);

  return {
    paals,
    iyals,
    chapters,
    byNumber,
    searchIndex,
    allNumbers,
  };
}

/**
 * @param {InternalChapter[]} chapters
 * @param {number} n
 */
function findChapter(chapters, n) {
  let lo = 0;
  let hi = chapters.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const chapter = chapters[mid];
    if (n < chapter.start) hi = mid - 1;
    else if (n > chapter.end) lo = mid + 1;
    else return chapter;
  }
  return null;
}

function haystack(record) {
  const field = (value) => collapseSpace(value);
  return {
    line1: field(record.Line1),
    line2: field(record.Line2),
    transliteration1: field(record.transliteration1),
    transliteration2: field(record.transliteration2),
    translation: field(record.Translation),
    mv: field(record.mv),
    sp: field(record.sp),
    mk: field(record.mk),
    explanation: field(record.explanation),
    couplet: field(record.couplet),
  };
}

export function toPublicPaal(paal) {
  return {
    name: paal.name,
    transliteration: paal.transliteration,
    translation: paal.translation,
    number: paal.number,
    count: paal.numbers.length,
  };
}

export function toPublicIyal(iyal) {
  return {
    name: iyal.name,
    transliteration: iyal.transliteration,
    translation: iyal.translation,
    number: iyal.number,
    paalNumber: iyal.paalNumber,
    count: iyal.numbers.length,
  };
}

export function toPublicChapter(chapter) {
  return {
    name: chapter.name,
    transliteration: chapter.transliteration,
    translation: chapter.translation,
    number: chapter.number,
    start: chapter.start,
    end: chapter.end,
    paalNumber: chapter.paalNumber,
    iyalNumber: chapter.iyalNumber,
    count: chapter.numbers.length,
  };
}

/**
 * @param {KuralRecord} record
 */
export function copyKural(record) {
  return {
    Number: record.Number,
    Line1: record.Line1,
    Line2: record.Line2,
    Translation: record.Translation,
    mv: record.mv,
    sp: record.sp,
    mk: record.mk,
    explanation: record.explanation,
    couplet: record.couplet,
    transliteration1: record.transliteration1,
    transliteration2: record.transliteration2,
    chapter: { ...record.chapter },
    iyal: { ...record.iyal },
    paal: { ...record.paal },
  };
}
