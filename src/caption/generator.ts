import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../utils/logger';
import type { ShopeeProduct } from '../shopee/types';
import { CAPTION_SYSTEM_PROMPT, buildCaption, getRandomFallback } from './templates';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

async function generateCreativeLine(product: ShopeeProduct): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: config.openai.model,
      temperature: config.openai.temperature,
      max_tokens: 60,
      messages: [
        { role: 'system', content: CAPTION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Produto: ${product.productName}\nDesconto: ${product.discountPercent}%\nCategoria: geral`,
        },
      ],
    });

    const line = response.choices[0]?.message?.content?.trim();
    if (!line) throw new Error('Empty response from OpenAI');
    return line;
  } catch (error) {
    logger.warn({ error, product: product.productName }, 'OpenAI failed, using fallback');
    return getRandomFallback();
  }
}

export async function generateCaption(product: ShopeeProduct): Promise<string> {
  const creativeLine = await generateCreativeLine(product);
  return buildCaption(product, creativeLine);
}
