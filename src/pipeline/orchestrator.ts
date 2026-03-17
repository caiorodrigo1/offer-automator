import { config } from '../config';
import { logger } from '../utils/logger';
import { randomDelay } from '../utils/helpers';
import { fetchFilteredProducts } from '../shopee/service';
import { generateCaption } from '../caption/generator';
import { sendProductMessage } from '../whatsapp/sender';
import { markProductSent } from '../storage/repository';

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

  for (const product of products) {
    try {
      logger.info({ product: product.productName }, 'Processing product');

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
        sentCount++;
        logger.info({ product: product.productName }, 'Product sent and recorded');
      }

      // Delay between messages to avoid WhatsApp ban
      if (product !== products[products.length - 1]) {
        await randomDelay(3000, 5000);
      }
    } catch (error) {
      logger.error({ error, product: product.productName }, 'Failed to process product, continuing');
    }
  }

  logger.info({ sentCount, total: products.length }, 'Batch complete');
}
