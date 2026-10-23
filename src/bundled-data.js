import detail from '../data/detail.json';
import kural from '../data/thirukkural.json';
import { useBundledData } from './store.js';

/** Evaluated before the browser entry so init() can skip the network. */
export const bundledReady = useBundledData(kural, detail);
