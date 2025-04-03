/**
 * Redaction configuration for error sanitization
 */

// Define paths to redact in errors
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
  'pairing',
  'lncCredential',
  // HTTP patterns
  'authorization',
  'cookie',
  'x-lnd-macaroon',
  // File paths that might contain credentials
  'certPath',
  'macaroonPath',
  'keyPath',
  'credentialPath',
  'socketPath',
  // Socket related patterns
  'socket',
  'rpcPath',
];
