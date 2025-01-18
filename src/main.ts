import { PlaywrightCrawler, log } from 'crawlee';

import router from './routes';
import { dropDataset, openDataset } from './dataset';


// This is better set with CRAWLEE_LOG_LEVEL env var
// or a configuration option. This is just for show 😈
log.setLevel(log.LEVELS.DEBUG);

log.debug('Setting up crawler.');
const crawler = new PlaywrightCrawler({
  // Instead of the long requestHandler with
  // if clauses we provide a router instance.
  requestHandler: router,
  minConcurrency: 1,
  maxConcurrency: 15,
  requestHandlerTimeoutSecs: 600,
});

await dropDataset();

await crawler.run(['https://www.osta.ee/kategooria/raamatud-ajalehed']);

const timestamp = Date.now();
(await openDataset()).exportToCSV(`osta_${timestamp}`);
