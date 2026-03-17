import cron from 'node-cron';
import { logger } from './utils/logger';
import { runBatch } from './pipeline/orchestrator';
import { cleanOldProducts } from './storage/repository';

export function startScheduler(): void {
  // 10:00, 16:00, 20:00 BRT (America/Sao_Paulo)
  cron.schedule('0 10,16,20 * * *', async () => {
    logger.info('Scheduled batch starting');
    await runBatch();
  }, { timezone: 'America/Sao_Paulo' });

  // Clean old products at 3:00 AM BRT
  cron.schedule('0 3 * * *', () => {
    const removed = cleanOldProducts(30);
    logger.info({ removed }, 'Old products cleaned');
  }, { timezone: 'America/Sao_Paulo' });

  logger.info('Scheduler started: batches at 10h, 16h, 20h BRT | cleanup at 3h BRT');
}
