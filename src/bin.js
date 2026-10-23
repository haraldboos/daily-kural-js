import { main } from './cli.js';

main(process.argv).then((code) => {
  process.exitCode = code || 0;
});
