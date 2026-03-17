import { logger } from './utils/logger';
import { initWhatsApp, destroyWhatsApp } from './whatsapp/client';
import { getDatabase, closeDatabase } from './storage/database';
import { startScheduler } from './scheduler';
import { runBatch } from './pipeline/orchestrator';

const isRunNow = process.argv.includes('--run-now');

async function main(): Promise<void> {
  logger.info('Offer Automator starting...');

  // Initialize database
  getDatabase();

  // Initialize WhatsApp (shows QR code on first run)
  logger.info('Initializing WhatsApp...');
  await initWhatsApp();

  if (isRunNow) {
    logger.info('Running immediate batch (--run-now)');
    await runBatch();
    logger.info('Batch complete, shutting down');
    await shutdown();
    return;
  }

  // Start scheduled posting
  startScheduler();
  logger.info('Bot is running. Press Ctrl+C to stop.');
}

async function shutdown(): Promise<void> {
  logger.info('Shutting down...');
  await destroyWhatsApp();
  closeDatabase();
  logger.info('Goodbye!');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((error) => {
  logger.fatal({ error }, 'Fatal error');
  process.exit(1);
});
