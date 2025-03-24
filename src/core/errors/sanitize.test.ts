/**
 * Unit tests for sanitize utility functions.
 * Tests redaction of sensitive information in error messages and configs.
 */

import { sanitizeErrorMessage, sanitizeError, sanitizeConfig } from './sanitize';

describe('sanitizeErrorMessage', () => {
  it('should handle null or empty messages', () => {
    expect(sanitizeErrorMessage('')).toBe('');
    expect(sanitizeErrorMessage(null as unknown as string)).toBe(null);
    expect(sanitizeErrorMessage(undefined as unknown as string)).toBe(undefined);
  });

  it('should redact file paths containing sensitive keywords', () => {
    const messages = [
      'TLS certificate file not found at: /home/user/certs/lnd.cert',
      'Macaroon file not found at: /Users/alice/lightning/data/chain/bitcoin/macaroon/admin.macaroon',
      'Error reading key file: C:\\Users\\bob\\AppData\\Local\\lnd\\key.pem',
      'Failed to load credential from /var/secrets/credentials.json',
    ];

    const sanitized = messages.map(sanitizeErrorMessage);

    // Test that sensitive paths are redacted
    expect(sanitized[0]).not.toContain('/home/user/certs/lnd.cert');
    expect(sanitized[0]).toContain('[REDACTED_CERT_PATH]');
    expect(sanitized[0]).toMatch(/TLS certificate file not found at:/);

    expect(sanitized[1]).not.toContain(
      '/Users/alice/lightning/data/chain/bitcoin/macaroon/admin.macaroon'
    );
    expect(sanitized[1]).toContain('[REDACTED_MACAROON_PATH]');
    expect(sanitized[1]).toMatch(/Macaroon file not found at:/);

    expect(sanitized[2]).not.toContain('C:\\Users\\bob\\AppData\\Local\\lnd\\key.pem');
    expect(sanitized[2]).toContain('[REDACTED_KEY_PATH]');
    expect(sanitized[2]).toMatch(/Error reading key file:/);

    expect(sanitized[3]).not.toContain('/var/secrets/credentials.json');
    expect(sanitized[3]).toContain('[REDACTED_CREDENTIAL]');
    expect(sanitized[3]).toMatch(/Failed to load credential from/);
  });

  it('should redact environment variable values', () => {
    const messages = [
      'Environment variable LND_TLS_CERT_PATH=/home/user/certs/lnd.cert is invalid',
      'Environment variable LND_MACAROON_PATH = /path/to/macaroon is invalid',
      'SECRET=mysecretvalue is exposed',
    ];

    const sensitiveValues = ['/home/user/certs/lnd.cert', '/path/to/macaroon', 'mysecretvalue'];

    // Test each message individually
    messages.forEach((message, index) => {
      const result = sanitizeErrorMessage(message);

      // Verify sensitive value is redacted
      expect(result).not.toContain(sensitiveValues[index]);

      // Verify appropriate redaction marker is present
      if (index === 0) {
        expect(result).toContain('[REDACTED_CERT_PATH]');
        expect(result).toContain('Environment variable');
        expect(result).toContain('is invalid');
      } else if (index === 1) {
        expect(result).toContain('[REDACTED_MACAROON_PATH]');
        expect(result).toContain('Environment variable');
        expect(result).toContain('is invalid');
      } else if (index === 2) {
        expect(result).toContain('[REDACTED_CREDENTIAL]');
        expect(result).toContain('is exposed');
      }
    });
  });

  it('should redact absolute file paths', () => {
    const messages = ['File not found: /var/log/app.log', 'Cannot read file: /etc/lnd/config.conf'];
    const paths = ['/var/log/app.log', '/etc/lnd/config.conf'];

    const sanitized = messages.map(sanitizeErrorMessage);

    // Check that paths are redacted and context is preserved
    sanitized.forEach((sanitizedMsg, index) => {
      expect(sanitizedMsg).not.toContain(paths[index]);
      expect(sanitizedMsg).toContain('[REDACTED_PATH]');

      if (index === 0) {
        expect(sanitizedMsg).toMatch(/File not found:/);
      } else {
        expect(sanitizedMsg).toMatch(/Cannot read file:/);
      }
    });
  });

  it('should redact Windows-style file paths', () => {
    const messages = [
      'File not found: C:\\Program Files\\LND\\lnd.conf',
      'Cannot read file: D:\\Users\\Alice\\AppData\\Roaming\\LND\\data.db',
    ];

    const windowsPaths = [
      'C:\\Program Files\\LND\\lnd.conf',
      'D:\\Users\\Alice\\AppData\\Roaming\\LND\\data.db',
    ];

    const sanitized = messages.map(sanitizeErrorMessage);

    // Check that Windows paths are redacted and context is preserved
    sanitized.forEach((sanitizedMsg, index) => {
      // Need to use regex for Windows paths due to backslash escaping
      const pathPattern = windowsPaths[index].replace(/\\/g, '\\\\');
      expect(sanitizedMsg).not.toMatch(new RegExp(pathPattern));
      expect(sanitizedMsg).toContain('[REDACTED_PATH]');

      if (index === 0) {
        expect(sanitizedMsg).toMatch(/File not found:/);
      } else {
        expect(sanitizedMsg).toMatch(/Cannot read file:/);
      }
    });
  });

  it('should preserve non-sensitive parts of the message', () => {
    const message =
      'Error code 404: File not found at /home/user/certs/lnd.cert. Please check the path.';

    const result = sanitizeErrorMessage(message);

    // Verify sensitive part is removed
    expect(result).not.toContain('/home/user/certs/lnd.cert');

    // Verify redaction marker is present
    expect(result).toContain('[REDACTED_CERT_PATH]');

    // Verify non-sensitive parts are preserved
    expect(result).toContain('Error code 404');
    expect(result).toContain('File not found at');
    expect(result).toContain('Please check the path');
  });
});

describe('sanitizeConfig', () => {
  it('should handle null or undefined config', () => {
    expect(sanitizeConfig(null as any)).toBe(null);
    expect(sanitizeConfig(undefined as any)).toBe(undefined);
  });

  it('should redact sensitive fields in configuration objects', () => {
    const config = {
      lnd: {
        tlsCertPath: '/path/to/tls.cert',
        macaroonPath: '/path/to/admin.macaroon',
        host: 'localhost',
        port: '10009',
      },
      server: {
        port: 3000,
      },
      credentials: {
        apiKey: 'secret-api-key',
        token: 'auth-token',
      },
    };

    const sanitized = sanitizeConfig(config);

    // Original config should not be modified
    expect(config.lnd.tlsCertPath).toBe('/path/to/tls.cert');
    expect(config.lnd.macaroonPath).toBe('/path/to/admin.macaroon');
    expect(config.credentials.apiKey).toBe('secret-api-key');
    expect(config.credentials.token).toBe('auth-token');

    // Sanitized config should have redacted sensitive fields
    expect(sanitized.lnd.tlsCertPath).toBe('[REDACTED]');
    expect(sanitized.lnd.macaroonPath).toBe('[REDACTED]');
    expect(sanitized.credentials.apiKey).toBe('[REDACTED]');
    expect(sanitized.credentials.token).toBe('[REDACTED]');

    // Non-sensitive fields should remain unchanged
    expect(sanitized.lnd.host).toBe('localhost');
    expect(sanitized.lnd.port).toBe('10009');
    expect(sanitized.server.port).toBe(3000);
  });

  it('should handle nested objects and arrays', () => {
    const config = {
      nodes: [
        {
          name: 'node1',
          certPath: '/path/to/cert1',
          credentials: {
            password: 'secret1',
          },
        },
        {
          name: 'node2',
          certPath: '/path/to/cert2',
          credentials: {
            password: 'secret2',
          },
        },
      ],
    };

    const sanitized = sanitizeConfig(config);

    // Original config should not be modified
    expect(config.nodes[0].certPath).toBe('/path/to/cert1');
    expect(config.nodes[0].credentials.password).toBe('secret1');
    expect(config.nodes[1].certPath).toBe('/path/to/cert2');
    expect(config.nodes[1].credentials.password).toBe('secret2');

    // Sanitized config should have redacted sensitive fields
    expect(sanitized.nodes[0].certPath).toBe('[REDACTED]');
    expect(sanitized.nodes[0].credentials.password).toBe('[REDACTED]');
    expect(sanitized.nodes[1].certPath).toBe('[REDACTED]');
    expect(sanitized.nodes[1].credentials.password).toBe('[REDACTED]');

    // Non-sensitive fields should remain unchanged
    expect(sanitized.nodes[0].name).toBe('node1');
    expect(sanitized.nodes[1].name).toBe('node2');
  });
});

describe('sanitizeError', () => {
  it('should sanitize Error objects', () => {
    const error = new Error('TLS certificate file not found at: /home/user/certs/lnd.cert');
    const sanitized = sanitizeError(error);

    expect(sanitized).toBeInstanceOf(Error);
    expect(sanitized.message).not.toContain('/home/user/certs/lnd.cert');
    expect(sanitized.message).toContain('[REDACTED_CERT_PATH]');
    expect(sanitized.message).toContain('TLS certificate file not found at:');
    expect(sanitized.stack).toBe(error.stack);
  });

  it('should handle non-Error objects', () => {
    const nonError = 'File not found: /var/log/app.log';
    const sanitized = sanitizeError(nonError);

    expect(sanitized).toBeInstanceOf(Error);
    expect(sanitized.message).not.toContain('/var/log/app.log');
    expect(sanitized.message).toContain('[REDACTED_PATH]');
    expect(sanitized.message).toContain('File not found:');
  });
});
