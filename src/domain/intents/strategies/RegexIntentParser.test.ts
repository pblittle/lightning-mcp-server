/**
 * @fileoverview Tests for RegexIntentParser
 */

import { LightningDomain } from '../entities/EnhancedIntent';
import { RegexIntentParser } from './RegexIntentParser';

describe('RegexIntentParser', () => {
  let parser: RegexIntentParser;

  beforeEach(() => {
    parser = new RegexIntentParser();
  });

  describe('parseIntent', () => {
    test('should parse channel health queries as list operations', () => {
      const queries = [
        'Show me the health of my channels',
        'Are there any channel issues?',
        'Check channel health',
        'Show me inactive channels',
        'Are there any problems with my channels?',
      ];

      for (const query of queries) {
        const intent = parser.parseIntent(query);
        expect(intent.domain).toBe('channels');
        expect(intent.operation).toBe('list');
        expect(intent.query).toBe(query);
      }
    });

    test('should parse channel liquidity queries', () => {
      const queries = [
        'Show me channel liquidity',
        'What is the balance of my channels?',
        'Check channel capacity',
        'Show me channel funds',
      ];

      for (const query of queries) {
        const intent = parser.parseIntent(query);
        expect(intent.domain).toBe('channels');
        expect(intent.operation).toBe('liquidity');
        expect(intent.query).toBe(query);
      }
    });

    test('should parse channel list queries', () => {
      const queries = [
        'List all channels',
        'Show me my channels',
        'What channels do I have?',
        'Show all channels',
      ];

      for (const query of queries) {
        const intent = parser.parseIntent(query);
        expect(intent.domain).toBe('channels');
        expect(intent.operation).toBe('list');
        expect(intent.query).toBe(query);
      }
    });

    test('should default to list operation for ambiguous queries', () => {
      const queries = ['channels', 'tell me about my node', 'lightning info'];

      for (const query of queries) {
        const intent = parser.parseIntent(query);
        expect(intent.domain).toBe('channels');
        expect(intent.operation).toBe('list');
        expect(intent.query).toBe(query);
      }
    });

    test('should extract active/inactive attribute for channel queries', () => {
      const activeQuery = 'Show me active channels';
      const activeIntent = parser.parseIntent(activeQuery);
      expect(activeIntent.attributes.get('active')).toBe(true);

      const inactiveQuery = 'Show me inactive channels';
      const inactiveIntent = parser.parseIntent(inactiveQuery);
      expect(inactiveIntent.attributes.get('active')).toBe(false);
    });

    test('should extract checkBalance attribute for liquidity queries', () => {
      const query = 'Show me imbalanced channels';
      const intent = parser.parseIntent(query);
      expect(intent.operation).toBe('liquidity');
      expect(intent.attributes.get('checkBalance')).toBe(true);
    });

    test('should handle errors gracefully', () => {
      // Mock the determineDomain method to throw an error
      jest.spyOn(parser as any, 'determineDomain').mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const intent = parser.parseIntent('test query');
      expect(intent.domain).toBe('unknown');
      expect(intent.operation).toBe('unknown');
      expect(intent.error).toBeDefined();
      expect(intent.error?.message).toBe('Test error');
    });
  });

  describe('determineDomain', () => {
    test('should always return channels domain', () => {
      // Access the private method using type assertion
      const determineDomain = (parser as any).determineDomain.bind(parser);

      // Test with various queries
      expect(determineDomain('Show me channels')).toBe('channels');
      expect(determineDomain('What about nodes?')).toBe('channels');
      expect(determineDomain('Random query')).toBe('channels');
    });
  });

  describe('determineOperation', () => {
    test('should determine list operation for health-related queries', () => {
      // Access the private method using type assertion
      const determineOperation = (parser as any).determineOperation.bind(parser);

      expect(determineOperation('Check channel health', 'channels')).toBe('list');
      expect(determineOperation('Are there any issues?', 'channels')).toBe('list');
      expect(determineOperation('Show me inactive channels', 'channels')).toBe('list');
    });

    test('should determine liquidity operation correctly', () => {
      // Access the private method using type assertion
      const determineOperation = (parser as any).determineOperation.bind(parser);

      expect(determineOperation('Check channel liquidity', 'channels')).toBe('liquidity');
      expect(determineOperation('What is the balance?', 'channels')).toBe('liquidity');
      expect(determineOperation('Show me channel capacity', 'channels')).toBe('liquidity');
    });

    test('should determine list operation correctly', () => {
      // Access the private method using type assertion
      const determineOperation = (parser as any).determineOperation.bind(parser);

      expect(determineOperation('List all channels', 'channels')).toBe('list');
      expect(determineOperation('Show me channels', 'channels')).toBe('list');
      expect(determineOperation('What channels do I have?', 'channels')).toBe('list');
    });

    test('should default to list for unknown operations', () => {
      // Access the private method using type assertion
      const determineOperation = (parser as any).determineOperation.bind(parser);

      expect(determineOperation('Random query', 'channels')).toBe('list');
    });

    test('should default to list for unknown domains', () => {
      // Access the private method using type assertion
      const determineOperation = (parser as any).determineOperation.bind(parser);

      // Using a type cast instead of @ts-ignore
      expect(determineOperation('Random query', 'unknown' as LightningDomain)).toBe('list');
    });
  });

  describe('extractAttributes', () => {
    test('should extract active attribute correctly', () => {
      // Access the private method using type assertion
      const extractAttributes = (parser as any).extractAttributes.bind(parser);

      const activeAttrs = extractAttributes('Show me active channels', 'channels', 'list');
      expect(activeAttrs.get('active')).toBe(true);

      const inactiveAttrs = extractAttributes('Show me inactive channels', 'channels', 'list');
      expect(inactiveAttrs.get('active')).toBe(false);
    });

    test('should correctly handle inactive keyword taking precedence over active', () => {
      // Access the private method using type assertion
      const extractAttributes = (parser as any).extractAttributes.bind(parser);

      // Test with a query containing both "inactive" and "active" keywords
      const mixedQuery = 'Show me inactive channels that were previously active';
      const mixedAttrs = extractAttributes(mixedQuery, 'channels', 'list');

      // Despite having "active" in the query, the presence of "inactive" should take precedence
      expect(mixedAttrs.get('active')).toBe(false);

      // Test with just "inactive"
      const inactiveQuery = 'Show me inactive channels';
      const inactiveAttrs = extractAttributes(inactiveQuery, 'channels', 'list');
      expect(inactiveAttrs.get('active')).toBe(false);

      // Test with just "active"
      const activeQuery = 'Show me active channels';
      const activeAttrs = extractAttributes(activeQuery, 'channels', 'list');
      expect(activeAttrs.get('active')).toBe(true);
    });

    test('should extract checkBalance attribute for liquidity operation', () => {
      // Access the private method using type assertion
      const extractAttributes = (parser as any).extractAttributes.bind(parser);

      const attrs = extractAttributes('Show me imbalanced channels', 'channels', 'liquidity');
      expect(attrs.get('checkBalance')).toBe(true);
    });

    test('should not extract checkBalance attribute for non-liquidity operations', () => {
      // Access the private method using type assertion
      const extractAttributes = (parser as any).extractAttributes.bind(parser);

      const attrs = extractAttributes('Show me imbalanced channels', 'channels', 'list');
      expect(attrs.get('checkBalance')).toBeUndefined();
    });

    test('should not extract attributes for non-channel domains', () => {
      // Access the private method using type assertion
      const extractAttributes = (parser as any).extractAttributes.bind(parser);

      // Using a type cast instead of @ts-ignore
      const attrs = extractAttributes(
        'Show me active channels',
        'unknown' as LightningDomain,
        'list'
      );
      expect(attrs.size).toBe(0);
    });
  });
});
