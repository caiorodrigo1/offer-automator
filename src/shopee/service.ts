import { config } from '../config';
import { logger } from '../utils/logger';
import { wasProductSent } from '../storage/repository';
import { shopeeGraphQL } from './client';
import { PRODUCT_OFFER_V2_QUERY } from './queries';
import type { ShopeeProduct, ShopeeProductOfferResponse, ShopeeProductOfferNode } from './types';

function nodeToProduct(node: ShopeeProductOfferNode): ShopeeProduct {
  const discountPercent = Number(node.priceDiscountRate) || 0;
  const priceMin = Number(node.priceMin);
  return {
    itemId: String(node.itemId),
    productName: node.productName,
    imageUrl: node.imageUrl,
    priceCents: Math.round(priceMin * 100),
    originalPriceCents: discountPercent > 0
      ? Math.round((priceMin / (1 - discountPercent / 100)) * 100)
      : Math.round(priceMin * 100),
    discountPercent,
    salesCount: Number(node.sales),
    rating: Number(node.ratingStar),
    shopName: node.shopName,
    affiliateLink: node.offerLink || node.productLink,
    commissionRate: Number(node.commissionRate),
  };
}

function passesFilters(product: ShopeeProduct): boolean {
  const { minDiscountPercent, minSales, minRating } = config.filters;

  if (product.discountPercent < minDiscountPercent) return false;
  if (product.salesCount < minSales) return false;
  if (product.rating < minRating) return false;

  return true;
}

export async function fetchFilteredProducts(count: number): Promise<ShopeeProduct[]> {
  const results: ShopeeProduct[] = [];
  let page = 1;
  const limit = 50;
  const maxPages = 5;

  while (results.length < count && page <= maxPages) {
    logger.info({ page }, 'Fetching Shopee products');

    try {
      const response = await shopeeGraphQL<ShopeeProductOfferResponse>(
        PRODUCT_OFFER_V2_QUERY,
        { page, limit, sortType: 2 },
      );

      const nodes = response.data?.productOfferV2?.nodes;
      if (!nodes || nodes.length === 0) {
        logger.info('No more products available');
        break;
      }

      for (const node of nodes) {
        if (results.length >= count) break;

        const product = nodeToProduct(node);

        if (!passesFilters(product)) continue;
        if (wasProductSent(product.itemId)) continue;

        results.push(product);
      }

      const hasNext = response.data?.productOfferV2?.pageInfo?.hasNextPage;
      if (!hasNext) break;

      page++;
    } catch (error) {
      logger.error({ error, page }, 'Failed to fetch products from Shopee');
      break;
    }
  }

  logger.info({ count: results.length }, 'Filtered products ready');
  return results;
}
