/**
 * Tests for format_bitcoin utility functions.
 */

import { formatSatsToBtc, formatSatoshis } from './format_bitcoin';

describe('formatSatsToBtc', () => {
  it('formats zero correctly', () => {
    expect(formatSatsToBtc(0)).toBe('0.00000000');
  });

  it('formats full BTC amount', () => {
    expect(formatSatsToBtc(100_000_000)).toBe('1.00000000');
  });

  it('formats partial BTC correctly', () => {
    expect(formatSatsToBtc(42_000_000)).toBe('0.42000000');
  });
});

describe('formatSatoshis', () => {
  it('formats zero sats', () => {
    expect(formatSatoshis(0)).toBe('0.00000000 BTC (0 sats)');
  });

  it('formats full BTC value', () => {
    expect(formatSatoshis(100_000_000)).toBe('1.00000000 BTC (100,000,000 sats)');
  });

  it('formats arbitrary value', () => {
    expect(formatSatoshis(123_456_789)).toBe('1.23456789 BTC (123,456,789 sats)');
  });
});
