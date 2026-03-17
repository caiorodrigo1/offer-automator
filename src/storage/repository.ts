import { getDatabase } from './database';

export interface SentProduct {
  item_id: string;
  product_name: string;
  price_cents: number;
  discount_percent: number;
  affiliate_link: string;
  sent_at: string;
}

export function wasProductSent(itemId: string): boolean {
  const db = getDatabase();
  const row = db.prepare('SELECT 1 FROM sent_products WHERE item_id = ?').get(itemId);
  return !!row;
}

export function markProductSent(product: Omit<SentProduct, 'sent_at'>): void {
  const db = getDatabase();
  db.prepare(`
    INSERT OR IGNORE INTO sent_products (item_id, product_name, price_cents, discount_percent, affiliate_link)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    product.item_id,
    product.product_name,
    product.price_cents,
    product.discount_percent,
    product.affiliate_link,
  );
}

export function cleanOldProducts(daysOld: number = 30): number {
  const db = getDatabase();
  const result = db.prepare(
    `DELETE FROM sent_products WHERE sent_at < datetime('now', ?)`,
  ).run(`-${daysOld} days`);
  return result.changes;
}

export function getSentProductCount(): number {
  const db = getDatabase();
  const row = db.prepare('SELECT COUNT(*) as count FROM sent_products').get() as { count: number };
  return row.count;
}
