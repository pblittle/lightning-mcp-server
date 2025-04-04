/**
 * @fileoverview Lightning-specific error types
 *
 * Defines error classes for handling Lightning Network related errors in a
 * consistent way throughout the application. These error classes extend
 * the BaseError class and provide specific error codes and MCP mappings.
 */

import { BaseError, ErrorOptions } from '../../core/errors/base-error';

/**
 * Enum of Lightning error codes for consistent error classification
 */
export enum LightningErrorCode {
  // Connection errors
  CONNECTION_FAILED = 'lightning.connection.failed',
  AUTHENTICATION_FAILED = 'lightning.connection.auth_failed',
  CONNECTION_TIMEOUT = 'lightning.connection.timeout',
  CONNECTION_CLOSED = 'lightning.connection.closed',
  INVALID_CREDENTIALS = 'lightning.connection.invalid_credentials',

  // Query errors
  QUERY_FAILED = 'lightning.query.failed',
  INVALID_QUERY = 'lightning.query.invalid',
  UNSUPPORTED_QUERY = 'lightning.query.unsupported',

  // Channel errors
  CHANNEL_NOT_FOUND = 'lightning.channel.not_found',
  CHANNEL_OPERATION_FAILED = 'lightning.channel.operation_failed',

  // Node errors
  NODE_UNAVAILABLE = 'lightning.node.unavailable',

  // Generic errors
  INTERNAL_ERROR = 'lightning.internal_error',
  UNKNOWN_ERROR = 'lightning.unknown_error',
}

/**
 * Base class for all Lightning-specific errors
 */
export class LightningError extends BaseError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      code: options.code || LightningErrorCode.UNKNOWN_ERROR,
      metadata: options.metadata,
      cause: options.cause,
    });
  }

  /**
   * Maps Lightning errors to MCP error responses
   */
  public toMcpError(): { code: string; message: string; details?: any } {
    // Map Lightning error codes to MCP error codes
    let mcpCode: string;

    if (this.code?.includes('connection')) {
      mcpCode = 'PROVIDER_CONNECTION_ERROR';
    } else if (this.code?.includes('query')) {
      mcpCode = 'PROVIDER_QUERY_ERROR';
    } else if (this.code?.includes('channel')) {
      mcpCode = 'RESOURCE_NOT_FOUND';
    } else if (this.code === LightningErrorCode.NODE_UNAVAILABLE) {
      mcpCode = 'SERVICE_UNAVAILABLE';
    } else {
      mcpCode = 'INTERNAL_SERVER_ERROR';
    }

    return {
      code: mcpCode,
      message: this.message,
      details: {
        originalCode: this.code,
        ...this.metadata,
      },
    };
  }
}

/**
 * Error for connection issues to Lightning nodes
 */
export class ConnectionError extends LightningError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      code: options.code || LightningErrorCode.CONNECTION_FAILED,
      metadata: options.metadata,
      cause: options.cause,
    });
  }
}

/**
 * Error for authentication failures
 */
export class AuthenticationError extends ConnectionError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      code: options.code || LightningErrorCode.AUTHENTICATION_FAILED,
      metadata: options.metadata,
      cause: options.cause,
    });
  }
}

/**
 * Error for connection timeout
 */
export class ConnectionTimeoutError extends ConnectionError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      code: options.code || LightningErrorCode.CONNECTION_TIMEOUT,
      metadata: options.metadata,
      cause: options.cause,
    });
  }
}

/**
 * Error for issues with certificates or credentials
 */
export class CredentialError extends ConnectionError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      code: options.code || LightningErrorCode.INVALID_CREDENTIALS,
      metadata: options.metadata,
      cause: options.cause,
    });
  }
}

/**
 * Error for query processing issues
 */
export class QueryError extends LightningError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      code: options.code || LightningErrorCode.QUERY_FAILED,
      metadata: options.metadata,
      cause: options.cause,
    });
  }
}

/**
 * Error for channel-related issues
 */
export class ChannelError extends LightningError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      code: options.code || LightningErrorCode.CHANNEL_NOT_FOUND,
      metadata: options.metadata,
      cause: options.cause,
    });
  }
}
