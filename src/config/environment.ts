/**
 * Loads environment variables from .env files based on the current NODE_ENV
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger';

/**
 * Loads environment variables from .env files
 * Prioritizes environment-specific files over default .env
 */
export function loadEnvironment(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Define the files to look for in order of priority
  const files = [
    path.resolve(process.cwd(), `.env.${nodeEnv}.local`),
    path.resolve(process.cwd(), `.env.${nodeEnv}`),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
  ];

  let loaded = false;

  // Try to load each file in order
  for (const file of files) {
    if (fs.existsSync(file)) {
      try {
        const result = dotenv.config({ path: file });

        // Check if result exists and has an error property
        if (result && result.error) {
          logger.warn(`Error loading environment file ${file}: ${result.error.message}`);
        } else {
          logger.info(`Loaded environment from ${file} (${nodeEnv} mode)`);
          loaded = true;
        }
      } catch (error) {
        logger.warn(
          `Exception when loading environment file ${file}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  if (!loaded) {
    logger.warn(`No environment files found. Using default environment variables.`);
  }

  // Validate required environment variables
  validateRequiredEnvVars();
}

/**
 * Validates that all required environment variables are set
 */
function validateRequiredEnvVars(): void {
  // Base required variables for all environments
  const requiredVars: string[] = ['NODE_ENV', 'PORT', 'LOG_LEVEL'];

  // Additional variables required when not in mock mode
  if (process.env.USE_MOCK_LND !== 'true') {
    requiredVars.push('LND_TLS_CERT_PATH', 'LND_MACAROON_PATH', 'LND_HOST', 'LND_PORT');
  }

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    logger.warn(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}
