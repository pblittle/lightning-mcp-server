/**
 * @fileoverview Domain-specific error types for connection issues.
 *
 * Defines error classes for handling connection-related errors in a
 * consistent way throughout the application.
 */

/**
 * Base error for connection issues
 */
export class ConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectionError';
  }
}

/**
 * Error for authentication failures
 */
export class AuthenticationError extends ConnectionError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Error for connection timeout
 */
export class ConnectionTimeoutError extends ConnectionError {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectionTimeoutError';
  }
}

/**
 * Error for connection being closed
 */
export class ConnectionClosedError extends ConnectionError {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectionClosedError';
  }
}

/**
 * Error for issues with certificates or credentials
 */
export class CredentialError extends ConnectionError {
  constructor(message: string) {
    super(message);
    this.name = 'CredentialError';
  }
}
