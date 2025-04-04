/**
 * Redaction configuration for the logger
 */

// Define paths to redact in logs
export const REDACT_PATHS = [
  // Authentication/credential patterns
  'password',
  'secret',
  'token',
  'key',
  'credential',
  'auth',
  'apikey',
  'private',
  'apiSecret',
  'jwt',
  // gRPC connection patterns
  'cert',
  'macaroon',
  'tls',
  // LNC connection patterns
  'connectionString',
  'pairingPhrase',
  'connection.details.connectionString',
  'connection.details.pairingPhrase',
  'connections[*].config.connectionString',
  'settings.backup.lncConfig.connectionString',
  // HTTP patterns - use headers object syntax for HTTP headers
  'headers.authorization',
  'headers.cookie',
  'headers.macaroon',
  // File paths that might contain credentials
  'certPath',
  'macaroonPath',
  'keyPath',
  'credentialPath',
  // Enhanced redaction for nested objects
  'details.auth',
  'connection.secret',
  'config.key',
];
