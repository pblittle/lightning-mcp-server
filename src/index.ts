import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { setupLndConnection } from './services/lnd';
import { balanceRouter } from './routes/balance';
import { mcpRouter } from './routes/mcp';
import logger from './utils/logger';

// Load environment variables
dotenv.config();
logger.info('Environment variables loaded');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
logger.info('Express middleware configured');

// Initialize LND connection
try {
  setupLndConnection();
  logger.info('LND connection initialized successfully');
} catch (error) {
  logger.fatal({ error }, 'Failed to initialize LND connection');
  process.exit(1);
}

// Routes
app.use('/api/balance', balanceRouter);
app.use('/api/mcp', mcpRouter);
logger.info('API routes registered');

// Request logging middleware
app.use((req, res, next) => {
  logger.info(
    {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent') || 'unknown',
    },
    'Incoming request'
  );
  next();
});

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  logger.debug('Health check requested');
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ error: err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  logger.info(`MCP-LND server listening on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled promise rejection');
  process.exit(1);
});
