#!/usr/bin/env node

/**
 * Decrypt NTT Data Error Response
 * Decrypts the encrypted response to see the actual error
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Parse .env file
function parseEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    
    const [key, ...valueParts] = line.split('=');
    if (key) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
}

const envPath = path.join(__dirname, 'backend', '.env');
const envVars = parseEnv(envPath);

const config = {
  responseKey: envVars.NDPS_RESPONSE_KEY || "9B130849756D796521AC4DBEC26D3B2B",
  responseSalt: envVars.NDPS_RESPONSE_KEY || "9B130849756D796521AC4DBEC26D3B2B",
};

const algorithm = 'aes-256-cbc';
const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 'utf8');

// Encrypted response from NTT Data
const encryptedResponse = "5C49412C4359D356A39D1281D0A3FD731F18C63C531F8AF27EB043ADDCDEBB7FD0EAFAEF450D1BBED9DD7EF2225BDEF0C904A8E1D8B46E804E31C51B68FDA832606" +
"2C492D5D11452F94793C2957E7B0F08E754D7CAC323E68061EA2D7EA97535EAA964BA8DB40A5F52B31DB1E1C3A26712B73C92F533A1A3AC5760F2FDECB3357F6A8C3951C57EC5F8F65536761DA04E24DF99CB72BCB8CA252F11396E29B5C7DB7B93545683FFA53017BFF18A3DC55D";

console.log('\n' + '='.repeat(70));
console.log('NTT DATA ERROR RESPONSE DECRYPTION');
console.log('='.repeat(70) + '\n');

console.log('📋 ENCRYPTED RESPONSE:');
console.log('-'.repeat(70));
console.log(`Length: ${encryptedResponse.length} characters`);
console.log(`First 100 chars: ${encryptedResponse.substring(0, 100)}...`);

console.log('\n📋 DECRYPTION CONFIGURATION:');
console.log('-'.repeat(70));
console.log(`Algorithm: aes-256-cbc`);
console.log(`Response Key: ${config.responseKey}`);
console.log(`PBKDF2: 65536 iterations, sha512, 32 bytes`);

try {
  const password = Buffer.from(config.responseKey, 'utf8');
  const salt = Buffer.from(config.responseSalt, 'utf8');
  
  // Derive key using PBKDF2
  const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
  
  console.log(`\nDerived Key: ${derivedKey.toString('hex')}`);

  const encryptedBuffer = Buffer.from(encryptedResponse, 'hex');
  console.log(`Encrypted buffer length: ${encryptedBuffer.length} bytes`);

  const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
  let decrypted = decipher.update(encryptedBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  const decryptedText = decrypted.toString('utf8');

  console.log('\n✅ DECRYPTION SUCCESSFUL!');
  console.log('='.repeat(70));
  console.log('\n📋 DECRYPTED RESPONSE:');
  console.log('-'.repeat(70));
  console.log(decryptedText);

  // Try to parse as JSON
  try {
    const jsonResponse = JSON.parse(decryptedText);
    console.log('\n📋 PARSED JSON:');
    console.log('-'.repeat(70));
    console.log(JSON.stringify(jsonResponse, null, 2));

    // Analyze the response
    console.log('\n📋 ANALYSIS:');
    console.log('-'.repeat(70));

    if (jsonResponse.payInstrument) {
      if (Array.isArray(jsonResponse.payInstrument)) {
        const txn = jsonResponse.payInstrument[0];
        if (txn.responseDetails) {
          console.log(`Status Code: ${txn.responseDetails.statusCode}`);
          console.log(`Message: ${txn.responseDetails.message}`);
          console.log(`Description: ${txn.responseDetails.description || 'N/A'}`);
        }
      }
    }

  } catch (parseError) {
    console.log('\n⚠️  Could not parse as JSON (might be plain text)');
  }

} catch (error) {
  console.log(`\n❌ DECRYPTION FAILED: ${error.message}`);
  console.log('\nThis could mean:');
  console.log('1. Response Key (NDPS_RESPONSE_KEY) is incorrect');
  console.log('2. Encryption was corrupted during transmission');
  console.log('3. IV (Initialization Vector) is different');
  console.log(`\nCurrent Response Key: ${config.responseKey}`);
  console.log('Expected: 9B130849756D796521AC4DBEC26D3B2B');
}

console.log('\n' + '='.repeat(70) + '\n');
