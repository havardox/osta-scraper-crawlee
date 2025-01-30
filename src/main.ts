import { PlaywrightCrawler, log } from 'crawlee';

import router from './routes';
import db from './db';

// // This is better set with CRAWLEE_LOG_LEVEL env var
// // or a configuration option. This is just for show 😈
log.setLevel(log.LEVELS.DEBUG);

log.debug('Setting up crawler.');
const crawler = new PlaywrightCrawler({
  // Instead of the long requestHandler with
  // if clauses we provide a router instance.
  requestHandler: router,
  minConcurrency: 50,
  maxConcurrency: 50,
  requestHandlerTimeoutSecs: 10,
});

await crawler.run([
  'https://www.osta.ee/kategooria/raamatud-ajalehed?pagesize=60&orderby=createdd',
]);

const client = await db.connect();

log.info('Deleting duplicates...');

// Remove duplicate rows based on the `url` column, keeping the first
const result = await client.query(`
    DELETE FROM records
    WHERE id NOT IN (
      SELECT MIN(id)
      FROM records
      GROUP BY url
    )
`);

log.info(`Duplicates removed successfully. Rows deleted: ${result.rowCount}`);
await db.disconnect();
