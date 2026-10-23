import type { DailyKuralAPI, Filter, Kural, MountOptions } from './index.js';

export const DailyKural: DailyKuralAPI;
export const register: () => void;
export function mount(selector: string | Element, options?: MountOptions): Element;

export class DailyKuralElement extends HTMLElement {
  filter: Filter | string;
  mode: string;
  showKural(n: number | string, options?: { mode?: string }): Kural;
}

export default DailyKural;
