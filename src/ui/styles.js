import { LATIN_FONT_STACK, TAMIL_FONT_STACK } from '../constants.js';

export const ELEMENT_CSS = `
:host {
  --dk-font-tamil-default: ${TAMIL_FONT_STACK};
  --dk-font-latin-default: ${LATIN_FONT_STACK};
  --dk-font-size-default: clamp(1.35rem, 2.5vw, 1.75rem);
  --dk-font-size-latin-default: 1rem;
  --dk-line-height-default: 1.7;
  --dk-line-height-latin-default: 1.55;
  --dk-accent-default: #8f3d22;
  --dk-accent-soft-default: #f3e4d6;
  --dk-bg-default: #f6f1e7;
  --dk-fg-default: #2b241c;
  --dk-muted-default: #6e6256;
  --dk-card-default: #fffaf3;
  --dk-border-default: #e4d7c6;
  --dk-chip-default: #f0e4d4;
  --dk-danger-default: #9b2c2c;
  --dk-radius-default: 18px;
  --dk-shadow-default: 0 16px 40px rgba(70, 44, 24, 0.08);
  --dk-space-default: 1rem;
  display: block;
  color: var(--dk-fg, var(--dk-fg-default));
  background: var(--dk-bg, var(--dk-bg-default));
  font-family: var(--dk-font-latin, var(--dk-font-latin-default));
  font-size: var(--dk-font-size-latin, var(--dk-font-size-latin-default));
  line-height: var(--dk-line-height-latin, var(--dk-line-height-latin-default));
  color-scheme: light;
}
:host([theme="dark"]) {
  --dk-accent-default: #e0a070;
  --dk-accent-soft-default: #3a2c24;
  --dk-bg-default: #1b1613;
  --dk-fg-default: #f6efe6;
  --dk-muted-default: #cbbba8;
  --dk-card-default: #261f1a;
  --dk-border-default: #3d332b;
  --dk-chip-default: #3a3028;
  --dk-danger-default: #f0a8a0;
  --dk-shadow-default: 0 16px 40px rgba(0, 0, 0, 0.35);
  color-scheme: dark;
}
@media (prefers-color-scheme: dark) {
  :host([theme="auto"]), :host(:not([theme])) {
    --dk-accent-default: #e0a070;
    --dk-accent-soft-default: #3a2c24;
    --dk-bg-default: #1b1613;
    --dk-fg-default: #f6efe6;
    --dk-muted-default: #cbbba8;
    --dk-card-default: #261f1a;
    --dk-border-default: #3d332b;
    --dk-chip-default: #3a3028;
    --dk-danger-default: #f0a8a0;
    --dk-shadow-default: 0 16px 40px rgba(0, 0, 0, 0.35);
    color-scheme: dark;
  }
}
*, *::before, *::after { box-sizing: border-box; }
.dk {
  max-width: 44rem;
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 1.75rem);
}
.top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: baseline;
  margin-bottom: 0.75rem;
}
.eyebrow {
  margin: 0;
  font-family: var(--dk-font-tamil, var(--dk-font-tamil-default));
  font-size: 1.05rem;
  line-height: var(--dk-line-height, var(--dk-line-height-default));
  letter-spacing: normal;
}
.mode, .count {
  margin: 0;
  color: var(--dk-muted, var(--dk-muted-default));
  font-size: 0.92rem;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
  min-height: 0.5rem;
  margin-bottom: 0.9rem;
}
.chip, button, select, input {
  font: inherit;
  color: inherit;
}
.chip, .ghost, .primary, .jump button, select, input {
  border-radius: 999px;
  border: 1px solid var(--dk-border, var(--dk-border-default));
  background: var(--dk-card, var(--dk-card-default));
}
.chip, .ghost, .primary, .jump button {
  min-height: 44px;
  padding: 0.4rem 0.9rem;
  cursor: pointer;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: var(--dk-chip, var(--dk-chip-default));
  font-family: var(--dk-font-tamil, var(--dk-font-tamil-default));
  line-height: var(--dk-line-height, var(--dk-line-height-default));
  letter-spacing: normal;
}
.chip .x { font-family: var(--dk-font-latin, var(--dk-font-latin-default)); }
.primary {
  background: var(--dk-accent, var(--dk-accent-default));
  color: #fffaf3;
  border-color: transparent;
}
:host([theme="dark"]) .primary { color: #1b1613; }
@media (prefers-color-scheme: dark) {
  :host([theme="auto"]) .primary, :host(:not([theme])) .primary { color: #1b1613; }
}
.card {
  background: var(--dk-card, var(--dk-card-default));
  border: 1px solid var(--dk-border, var(--dk-border-default));
  border-radius: var(--dk-radius, var(--dk-radius-default));
  box-shadow: var(--dk-shadow, var(--dk-shadow-default));
  padding: clamp(1.1rem, 3vw, 1.8rem);
  border-top: 4px solid var(--dk-accent, var(--dk-accent-default));
}
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
  margin-bottom: 1rem;
}
.num, .pill {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0.15rem 0.7rem;
  border-radius: 999px;
  background: var(--dk-accent-soft, var(--dk-accent-soft-default));
  color: var(--dk-accent, var(--dk-accent-default));
  font-size: 0.92rem;
}
.pill {
  font-family: var(--dk-font-tamil, var(--dk-font-tamil-default));
  line-height: var(--dk-line-height, var(--dk-line-height-default));
  letter-spacing: normal;
}
.lines { margin: 0.25rem 0 0.5rem; }
.line {
  margin: 0.15rem 0;
  text-align: center;
  font-family: var(--dk-font-tamil, var(--dk-font-tamil-default));
  font-size: var(--dk-font-size, var(--dk-font-size-default));
  line-height: var(--dk-line-height, var(--dk-line-height-default));
  line-break: strict;
  letter-spacing: normal;
  word-spacing: normal;
  font-kerning: normal;
  font-synthesis: none;
  overflow-wrap: break-word;
  word-break: normal;
}
.translit, .translation, .couplet, .note-body, .note-title {
  margin: 0.35rem 0;
  text-align: center;
}
.translit, .couplet { color: var(--dk-muted, var(--dk-muted-default)); }
.translation { font-size: 1.05rem; }
.note-title {
  font-family: var(--dk-font-tamil, var(--dk-font-tamil-default));
  line-height: var(--dk-line-height, var(--dk-line-height-default));
  letter-spacing: normal;
  font-weight: 400;
}
.note-body[lang="ta"] {
  font-family: var(--dk-font-tamil, var(--dk-font-tamil-default));
  font-size: 1.05rem;
  line-height: var(--dk-line-height, var(--dk-line-height-default));
  line-break: strict;
  letter-spacing: normal;
  font-synthesis: none;
  text-align: start;
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 1.1rem;
}
.tabs button {
  min-height: 44px;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  font-family: var(--dk-font-tamil, var(--dk-font-tamil-default));
  line-height: var(--dk-line-height, var(--dk-line-height-default));
  letter-spacing: normal;
}
.tabs button[aria-selected="true"] {
  border-color: var(--dk-border, var(--dk-border-default));
  background: var(--dk-accent-soft, var(--dk-accent-soft-default));
}
.panel {
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--dk-border, var(--dk-border-default));
}
.controls, .jump, .pickers {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.9rem;
}
.jump { align-items: center; }
.jump input, .pickers select {
  min-height: 44px;
  padding: 0.4rem 0.75rem;
  border-radius: 12px;
  min-width: 0;
}
.pickers select {
  font-family: var(--dk-font-tamil, var(--dk-font-tamil-default));
  line-height: var(--dk-line-height, var(--dk-line-height-default));
  letter-spacing: normal;
}
.pickers { display: grid; grid-template-columns: 1fr; }
.pickers label { display: grid; gap: 0.25rem; font-size: 0.85rem; color: var(--dk-muted, var(--dk-muted-default)); }
@media (min-width: 720px) {
  .pickers { grid-template-columns: 1fr 1fr 1fr; }
}
.status {
  min-height: 1.25rem;
  margin: 0.4rem 0;
  color: var(--dk-danger, var(--dk-danger-default));
}
.status:empty { display: none; }
:focus-visible {
  outline: 2px solid var(--dk-accent, var(--dk-accent-default));
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition: none !important;
    animation: none !important;
    scroll-behavior: auto !important;
  }
}
@media (forced-colors: active) {
  :focus-visible { outline: 2px solid Highlight; }
  .primary { forced-color-adjust: none; }
}
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
`;
