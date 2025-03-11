import { sanitizeErrorMessage, sanitizeError } from '../../utils/sanitize';

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
    const messages = [
      'File not found: /var/log/app.log',
      'Cannot read file: /etc/lnd/config.conf',
    ];

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
    const message = 'Error code 404: File not found at /home/user/certs/lnd.cert. Please check the path.';
    const expected = 'Error code 404: File not found at [REDACTED_CERT_PATH]. Please check the path.';
    
    // Manually sanitize the message to match our expected output
    const sanitized = message.replace('/home/user/certs/lnd.cert', '[REDACTED_CERT_PATH]');
    
    // First verify our manual sanitization matches the expected output
    expect(sanitized).toBe(expected);
    
    // Then test the actual sanitizeErrorMessage function
    const result = sanitizeErrorMessage(message);
    expect(result).toBe(expected);
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
