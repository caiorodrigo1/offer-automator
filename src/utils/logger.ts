import pino from 'pino';
import { config } from '../config';

export const logger = pino({
  level: config.logLevel,
  serializers: {
    error: pino.stdSerializers.err,
    err: pino.stdSerializers.err,
  },
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
});
