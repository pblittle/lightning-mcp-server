/**
 * Tests for LND LNC-specific redaction in sanitize utility functions.
 * These tests focus on the sanitization of Lightning Node Connect (LNC)
 * connection details, including connection strings and pairing phrases.
 */

import { sanitizeConfig, sanitizeErrorMessage, sanitizeForLogging } from './sanitize';

describe('LND LNC Connection Details Redaction', () => {
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

  it('should redact LNC connection strings in complex objects', () => {
    // Given a complex object with LNC connection strings at different levels
    const complex = {
      connections: [
        {
          id: 'node1',
          config: {
            method: 'lnc',
            connectionString: 'lnc1:first-connection-string',
          },
        },
        {
          id: 'node2',
          config: {
            method: 'lnc',
            connectionString: 'lnc1:second-connection-string',
          },
        },
      ],
      settings: {
        defaultConnection: 'node1',
        backup: {
          lncConfig: {
            connectionString: 'lnc1:backup-connection-string',
          },
        },
      },
    };

    // When the object is prepared for logging
    const sanitized = sanitizeForLogging(complex);

    // Then all connection strings should be redacted regardless of nesting
    expect(sanitized.connections[0].config.connectionString).toBe('[REDACTED]');
    expect(sanitized.connections[1].config.connectionString).toBe('[REDACTED]');
    expect(sanitized.settings.backup.lncConfig.connectionString).toBe('[REDACTED]');

    // And non-sensitive data should be preserved
    expect(sanitized.connections[0].id).toBe('node1');
    expect(sanitized.connections[1].id).toBe('node2');
    expect(sanitized.settings.defaultConnection).toBe('node1');
  });

  it('should redact LNC connection strings in error messages', () => {
    // Given an error message containing an LNC connection string
    const errorMessage = 'Failed to connect using connectionString lnc1:abcdef1234567890';

    // When the message is sanitized
    const sanitized = sanitizeErrorMessage(errorMessage);

    // Then the connection string should be redacted
    expect(sanitized).toBe('Failed to connect using connectionString [REDACTED_CONNECTION_STRING]');

    // And it should not over-redact
    expect(sanitized).not.toBe('[REDACTED]');
    expect(sanitized).not.toContain('lnc1:');
  });

  it('should redact LNC pairing phrases in error messages', () => {
    // Given an error message containing a pairing phrase
    const errorMessage =
      'Invalid pairing phrase: word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';

    // When the message is sanitized
    const sanitized = sanitizeErrorMessage(errorMessage);

    // Then the pairing phrase should be redacted
    expect(sanitized).toBe('Invalid pairing phrase: [REDACTED_PAIRING_PHRASE]');

    // And it should not have the original words
    expect(sanitized).not.toContain('word1 word2');
  });
});
