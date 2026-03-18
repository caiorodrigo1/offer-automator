import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const config = {
  shopee: {
    appId: required('SHOPEE_APP_ID'),
    secret: required('SHOPEE_SECRET'),
    baseUrl: 'https://open-api.affiliate.shopee.com.br/graphql',
  },
  openai: {
    apiKey: required('OPENAI_API_KEY'),
    model: 'gpt-4o-mini',
    temperature: 0.9,
  },
  whatsapp: {
    groupName: required('WHATSAPP_GROUP_NAME'),
  },
  filters: {
    minDiscountPercent: Number(optional('MIN_DISCOUNT_PERCENT', '30')),
    minSales: Number(optional('MIN_SALES', '100')),
    minRating: Number(optional('MIN_RATING', '4.6')),
  },
  productsPerBatch: Number(optional('PRODUCTS_PER_BATCH', '6')),
  logLevel: optional('LOG_LEVEL', 'info'),
} as const;
