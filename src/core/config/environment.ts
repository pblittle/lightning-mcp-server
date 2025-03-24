/**
 * @fileoverview Environment variable loading and validation.
 *
 * This module loads environment variables and performs basic validation to ensure
 * required variables are present before the application starts.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import logger from '../logging/logger';

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = ['NODE_ENV'];

/**
 * Load environment variables from .env files
 * Priority: .env.${NODE_ENV}.local > .env.${NODE_ENV} > .env.local > .env
 */
export function loadEnvironment(): void {
  try {
    // Determine current environment
    const nodeEnv = process.env.NODE_ENV || 'development';

    // Define paths to env files in order of priority
    const envPaths = [
      path.resolve(process.cwd(), `.env.${nodeEnv}.local`),
      path.resolve(process.cwd(), `.env.${nodeEnv}`),
      path.resolve(process.cwd(), '.env.local'),
      path.resolve(process.cwd(), '.env'),
    ];

    // Load environment variables from .env files
    for (const envPath of envPaths) {
      const result = dotenv.config({ path: envPath });
      if (!result.error) {
        logger.debug(`Loaded environment variables from ${envPath}`);
      }
    }

    // Set defaults for common variables if not already set
    if (!process.env.PORT) {
      process.env.PORT = '3000';
    }

    // Validate required environment variables
    const missingVars = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    logger.info(`Environment loaded: ${nodeEnv}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to load environment variables: ${message}`);
    throw error;
  }
}
