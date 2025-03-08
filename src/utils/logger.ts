import pino from 'pino';

/**
 * Logger configuration
 */
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
  level: process.env.LOG_LEVEL || 'info',
});

export default logger;
