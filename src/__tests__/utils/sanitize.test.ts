import { sanitizeErrorMessage, sanitizeError, sanitizeConfig } from '../../utils/sanitize';

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

    expect(sanitized[0]).toBe('TLS certificate file not found at: [REDACTED_CERT_PATH]');
    expect(sanitized[1]).toBe('Macaroon file not found at: [REDACTED_MACAROON_PATH]');
    expect(sanitized[2]).toBe('Error reading key file: [REDACTED_KEY_PATH]');
    expect(sanitized[3]).toBe('Failed to load credential from [REDACTED_CREDENTIAL]');
  });

  it('should redact environment variable values', () => {
    const messages = [
      'Environment variable LND_TLS_CERT_PATH=/home/user/certs/lnd.cert is invalid',
      'Environment variable LND_MACAROON_PATH = /path/to/macaroon is invalid',
      'SECRET=mysecretvalue is exposed',
    ];

    // Manually sanitize to match our expected output
    const sanitized = [
      'Environment variable [REDACTED_CERT_PATH] is invalid',
      'Environment variable [REDACTED_MACAROON_PATH] is invalid',
      '[REDACTED_CREDENTIAL] is exposed',
    ];

    // Test each message individually to better diagnose issues
    messages.forEach((message, index) => {
      const result = sanitizeErrorMessage(message);
      expect(result).toBe(sanitized[index]);
    });
  });

  it('should redact absolute file paths', () => {
    const messages = ['File not found: /var/log/app.log', 'Cannot read file: /etc/lnd/config.conf'];

    const sanitized = messages.map(sanitizeErrorMessage);

    expect(sanitized[0]).toBe('File not found: [REDACTED_PATH]');
    expect(sanitized[1]).toBe('Cannot read file: [REDACTED_PATH]');
  });

  it('should redact Windows-style file paths', () => {
    const messages = [
      'File not found: C:\\Program Files\\LND\\lnd.conf',
      'Cannot read file: D:\\Users\\Alice\\AppData\\Roaming\\LND\\data.db',
    ];

    const sanitized = messages.map(sanitizeErrorMessage);

    expect(sanitized[0]).toBe('File not found: [REDACTED_PATH]');
    expect(sanitized[1]).toBe('Cannot read file: [REDACTED_PATH]');
  });

  it('should preserve non-sensitive parts of the message', () => {
    const message =
      'Error code 404: File not found at /home/user/certs/lnd.cert. Please check the path.';
    const expected =
      'Error code 404: File not found at [REDACTED_CERT_PATH]. Please check the path.';

    // Manually sanitize the message to match our expected output
    const sanitized = message.replace('/home/user/certs/lnd.cert', '[REDACTED_CERT_PATH]');

    // First verify our manual sanitization matches the expected output
    expect(sanitized).toBe(expected);

    // Then test the actual sanitizeErrorMessage function
    const result = sanitizeErrorMessage(message);
    expect(result).toBe(expected);
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
    expect(sanitized.message).toBe('TLS certificate file not found at: [REDACTED_CERT_PATH]');
    expect(sanitized.stack).toBe(error.stack);
  });

  it('should handle non-Error objects', () => {
    const nonError = 'File not found: /var/log/app.log';
    const sanitized = sanitizeError(nonError);

    expect(sanitized).toBeInstanceOf(Error);
    expect(sanitized.message).toBe('File not found: [REDACTED_PATH]');
  });
});
