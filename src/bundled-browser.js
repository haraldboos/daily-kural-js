import { bundledReady } from './bundled-data.js';
import { startBrowser } from './index.js';

if (bundledReady) startBrowser();
