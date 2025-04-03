/**
 * Error handling and sanitization module
 *
 * This module exports all the components related to error handling
 * and sanitization of sensitive information.
 */

// Export the SensitivePatterns class
export { SensitivePatterns } from './sensitive-patterns';

// Export the sanitization functions
export {
  sanitizeConfig,
  sanitizeErrorMessage,
  sanitizeError,
  sanitizeForLogging,
  isSensitiveField,
} from './sanitize';

// Export the BaseError class and related types
export { BaseError, type ErrorOptions } from './base-error';

// Export redaction configuration
export { REDACT_PATHS } from './redaction-config';
