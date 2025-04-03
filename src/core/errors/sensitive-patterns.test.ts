/**
 * Unit tests for SensitivePatterns class
 */

import { SensitivePatterns } from './sensitive-patterns';

describe('SensitivePatterns', () => {
  describe('getAuthPatterns', () => {
    it('should return patterns for authentication fields', () => {
      const patterns = SensitivePatterns.getAuthPatterns();

      // Check for key patterns
      expect(patterns).toHaveProperty('password');
      expect(patterns).toHaveProperty('secret');
      expect(patterns).toHaveProperty('token');
      expect(patterns).toHaveProperty('credential');

      // Test a pattern
      expect('myPassword').toMatch(patterns.password);
      expect('USER_PASSWORD').toMatch(patterns.password);
    });

    it('should handle publickey specially', () => {
      // PublicKey handling is now done in isSensitiveField instead of regex
      expect(SensitivePatterns.isSensitiveField('publickey')).toBe(false);
      expect(SensitivePatterns.isSensitiveField('mykey')).toBe(true);
    });
  });

  describe('getLndPatterns', () => {
    it('should return patterns for LND configuration', () => {
      const patterns = SensitivePatterns.getLndPatterns();

      // Check for expected patterns
      expect(patterns).toHaveProperty('cert');
      expect(patterns).toHaveProperty('macaroon');
      expect(patterns).toHaveProperty('tls');
      expect(patterns).toHaveProperty('certPath');
      expect(patterns).toHaveProperty('macaroonPath');

      // Test file path patterns
      expect('/home/user/lnd/tls.cert').toMatch(patterns.certPath);

      // Test environment variable patterns
      expect('LND_TLS_CERT_PATH=/path/to/cert').toMatch(patterns.envCertPath);
      expect('LND_MACAROON_PATH = /path/to/macaroon').toMatch(patterns.envMacaroonPath);
    });

    it('should match PEM file paths', () => {
      const patterns = SensitivePatterns.getLndPatterns();

      expect('/home/user/lnd/tls.pem').toMatch(patterns.certPath);
    });
  });

  describe('getLncPatterns', () => {
    it('should return patterns for LNC configuration', () => {
      const patterns = SensitivePatterns.getLncPatterns();

      // Check for expected patterns
      expect(patterns).toHaveProperty('connectionString');
      expect(patterns).toHaveProperty('pairingPhrase');

      // Test patterns
      expect('myConnectionString').toMatch(patterns.connectionString);
      expect('pairingphrase value').toMatch(patterns.pairingPhrase);
    });
  });

  describe('getClnPatterns', () => {
    it('should return patterns for Core Lightning configuration', () => {
      const patterns = SensitivePatterns.getClnPatterns();

      // Check for expected patterns
      expect(patterns).toHaveProperty('socket');
      expect(patterns).toHaveProperty('rpcPath');

      // Test patterns
      expect('unix_socket_path').toMatch(patterns.socket);
      expect('rpc_path_value').toMatch(patterns.rpcPath);
    });
  });

  describe('getEclairPatterns', () => {
    it('should return patterns for Eclair configuration', () => {
      const patterns = SensitivePatterns.getEclairPatterns();

      // Check for expected patterns
      expect(patterns).toHaveProperty('passwordFile');
      expect(patterns).toHaveProperty('apiToken');

      // Test patterns
      expect('password_file_path').toMatch(patterns.passwordFile);
      expect('api_token_value').toMatch(patterns.apiToken);
    });
  });

  describe('getHttpPatterns', () => {
    it('should return patterns for HTTP communication', () => {
      const patterns = SensitivePatterns.getHttpPatterns();

      // Check for expected patterns
      expect(patterns).toHaveProperty('authorization');
      expect(patterns).toHaveProperty('cookie');
      expect(patterns).toHaveProperty('xMacaroon');
      expect(patterns).toHaveProperty('bearer');

      // Test patterns
      expect('Authorization: Bearer token').toMatch(patterns.authorization);
      expect('cookie: session=abc123').toMatch(patterns.cookie);
      expect('x-lnd-macaroon: 1234').toMatch(patterns.xMacaroon);
      expect('bearer token').toMatch(patterns.bearer);
    });
  });

  describe('getGenericPatterns', () => {
    it('should return generic path patterns', () => {
      const patterns = SensitivePatterns.getGenericPatterns();

      // Check for expected patterns
      expect(patterns).toHaveProperty('unixPath');
      expect(patterns).toHaveProperty('credentialPath');

      // Test patterns
      expect('/var/log/app.log').toMatch(patterns.unixPath);
      expect('/home/user/credentials.json').toMatch(patterns.credentialPath);
    });

    it('should match environment variables with secrets', () => {
      const patterns = SensitivePatterns.getGenericPatterns();

      expect('SECRET=mysecretvalue').toMatch(patterns.secretEnv);
      expect('SECRET = mysecretvalue').toMatch(patterns.secretEnv);
    });
  });

  describe('getAllPatterns', () => {
    it('should combine all pattern categories', () => {
      const allPatterns = SensitivePatterns.getAllPatterns();

      // Check for patterns from various categories
      expect(allPatterns).toHaveProperty('password'); // Auth
      expect(allPatterns).toHaveProperty('macaroon'); // LND
      expect(allPatterns).toHaveProperty('connectionString'); // LNC
      expect(allPatterns).toHaveProperty('socket'); // CLN
      expect(allPatterns).toHaveProperty('apiToken'); // Eclair
      expect(allPatterns).toHaveProperty('unixPath'); // Generic
    });
  });

  describe('isSensitiveField', () => {
    it('should identify sensitive field names with case insensitivity', () => {
      // Positive cases
      expect(SensitivePatterns.isSensitiveField('password')).toBe(true);
      expect(SensitivePatterns.isSensitiveField('userPassword')).toBe(true);
      expect(SensitivePatterns.isSensitiveField('PASSWORD')).toBe(true);
      expect(SensitivePatterns.isSensitiveField('secret')).toBe(true);
      expect(SensitivePatterns.isSensitiveField('apiSecret')).toBe(true);
      expect(SensitivePatterns.isSensitiveField('tlsCert')).toBe(true);
      expect(SensitivePatterns.isSensitiveField('macaroonPath')).toBe(true);
      expect(SensitivePatterns.isSensitiveField('connectionString')).toBe(true);
      expect(SensitivePatterns.isSensitiveField('pairingPhrase')).toBe(true);

      // Negative cases
      expect(SensitivePatterns.isSensitiveField('username')).toBe(false);
      expect(SensitivePatterns.isSensitiveField('host')).toBe(false);
      expect(SensitivePatterns.isSensitiveField('port')).toBe(false);
      expect(SensitivePatterns.isSensitiveField('enabled')).toBe(false);
      expect(SensitivePatterns.isSensitiveField('timestamp')).toBe(false);
    });

    it('should handle boundary cases correctly', () => {
      // Edge cases
      expect(SensitivePatterns.isSensitiveField('public_key')).toBe(true); // Contains 'key'
      expect(SensitivePatterns.isSensitiveField('keyId')).toBe(true); // Contains 'key'
      expect(SensitivePatterns.isSensitiveField('publickey')).toBe(false); // Excluded by regex
      expect(SensitivePatterns.isSensitiveField('authorName')).toBe(false); // Contains 'auth' but not as a word
      expect(SensitivePatterns.isSensitiveField('author')).toBe(false); // Doesn't match 'auth' exactly
    });
  });
});
