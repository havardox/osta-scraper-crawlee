import { createPlaywrightRouter } from 'crawlee';

import cleanInnerHtml from './utils';
import db from './db';

const router = createPlaywrightRouter();

const client = await db.connect();

interface OstaItem {
  url: string;
  title: string;
  description: string;
  category: number | null;
}

router.addHandler('DETAIL', async ({ page, log }) => {
  const item: OstaItem = {
    url: page.url(),
    title: '',
    description: '',
    category: null,
  };

  const title = await page.locator('.header-title').first().textContent();
  if (title) {
    item.title = title.trim();
    log.debug(`Title: ${item.title}`);
  } else {
    log.error('Title not found on page.');
  }

  const scriptContent = await page
    .locator('script[type="text/javascript"]')
    .evaluateAll((elements) => {
      const script = elements.find((el) => el.textContent && el.textContent.includes('dataString'));
      return script?.textContent || null;
    });

  if (scriptContent) {
    log.debug(`Script content found: ${scriptContent.trim()}`);

    const match = scriptContent.match(/"category_id",\s*value:\s*"(\d+)"/);
    if (match) {
      const mainCategoryId = match[1];
      item.category = Number.parseInt(mainCategoryId, 10);
      log.debug(`Extracted category_id: ${mainCategoryId.trim()}`);
    } else {
      log.debug('category_id not found in the script content.');
    }
  } else {
    log.debug('No matching script tag found.');
  }

  const description = await page.locator('.offer-details__description').first().innerHTML();
  const cleanedDescription = cleanInnerHtml(description);
  item.description = cleanedDescription;

  await client.query(
    `INSERT INTO records (url, title, description, category)
     VALUES ($1, $2, $3, $4)`,
    [item.url, item.title, item.description, item.category],
  );

  log.info(`Saved item: ${JSON.stringify(item)}`);
});

router.addDefaultHandler(async ({ page, log, enqueueLinks }) => {
  const bookUrls = await page.$$eval('.offer-thumb .offer-thumb__link', (elements: HTMLElement[]) =>
    elements
      .map((element) => element.getAttribute('href'))
      .filter((href): href is string => Boolean(href))
      .map((href) => `https://www.osta.ee/${href}`),
  );

  log.info(`Found ${bookUrls.length} book URLs to enqueue.`);

  await enqueueLinks({
    urls: bookUrls,
    label: 'DETAIL',
  });

  const pageUrl = await page.$eval('.next', (element: HTMLElement) => {
    const href = element.getAttribute('href');
    const baseUrl = `https://www.osta.ee/${href}`;
    const url = new URL(baseUrl);

    const params = url.searchParams;
    params.set('pagesize', '60');
    params.set('orderby', 'createdd');

    url.search = params.toString();
    return url.toString();
  });

  await enqueueLinks({
    urls: [pageUrl],
  });
});

export default router;
