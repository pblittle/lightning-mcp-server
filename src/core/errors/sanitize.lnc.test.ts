/**
 * Tests for LNC-specific redaction in sanitize utility functions.
 */

import { sanitizeConfig, sanitizeForLogging } from './sanitize';

describe('LNC Connection Details Redaction', () => {
  it('should redact LNC connection details while preserving non-sensitive information', () => {
    // Given an LNC connection configuration with sensitive information
    const config = {
      lnd: {
        method: 'lnc',
        connectionString: 'lnc1:example-sensitive-connection-data',
        pairingPhrase: 'word1 word2 word3 word4',
        otherInfo: 'non-sensitive data',
      },
    };

    // When the configuration is prepared for logging
    const sanitized = sanitizeConfig(config);

    // Then sensitive fields should be redacted
    expect(sanitized.lnd.connectionString).toBe('[REDACTED]');
    expect(sanitized.lnd.pairingPhrase).toBe('[REDACTED]');

    // And non-sensitive fields should remain unchanged
    expect(sanitized.lnd.method).toBe('lnc');
    expect(sanitized.lnd.otherInfo).toBe('non-sensitive data');

    // And the original configuration should not be modified
    expect(config.lnd.connectionString).toBe('lnc1:example-sensitive-connection-data');
    expect(config.lnd.pairingPhrase).toBe('word1 word2 word3 word4');
  });

  it('should redact sensitive LNC information in nested objects', () => {
    // Given a nested object structure containing LNC sensitive data
    const data = {
      connection: {
        type: 'lightning',
        details: {
          method: 'lnc',
          connectionString: 'lnc1:nested-sensitive-data',
          pairingPhrase: 'secret phrase here',
        },
        metadata: {
          timestamp: '2024-03-31T12:00:00Z',
        },
      },
    };

    // When the object is prepared for logging
    const sanitized = sanitizeForLogging(data);

    // Then sensitive fields should be redacted at any nesting level
    expect(sanitized.connection.details.connectionString).toBe('[REDACTED]');
    expect(sanitized.connection.details.pairingPhrase).toBe('[REDACTED]');

    // And non-sensitive fields should remain unchanged
    expect(sanitized.connection.details.method).toBe('lnc');
    expect(sanitized.connection.type).toBe('lightning');
    expect(sanitized.connection.metadata.timestamp).toBe('2024-03-31T12:00:00Z');
  });
});
