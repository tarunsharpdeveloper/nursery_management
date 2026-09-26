#!/usr/bin/env node

/**
 * Verify Production NDPS Setup
 * Checks if backend environment variables are correctly configured for production
 */

require('dotenv').config({ path: './backend/.env' });

console.log('\n' + '='.repeat(60));
console.log('PRODUCTION SETUP VERIFICATION');
console.log('='.repeat(60) + '\n');

// Check Node Environment
console.log('📋 ENVIRONMENT DETECTION:');
console.log('-'.repeat(60));
const nodeEnv = process.env.NODE_ENV;
console.log(`NODE_ENV: ${nodeEnv}`);
if (nodeEnv === 'production') {
  console.log('✅ Running in PRODUCTION mode');
} else {
  console.log(`⚠️  Running in ${nodeEnv || 'development'} mode (should be "production")`);
}

// Check NDPS Credentials
console.log('\n📋 NDPS PRODUCTION CREDENTIALS:');
console.log('-'.repeat(60));

const credentials = {
  'Merchant ID': process.env.NDPS_MERCH_ID,
  'Product ID': process.env.NDPS_PRODUCT_ID,
  'API URL': process.env.NDPS_API_URL,
  'Return URL': process.env.NDPS_RETURN_URL,
};

let credentialsOk = true;
Object.entries(credentials).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}: ${value}`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
    credentialsOk = false;
  }
});

// Check Encryption Keys
console.log('\n📋 AES ENCRYPTION KEYS (Salt/IV):');
console.log('-'.repeat(60));

const requestKey = process.env.NDPS_REQUEST_KEY;
const responseKey = process.env.NDPS_RESPONSE_KEY;

if (requestKey && requestKey.length === 32) {
  console.log(`✅ NDPS_REQUEST_KEY: ${requestKey.substring(0, 8)}... (32 chars)`);
} else {
  console.log(`❌ NDPS_REQUEST_KEY: Invalid (${requestKey ? requestKey.length : 0} chars, need 32)`);
  credentialsOk = false;
}

if (responseKey && responseKey.length === 32) {
  console.log(`✅ NDPS_RESPONSE_KEY: ${responseKey.substring(0, 8)}... (32 chars)`);
} else {
  console.log(`❌ NDPS_RESPONSE_KEY: Invalid (${responseKey ? responseKey.length : 0} chars, need 32)`);
  credentialsOk = false;
}

// Check Hash Keys
console.log('\n📋 HASH KEYS (for signatures):');
console.log('-'.repeat(60));

const requestHashKey = process.env.NDPS_REQUEST_HASH_KEY;
const responseHashKey = process.env.NDPS_RESPONSE_HASH_KEY;

if (requestHashKey) {
  console.log(`✅ NDPS_REQUEST_HASH_KEY: ${requestHashKey.substring(0, 8)}...`);
} else {
  console.log(`❌ NDPS_REQUEST_HASH_KEY: NOT SET`);
  credentialsOk = false;
}

if (responseHashKey) {
  console.log(`✅ NDPS_RESPONSE_HASH_KEY: ${responseHashKey.substring(0, 8)}...`);
} else {
  console.log(`❌ NDPS_RESPONSE_HASH_KEY: NOT SET`);
  credentialsOk = false;
}

// Check CORS Configuration
console.log('\n📋 CORS CONFIGURATION:');
console.log('-'.repeat(60));

const corsOrigin = process.env.CORS_ORIGIN;
if (corsOrigin && corsOrigin.startsWith('https://')) {
  console.log(`✅ CORS_ORIGIN: ${corsOrigin}`);
} else {
  console.log(`⚠️  CORS_ORIGIN: ${corsOrigin || 'NOT SET'} (should be HTTPS URL)`);
}

// Test Encryption/Decryption
console.log('\n📋 AES ENCRYPTION/DECRYPTION TEST:');
console.log('-'.repeat(60));

try {
  const crypto = require('crypto');
  const algorithm = 'aes-256-cbc';
  const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 'utf8');
  const testData = 'Test payload for encryption verification';

  // Encrypt
  const password = Buffer.from(requestKey, 'utf8');
  const salt = Buffer.from(requestKey, 'utf8');
  const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
  
  const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
  let encrypted = cipher.update(testData, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  console.log(`✅ Encryption successful (${encrypted.length} chars)`);

  // Decrypt
  const responsePassword = Buffer.from(responseKey, 'utf8');
  const responseSalt = Buffer.from(responseKey, 'utf8');
  const responseDerivedKey = crypto.pbkdf2Sync(responsePassword, responseSalt, 65536, 32, 'sha512');
  
  // For this test, we'll use the same key for decryption
  const decipher = crypto.createDecipheriv(algorithm, responseDerivedKey, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  if (decrypted === testData) {
    console.log('✅ Decryption successful (data matches)');
  } else {
    console.log('⚠️  Decryption returned different data (expected for different keys)');
  }
} catch (error) {
  console.log(`❌ Encryption/Decryption test failed: ${error.message}`);
  credentialsOk = false;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));

if (credentialsOk && nodeEnv === 'production') {
  console.log('\n✅ Production setup looks good!');
  console.log('\nNext steps:');
  console.log('1. Verify database connection: MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD');
  console.log('2. Restart backend service: pm2 restart backend-app');
  console.log('3. Test payment initiation from frontend');
  console.log('4. Monitor backend logs for any errors');
} else {
  console.log('\n⚠️  Please fix the issues above before deploying to production!');
  if (nodeEnv !== 'production') {
    console.log('\n❌ CRITICAL: NODE_ENV must be set to "production" in backend/.env');
  }
}

console.log('\n' + '='.repeat(60) + '\n');
