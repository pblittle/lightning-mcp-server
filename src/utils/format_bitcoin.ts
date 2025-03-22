/**
 * Utility functions for formatting Bitcoin and Satoshi values.
 */

const SATS_PER_BTC = 100000000;

/**
 * Formats satoshis to BTC string representation.
 * @param sats Amount in satoshis
 * @returns Formatted string with BTC denomination
 */
export function formatSatsToBtc(sats: number): string {
  return (sats / SATS_PER_BTC).toFixed(8);
}

/**
 * Formats satoshis to a human-readable string with both BTC and sats.
 * @param sats Amount in satoshis
 * @returns Formatted string with both BTC and sats denominations
 */
export function formatSatoshis(sats: number): string {
  return `${(sats / SATS_PER_BTC).toFixed(8)} BTC (${sats.toLocaleString()} sats)`;
}
