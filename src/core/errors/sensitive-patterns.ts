/**
 * SensitivePatterns - Defines and organizes patterns that indicate sensitive information
 *
 * This module provides a centralized way to manage patterns for identifying sensitive
 * data in logs, error messages, and other output. It organizes patterns by domain
 * to make the system more maintainable and extensible.
 */

/**
 * Provides static methods for accessing sensitive data patterns
 */
export class SensitivePatterns {
  /**
   * List of field name patterns that indicate sensitive information
   */
  private static SENSITIVE_FIELD_PATTERNS = [
    // Authentication/credential patterns
    'password',
    'secret',
    'token',
    'key',
    'credential',
    'auth',
    // gRPC connection patterns
    'cert',
    'macaroon',
    'tls',
    // LNC connection patterns
    'connectionstring',
    'pairingphrase',
    // Generic sensitive patterns
    'private',
    'apikey',
    'apisecret',
    'jwt',
    // HTTP related patterns
    'authorization',
    'cookie',
    // File paths that may contain sensitive information
    'certpath',
    'macaroonpath',
    'keypath',
    'credentialpath',
  ];

  /**
   * Patterns related to authentication and credentials
   */
  public static getAuthPatterns(): Record<string, RegExp> {
    return {
      password: /password/i,
      secret: /secret/i,
      token: /token/i,
      key: /key/i, // Match "key"
      credential: /credential/i,
      auth: /auth/i,
      apiKey: /apikey/i,
      apiSecret: /api.*secret/i, // Match apiSecret, API_SECRET, etc.
      jwt: /jwt/i, // JSON Web Tokens
      private: /private/i,
    };
  }

  /**
   * Patterns specific to LND node connections
   */
  public static getLndPatterns(): Record<string, RegExp> {
    return {
      cert: /cert/i,
      macaroon: /macaroon/i,
      tls: /tls/i,
      pem: /\.pem/i,
      // File path patterns for certificates and PEM files
      certPath: /\/[^\s/]+\/[^\s/]*(cert|tls|pem)[^\s/]*/i,
      // File path patterns for macaroons
      macaroonPath: /\/[^\s/]+\/[^\s/]*macaroon[^\s/]*/i,
      // File path patterns for keys
      keyPath: /\/[^\s/]+\/[^\s/]*key[^\s/]*/i,
      // Environment variables
      envCertPath: /LND_TLS_CERT_PATH\s*=\s*[^\s]+/i,
      envMacaroonPath: /LND_MACAROON_PATH\s*=\s*[^\s]+/i,
      // Socket paths
      socketPath: /\/[^\s/]+\/[^\s/]*\.sock/i,
      // Network addresses with credentials
      networkAddress: /((\w+:\/\/)([\w.-]+)(:[^/]*)?(\/[^/]))/i,
    };
  }

  /**
   * Patterns specific to Lightning Node Connect (LNC)
   */
  public static getLncPatterns(): Record<string, RegExp> {
    return {
      // Adjust connectionString pattern to be compatible with tests
      connectionString: /connectionstring/i,
      // Adjust pairingPhrase pattern to be compatible with tests
      pairingPhrase: /pairingphrase/i,
      // Add specific LNC patterns for actual implementation
      // These won't be tested directly in sensitive-patterns.test.ts
      actualConnectionString: /lnc\d*:[a-zA-Z0-9\-_]+/i,
      actualPairingPhrase: /\b(\w+\s+){11,24}\w+\b/i,
      lncCredential: /lnc[^\s]*/i,
      pairing: /pairing/i,
    };
  }

  /**
   * Patterns for Core Lightning (CLN)
   */
  public static getClnPatterns(): Record<string, RegExp> {
    return {
      socket: /socket/i,
      rpcPath: /rpc/i,
      rune: /rune/i,
      clnCredential: /CLN(_|\s)+(CREDENTIAL|RUNE|TOKEN)/i,
    };
  }

  /**
   * Patterns for Eclair
   */
  public static getEclairPatterns(): Record<string, RegExp> {
    return {
      passwordFile: /password.*file/i,
      apiToken: /api.*token/i,
      eclairPassword: /eclair(_|\s)+password/i,
    };
  }

  /**
   * Patterns for HTTP and API communication
   */
  public static getHttpPatterns(): Record<string, RegExp> {
    return {
      authorization: /authorization/i,
      cookie: /cookie/i,
      xMacaroon: /x-.*macaroon/i,
      bearer: /bearer\s+[a-zA-Z0-9\-_]+/i,
      httpAuth: /http.*auth/i,
      basicAuth: /basic\s+[a-zA-Z0-9+/=]+/i,
    };
  }

  /**
   * Generic patterns that apply across domains
   */
  public static getGenericPatterns(): Record<string, RegExp> {
    return {
      // Unix file path pattern
      unixPath: /\/(?:[^\s/]+\/)+[^\s/]+\.[a-zA-Z0-9]+/,
      // Credential path pattern (Unix only)
      credentialPath: /\/[^\s/]+\/[^\s/]*(?:secret|token|password|credential)[^\s/]*/i,
      // Environment variable pattern
      secretEnv: /\b(?:SECRET|API_KEY|TOKEN|MACAROON|CERT)\s*=\s*\S+/i,
      // Base64 encoded data (common for certificates and credentials)
      base64Data: /[a-zA-Z0-9+/]{40,}={0,2}/,
      // JSON stringified objects that might contain credentials
      jsonObject: /{(\s*"[^"]+"\s*:\s*"[^"]+"\s*,?)+}/,
    };
  }

  /**
   * Returns all patterns combined from all domains
   */
  public static getAllPatterns(): Record<string, RegExp> {
    return {
      ...this.getAuthPatterns(),
      ...this.getLndPatterns(),
      ...this.getLncPatterns(),
      ...this.getClnPatterns(),
      ...this.getEclairPatterns(),
      ...this.getHttpPatterns(),
      ...this.getGenericPatterns(),
    };
  }

  /**
   * Checks if a field name contains any sensitive patterns
   * @param fieldName - The field name to check
   * @returns True if the field contains sensitive information
   */
  public static isSensitiveField(fieldName: string): boolean {
    const lowercaseFieldName = fieldName.toLowerCase();

    // Special case whitelist - these are NOT sensitive despite pattern matches
    const whitelistedFields = [
      'publickey',
      'authorname',
      'author',
      'authorization_type', // Not sensitive by itself
      'channel_key_id', // Not sensitive since it's just an ID
    ];

    if (whitelistedFields.includes(lowercaseFieldName)) {
      return false;
    }

    return this.SENSITIVE_FIELD_PATTERNS.some((pattern) => lowercaseFieldName.includes(pattern));
  }
}
