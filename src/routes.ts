import { createPlaywrightRouter } from 'crawlee';
import type { Page } from 'playwright';
import { openDataset } from './dataset';

const router = createPlaywrightRouter();

interface Item {
  shopName: string;
  shopUrl: string;
  categoryName: string;
  foodName: string;
  foodDescription: string;
  regularPriceEur: number;
  discountedPriceEur: number;
}

router.addHandler('DETAIL', async ({ page, log }) => {
  log.debug(`The page title is ${await page.title()}`);

  const shopUrl = page.url();
  const shopName =
    (await page.locator('[data-test-id="venue-hero.venue-title"]').textContent()) ?? ''; // Assuming there's a way to grab the shop name
  const itemsLocator = page.locator('[data-test-id="horizontal-item-card"]');

  try {
    await itemsLocator.first().waitFor({ timeout: 6000, state: 'attached' });
  } catch (error) {
    console.debug('Exception caught: Restaurant items not found.', error);
    return;
  }

  const categories = await page.locator('[data-test-id="MenuSection"]').all();
  console.log(`Found the following categories: ${categories.length}`);
  const result: Item[] = [];

  /* eslint-disable no-restricted-syntax, no-await-in-loop */
  for (const category of categories) {
    const categoryName =
      (await category.locator('[data-test-id="MenuSectionTitle"] h2').textContent()) ?? '';
    const items = await category.locator('[data-test-id="horizontal-item-card"]').all();

    for (const item of items) {
      const foodName =
        (await item.locator('[data-test-id="horizontal-item-card-header"]').textContent()) ?? '';
      const foodDescription =
        (await item.locator('[data-test-id="horizontal-item-card-header"] + p').textContent()) ??
        '';

      let regularPriceEur = 0;
      let discountedPriceEur = 0;
      const discountedPriceEurLocator = item.locator(
        '[data-test-id="horizontal-item-card-discounted-price"]',
      );
      const discountedPriceEurExists = (await discountedPriceEurLocator.count()) > 0;
      if (discountedPriceEurExists) {
        discountedPriceEur = parseFloat(
          ((await discountedPriceEurLocator.textContent()) ?? '')
            .replace('€', '')
            .replace(',', '.')
            .trim(),
        );
        console.log(`The discounted price is ${discountedPriceEur}`);
        regularPriceEur = parseFloat(
          (
            (await item
              .locator('[data-test-id="horizontal-item-card-original-price"]')
              .textContent()) ?? ''
          )
            .replace('€', '')
            .replace(',', '.')
            .trim(),
        );
      } else {
        regularPriceEur = parseFloat(
          ((await item.locator('[data-test-id="horizontal-item-card-price"]').textContent()) ?? '')
            .replace('€', '')
            .replace(',', '.')
            .trim(),
        );
      }

      result.push({
        shopName,
        shopUrl,
        categoryName,
        foodName,
        foodDescription,
        regularPriceEur,
        discountedPriceEur,
      });
    }
    console.log(`Finished parsing category: ${categoryName}`);
  }

  await (await openDataset()).pushData(result);
});

async function* scrollToBottom(page: Page) {
  await page.locator('[data-test-id*="venueCard"]').first().waitFor({ timeout: 10000 });
  let previousElementsCount = 0;
  let continueScroll = true;

  while (continueScroll) {
    const venueCards = await page.$$eval('[data-test-id*="venueCard"]', (elements: HTMLElement[]) =>
      elements.map((element: HTMLElement) => ({
        href: element.getAttribute('href'),
      })),
    );

    const currentElementsCount = venueCards.length;

    /* eslint-disable @typescript-eslint/no-loop-func */
    await page.evaluate(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      });
    });

    try {
      await page
        .locator(`[data-test-id*="venueCard"] >> nth=${currentElementsCount}`)
        .waitFor({ timeout: 10000, state: 'attached' });
    } catch (error) {
      console.debug(
        `Exception caught: No new elements found after ${currentElementsCount} elements. Stopping scroll.`,
        error,
      );
      continueScroll = false;
    }

    const newUrls = venueCards.slice(previousElementsCount).map((card: { href: any }) => card.href);
    yield newUrls; // Yield the batch of new URLs
    previousElementsCount = currentElementsCount;
  }
}

router.addDefaultHandler(async ({ request, enqueueLinks, page, log }) => {
  log.debug(`Enqueueing from page: ${request.url}`);
  const cookiesBtn = page.locator("[data-test-id='allow-button']");
  try {
    await cookiesBtn.waitFor({ timeout: 6000 });
    await cookiesBtn.click();
  } catch (error) {
    console.debug('Exception caught: No cookie button found.', error);
  }

  const linkCount = 0;
  for await (const urls of scrollToBottom(page)) {
    await enqueueLinks({
      urls,
      label: 'DETAIL',
    });
  }

  log.debug(`Found ${linkCount} number of links to restaurants.`);
});

export default router;
