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
      logger.info('QR code received, scan with WhatsApp (you have ~20s per QR):');
      qrcode.generate(qr, { small: true });
      console.log('\n^^^ Scan this QR code with WhatsApp ^^^\n');
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

    client.on('loading_screen', (percent, message) => {
      logger.info({ percent, message }, 'WhatsApp loading screen');
    });

    (client as any).on('change_state', (state: string) => {
      logger.info({ state }, 'WhatsApp state changed');
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

/**
 * The 'ready' event fires before the WhatsApp Web store is fully injected, so
 * the first getChats() calls fail with an obfuscated puppeteer error. Poll until
 * a real store call succeeds.
 */
async function waitForStore(wpp: Client, timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt++;
    try {
      await wpp.getChats();
      logger.info({ attempt }, 'WhatsApp store ready');
      return;
    } catch (error) {
      logger.debug({ attempt, error }, 'Store not ready yet, waiting...');
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  throw new Error('WhatsApp store never became usable (2min)');
}

export async function initWhatsApp(): Promise<Client> {
  const wpp = getWhatsAppClient();
  await wpp.initialize();

  // Wait for ready state
  if (!isReady) {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('WhatsApp init timeout (3min)')), 180_000);
      wpp.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  await waitForStore(wpp);

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
