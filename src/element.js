/**
 * Side-effect entry for `import 'daily-kural-js/element'`.
 * Registers `<daily-kural>` and, in a browser, `window.DailyKural`.
 */
import { DailyKural, startBrowser } from './index.js';
import { DailyKuralElement, mount, registerDailyKuralElement } from './ui/element.js';

export { DailyKural, DailyKuralElement, mount };
export const register = registerDailyKuralElement;
export default DailyKural;

startBrowser();
