import crypto from 'crypto';
import { config } from '../config';
import { logger } from '../utils/logger';
import { RateLimiter } from '../utils/rate-limiter';
import type { ShopeeProductOfferResponse } from './types';

const rateLimiter = new RateLimiter(2000, 3_600_000);

function generateSignature(payload: string, timestamp: number): string {
  const factor = config.shopee.appId + timestamp.toString() + payload + config.shopee.secret;
  return crypto.createHash('sha256').update(factor).digest('hex');
}

export async function shopeeGraphQL<T = ShopeeProductOfferResponse>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  await rateLimiter.acquire();

  const payload = JSON.stringify({ query, variables });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature(payload, timestamp);

  const response = await fetch(config.shopee.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `SHA256 Credential=${config.shopee.appId}, Timestamp=${timestamp}, Signature=${signature}`,
    },
    body: payload,
  });

  if (!response.ok) {
    const text = await response.text();
    logger.error({ status: response.status, body: text }, 'Shopee API HTTP error');
    throw new Error(`Shopee API returned ${response.status}: ${text}`);
  }

  const json = (await response.json()) as Record<string, unknown>;

  logger.debug({ responseBody: JSON.stringify(json).slice(0, 2000) }, 'Shopee API raw response');

  const errors = json.errors as Array<{ message: string; extensions?: { code: number } }> | undefined;
  if (errors && errors.length > 0) {
    const code = errors[0].extensions?.code ?? 'unknown';
    logger.error({ errors }, 'Shopee GraphQL error');
    throw new Error(`Shopee GraphQL error [${code}]: ${errors[0].message}`);
  }

  if (json.errCode && json.errCode !== 0) {
    logger.error({ errCode: json.errCode, errMsg: json.errMsg }, 'Shopee API error');
    throw new Error(`Shopee API error ${json.errCode}: ${json.errMsg}`);
  }

  return json as T;
}
