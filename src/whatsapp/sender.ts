import { MessageMedia } from 'whatsapp-web.js';
import { config } from '../config';
import { logger } from '../utils/logger';
import { randomDelay } from '../utils/helpers';
import { getWhatsAppClient, isWhatsAppReady } from './client';

let cachedGroupId: string | null = null;

async function getGroupChatId(): Promise<string> {
  if (cachedGroupId) return cachedGroupId;

  const client = getWhatsAppClient();
  const chats = await client.getChats();
  const group = chats.find(
    (chat) => chat.isGroup && chat.name === config.whatsapp.groupName,
  );

  if (!group) {
    throw new Error(`WhatsApp group "${config.whatsapp.groupName}" not found`);
  }

  cachedGroupId = group.id._serialized;
  logger.info({ groupName: group.name, groupId: cachedGroupId }, 'Group found');
  return cachedGroupId;
}

export async function sendProductMessage(
  imageUrl: string,
  caption: string,
): Promise<boolean> {
  if (!isWhatsAppReady()) {
    logger.error('WhatsApp not ready, skipping message');
    return false;
  }

  const client = getWhatsAppClient();
  const groupId = await getGroupChatId();

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const media = await MessageMedia.fromUrl(imageUrl, { unsafeMime: true });
      await client.sendMessage(groupId, media, { caption });
      logger.info('Message sent successfully');
      return true;
    } catch (error) {
      lastError = error as Error;
      logger.warn({ attempt, error }, 'Failed to send message, retrying...');
      if (attempt < 3) {
        await randomDelay(2000 * attempt, 5000 * attempt);
      }
    }
  }

  logger.error({ error: lastError }, 'Failed to send message after 3 attempts');
  return false;
}
