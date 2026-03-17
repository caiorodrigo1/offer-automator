import type { ShopeeProduct } from '../shopee/types';
import { formatBRL } from '../utils/helpers';

export const CAPTION_SYSTEM_PROMPT = `Voce e um copywriter especialista em ofertas e promocoes no Brasil.
Gere UMA frase curta, criativa e chamativa para uma oferta de produto.
A frase deve criar urgencia e entusiasmo. Use emojis com moderacao (1-2 no maximo).
Responda APENAS com a frase, sem aspas, sem explicacao.
Exemplos de tom:
- "Corram que ta acabando!"
- "Esse preco nao e real, gente!"
- "Achei e trouxe pra voces!"`;

export function buildCaption(product: ShopeeProduct, creativeLine: string): string {
  const originalPrice = formatBRL(product.originalPriceCents);
  const salePrice = formatBRL(product.priceCents);

  return [
    creativeLine,
    '',
    `*${product.productName}*`,
    '',
    `~De: ${originalPrice}~`,
    `*Preco da Oferta: ${salePrice}*`,
    '',
    product.affiliateLink,
  ].join('\n');
}

export const FALLBACK_LINES = [
  'Oferta imperdivel!',
  'Corre que ta barato!',
  'Aproveita antes que acabe!',
  'Preco de ocasiao!',
  'Nao vai achar mais barato!',
];

export function getRandomFallback(): string {
  return FALLBACK_LINES[Math.floor(Math.random() * FALLBACK_LINES.length)];
}
