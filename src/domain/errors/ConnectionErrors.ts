/**
 * @fileoverview Domain-specific error types for connection issues.
 *
 * Defines error classes for handling connection-related errors in a
 * consistent way throughout the application.
 *
 * DEPRECATED: Use LightningErrors.ts classes instead for new code.
 * This file is maintained for backward compatibility.
 */

// Re-export from LightningErrors
export {
  ConnectionError,
  AuthenticationError,
  ConnectionTimeoutError,
  CredentialError,
} from './LightningErrors';
