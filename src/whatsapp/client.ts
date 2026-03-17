import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { logger } from '../utils/logger';

let client: Client | null = null;
let isReady = false;

export function getWhatsAppClient(): Client {
  if (!client) {
    client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    client.on('qr', (qr) => {
      logger.info('QR code received, scan with WhatsApp:');
      qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
      isReady = true;
      logger.info('WhatsApp client is ready');
    });

    client.on('authenticated', () => {
      logger.info('WhatsApp authenticated');
    });

    client.on('auth_failure', (msg) => {
      logger.error({ msg }, 'WhatsApp authentication failed');
    });

    client.on('disconnected', (reason) => {
      isReady = false;
      logger.warn({ reason }, 'WhatsApp disconnected, reconnecting in 5s...');
      setTimeout(() => {
        client?.initialize().catch((err) => {
          logger.error({ err }, 'Failed to reconnect WhatsApp');
        });
      }, 5000);
    });
  }

  return client;
}

export async function initWhatsApp(): Promise<Client> {
  const wpp = getWhatsAppClient();
  await wpp.initialize();

  // Wait for ready state
  if (!isReady) {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('WhatsApp init timeout (60s)')), 60_000);
      wpp.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  return wpp;
}

export function isWhatsAppReady(): boolean {
  return isReady;
}

export async function destroyWhatsApp(): Promise<void> {
  if (client) {
    await client.destroy();
    client = null;
    isReady = false;
    logger.info('WhatsApp client destroyed');
  }
}
