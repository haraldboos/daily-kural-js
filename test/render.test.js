import { describe, expect, it } from 'vitest';
import { renderKuralHTML } from '../src/ui/render.js';

describe('renderKuralHTML', () => {
  it('escapes text and marks Tamil', () => {
    const html = renderKuralHTML({
      Number: 1,
      Line1: '<script>alert(1)</script>',
      Line2: 'line & two',
      Translation: 'A & B',
      transliteration1: 't1',
      transliteration2: 't2',
      couplet: '"quoted"',
      mv: 'mv',
      sp: 'sp',
      mk: 'mk',
      explanation: 'ex',
      chapter: { name: 'அதிகாரம்' },
      iyal: { name: 'இயல்' },
      paal: { name: 'பால்' },
    }, { commentary: 'all', showTransliteration: true, lang: 'both' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('A &amp; B');
    expect(html).toContain('lang="ta"');
    expect(html).toContain('line &amp; two');
    expect(html).toContain('&quot;quoted&quot;');
  });
});
