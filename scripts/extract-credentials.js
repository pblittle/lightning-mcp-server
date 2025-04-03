#!/usr/bin/env node

/**
 * Extract credentials from lndconnect URL
 *
 * This script extracts the TLS certificate and macaroon from an lndconnect URL
 * and saves them to files. It also formats the certificate in PEM format,
 * which is required for proper connection to LND nodes.
 *
 * Usage:
 *   node scripts/extract-credentials.js [lndconnect-url]
 *
 * If no URL is provided, it will look for LNDCONNECT_URL in the .env file.
 *
 * Example:
 *   node scripts/extract-credentials.js "lndconnect://mynode.onion:10009?cert=BASE64CERT&macaroon=BASE64MACAROON"
 *
 * This script is useful for:
 * - Extracting credentials from lndconnect URLs (e.g., from mobile apps)
 * - Converting raw certificates to PEM format
 * - Setting up initial connection to an LND node
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get the lndconnect URL from command line or .env file
const lndconnectUrl =
  process.argv[2] ||
  process.env.LNDCONNECT_URL ||
  // Fallback to hardcoded URL if needed for testing
  'lndconnect://lum2tnxldlfeqk6kgz3zkyb3mpxwmregcig35ru5l6njnonktv5od4ad.onion:10009?cert=MIIDfjCCAySgAwIBAgIIMMSmTGANw3QwCgYIKoZIzj0EAwIwSzEmMCQGA1UEAwwdU3RhcnRPUyBMb2NhbCBJbnRlcm1lZGlhdGUgQ0ExDzANBgNVBAoMBlN0YXJ0OTEQMA4GA1UECwwHU3RhcnRPUzAeFw0yNTA0MDExMjUzMDBaFw0yNjA1MDQxMjUzMDBaMDkxFDASBgNVBAMMC2xuZC5lbWJhc3N5MQ8wDQYDVQQKDAZTdGFydDkxEDAOBgNVBAsMB1N0YXJ0T1MwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARefCXqmQ1TTF8Fi-2Womu5lEVML2Nb9_U7eiyEAzaYtvxkeQVxGaaI6gQ-11iuJKzy2XTU78U0WT560d18A7XPo4ICAjCCAf4wHQYDVR0OBBYEFHbDgMNMoON1BgOfY7o94Ph_Of5yMHkGA1UdIwRyMHCAFNzkLcySWWhigD-52GuRWJHzvsOGoU2kSzBJMSQwIgYDVQQDDBtzd2lmdC1yYWNjb29uIExvY2FsIFJvb3QgQ0ExDzANBgNVBAoMBlN0YXJ0OTEQMA4GA1UECwwHU3RhcnRPU4IJAON7z7D9fMEkMIIBRQYDVR0RBIIBPDCCATiCC2xuZC5lbWJhc3N5gg0qLmxuZC5lbWJhc3N5gj5sdW0ydG54bGRsZmVxazZrZ3ozemt5YjNtcHh3bXJlZ2NpZzM1cnU1bDZuam5vbmt0djVvZDRhZC5sb2NhbIJAKi5sdW0ydG54bGRsZmVxazZrZ3ozemt5YjNtcHh3bXJlZ2NpZzM1cnU1bDZuam5vbmt0djVvZDRhZC5sb2NhbII-bHVtMnRueGxkbGZlcWs2a2d6M3preWIzbXB4d21yZWdjaWczNXJ1NWw2bmpub25rdHY1b2Q0YWQub25pb26CQCoubHVtMnRueGxkbGZlcWs2a2d6M3preWIzbXB4d21yZWdjaWczNXJ1NWw2bmpub25rdHY1b2Q0YWQub25pb26HBKwSAAOHBKwSAAuHBKwSAAyHBMCoPIMwCQYDVR0TBAIwADAOBgNVHQ8BAf8EBAMCBaAwCgYIKoZIzj0EAwIDSAAwRQIga9KyaqL1EpMIYH1HL0ahAbyOltwR4ULixYS_CUe0za0CIQD0rGz3ulZjsj0cJH95cYq86PkETSNaBXsMr1tQI8S9Gg==&macaroon=AgEDbG5kAvgBAwoQVxE54qrfBA-TMithb_8O7hIBMBoWCgdhZGRyZXNzEgRyZWFkEgV3cml0ZRoTCgRpbmZvEgRyZWFkEgV3cml0ZRoXCghpbnZvaWNlcxIEcmVhZBIFd3JpdGUaIQoIbWFjYXJvb24SCGdlbmVyYXRlEgRyZWFkEgV3cml0ZRoWCgdtZXNzYWdlEgRyZWFkEgV3cml0ZRoXCghvZmZjaGFpbhIEcmVhZBIFd3JpdGUaFgoHb25jaGFpbhIEcmVhZBIFd3JpdGUaFAoFcGVlcnMSBHJlYWQSBXdyaXRlGhgKBnNpZ25lchIIZ2VuZXJhdGUSBHJlYWQAAAYguR1KvcO8AknXxMBYLWyD8hJFZdwVwItqzt5hqDCaqKA=';

if (!lndconnectUrl) {
  console.error('Error: No lndconnect URL provided');
  console.error('Usage: node scripts/extract-credentials.js [lndconnect-url]');
  console.error('Or set LNDCONNECT_URL in your .env file');
  process.exit(1);
}

console.log('Processing lndconnect URL...');

// Parse the URL
try {
  var url = new URL(lndconnectUrl);
} catch (error) {
  console.error('Error: Invalid lndconnect URL format');
  console.error(error.message);
  process.exit(1);
}

// Extract the host and port
const host = url.hostname;
const port = url.port || '10009';

// Extract the certificate and macaroon from the query parameters
const certBase64 = url.searchParams.get('cert');
const macaroonBase64 = url.searchParams.get('macaroon');

if (!certBase64) {
  console.error('Error: No certificate found in the lndconnect URL');
  process.exit(1);
}

if (!macaroonBase64) {
  console.error('Error: No macaroon found in the lndconnect URL');
  process.exit(1);
}

// Decode the certificate and macaroon
const cert = Buffer.from(certBase64, 'base64');
const macaroon = Buffer.from(macaroonBase64, 'base64');

// Create the fixtures directory if it doesn't exist
const fixturesDir = path.join(__dirname, '..', 'test', 'fixtures');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

// Save the certificate and macaroon to files
const certPath = path.join(fixturesDir, 'tls.cert');
const certPemPath = path.join(fixturesDir, 'tls.pem');
const macaroonPath = path.join(fixturesDir, 'admin.macaroon');

// Save the raw certificate
fs.writeFileSync(certPath, cert);

// Save the certificate in PEM format
// This is critical for proper connection to LND nodes
const certPem = `-----BEGIN CERTIFICATE-----
${cert
  .toString('base64')
  .match(/.{1,64}/g)
  .join('\n')}
-----END CERTIFICATE-----`;
fs.writeFileSync(certPemPath, certPem);

fs.writeFileSync(macaroonPath, macaroon);

console.log(`Host: ${host}`);
console.log(`Port: ${port}`);
console.log(`Raw certificate saved to: ${certPath}`);
console.log(`PEM certificate saved to: ${certPemPath}`);
console.log(`Macaroon saved to: ${macaroonPath}`);

// Print the .env configuration
console.log('\nAdd the following to your .env file:');
console.log('CONNECTION_TYPE=lnd-direct');
console.log(`LND_TLS_CERT_PATH=${certPemPath}`); // Use PEM format for better compatibility
console.log(`LND_MACAROON_PATH=${macaroonPath}`);
console.log(`LND_HOST=${host}`);
console.log(`LND_PORT=${port}`);

// For Tor connections
if (host.endsWith('.onion')) {
  console.log('\nSince you are connecting to a Tor hidden service, also add:');
  console.log('SOCKS_PROXY_HOST=localhost');
  console.log('SOCKS_PROXY_PORT=9050');
}
