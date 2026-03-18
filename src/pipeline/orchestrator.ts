import { config } from '../config';
import { logger } from '../utils/logger';
import { randomDelay } from '../utils/helpers';
import { fetchFilteredProducts } from '../shopee/service';
import { generateCaption } from '../caption/generator';
import { sendProductMessage } from '../whatsapp/sender';
import { markProductSent } from '../storage/repository';
import type { ShopeeProduct } from '../shopee/types';

const MAX_RETRIES = 3;

function normalizeProductName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function trySendProduct(product: ShopeeProduct): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info({ product: product.productName, attempt }, 'Processing product');

      const caption = await generateCaption(product);
      const sent = await sendProductMessage(product.imageUrl, caption);

      if (sent) {
        markProductSent({
          item_id: product.itemId,
          product_name: product.productName,
          price_cents: product.priceCents,
          discount_percent: product.discountPercent,
          affiliate_link: product.affiliateLink,
        });
        logger.info({ product: product.productName }, 'Product sent and recorded');
        return true;
      }

      logger.warn({ product: product.productName, attempt }, 'Send returned false, retrying');
    } catch (error) {
      logger.warn({ error, product: product.productName, attempt }, 'Failed to process product, retrying');
    }

    if (attempt < MAX_RETRIES) {
      await randomDelay(2000, 4000);
    }
  }

  logger.error({ product: product.productName }, 'Failed after all retries');
  return false;
}

export async function runBatch(): Promise<void> {
  const batchSize = config.productsPerBatch;
  logger.info({ batchSize }, 'Starting batch');

  let products;
  try {
    products = await fetchFilteredProducts(batchSize);
  } catch (error) {
    logger.error({ error }, 'Failed to fetch products, skipping batch');
    return;
  }

  if (products.length === 0) {
    logger.warn('No products passed filters, skipping batch');
    return;
  }

  let sentCount = 0;
  const sentNames = new Set<string>();

  for (const product of products) {
    sentNames.add(normalizeProductName(product.productName));
  }

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const success = await trySendProduct(product);

    if (success) {
      sentCount++;
    } else {
      // Failed after all retries — try to fetch a replacement
      logger.info('Searching for replacement product');
      try {
        const replacements = await fetchFilteredProducts(1, sentNames);
        if (replacements.length > 0) {
          const replacement = replacements[0];
          sentNames.add(normalizeProductName(replacement.productName));
          logger.info({ product: replacement.productName }, 'Found replacement product');

          const replacementSuccess = await trySendProduct(replacement);
          if (replacementSuccess) {
            sentCount++;
          }
        } else {
          logger.warn('No replacement product available');
        }
      } catch (error) {
        logger.error({ error }, 'Failed to fetch replacement product');
      }
    }

    // Delay between messages to avoid WhatsApp ban
    if (i < products.length - 1 || sentCount < batchSize) {
      await randomDelay(3000, 5000);
    }
  }

  logger.info({ sentCount, total: batchSize }, 'Batch complete');
}
