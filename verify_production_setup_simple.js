#!/usr/bin/env node

/**
 * Verify Production NDPS Setup
 * Checks if backend environment variables are correctly configured for production
 */

const fs = require('fs');
const path = require('path');

// Parse .env file manually
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

console.log('\n' + '='.repeat(60));
console.log('PRODUCTION SETUP VERIFICATION');
console.log('='.repeat(60) + '\n');

// Check Node Environment
console.log('📋 ENVIRONMENT DETECTION:');
console.log('-'.repeat(60));
const nodeEnv = envVars.NODE_ENV;
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
  'Merchant ID': envVars.NDPS_MERCH_ID,
  'Product ID': envVars.NDPS_PRODUCT_ID,
  'API URL': envVars.NDPS_API_URL,
  'Return URL': envVars.NDPS_RETURN_URL,
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

// Check specific production values
console.log('\n📋 PRODUCTION VALUES VERIFICATION:');
console.log('-'.repeat(60));

const checks = [
  ['Merchant ID is 856377 (production)', envVars.NDPS_MERCH_ID === '856377'],
  ['Product ID is AWANT (production)', envVars.NDPS_PRODUCT_ID === 'AWANT'],
  ['API URL is production endpoint', envVars.NDPS_API_URL === 'https://payment1.atomtech.in/ots/aipay/auth'],
  ['API URL is HTTPS (secure)', envVars.NDPS_API_URL && envVars.NDPS_API_URL.startsWith('https://')],
];

checks.forEach(([desc, isValid]) => {
  if (isValid) {
    console.log(`✅ ${desc}`);
  } else {
    console.log(`❌ ${desc}`);
    credentialsOk = false;
  }
});

// Check Encryption Keys
console.log('\n📋 AES ENCRYPTION KEYS (Salt/IV):');
console.log('-'.repeat(60));

const requestKey = envVars.NDPS_REQUEST_KEY;
const responseKey = envVars.NDPS_RESPONSE_KEY;

if (requestKey && requestKey.length === 32) {
  console.log(`✅ NDPS_REQUEST_KEY: ${requestKey.substring(0, 8)}... (32 chars)`);
  if (requestKey === '74ABEA4102D67FD3491F23AB9D4636AB') {
    console.log('   ✓ Correct production request key from NTT Data');
  }
} else {
  console.log(`❌ NDPS_REQUEST_KEY: Invalid (${requestKey ? requestKey.length : 0} chars, need 32)`);
  credentialsOk = false;
}

if (responseKey && responseKey.length === 32) {
  console.log(`✅ NDPS_RESPONSE_KEY: ${responseKey.substring(0, 8)}... (32 chars)`);
  if (responseKey === '9B130849756D796521AC4DBEC26D3B2B') {
    console.log('   ✓ Correct production response key from NTT Data');
  }
} else {
  console.log(`❌ NDPS_RESPONSE_KEY: Invalid (${responseKey ? responseKey.length : 0} chars, need 32)`);
  credentialsOk = false;
}

// Check Hash Keys
console.log('\n📋 HASH KEYS (for signatures):');
console.log('-'.repeat(60));

const requestHashKey = envVars.NDPS_REQUEST_HASH_KEY;
const responseHashKey = envVars.NDPS_RESPONSE_HASH_KEY;

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

const corsOrigin = envVars.CORS_ORIGIN;
if (corsOrigin) {
  console.log(`✅ CORS_ORIGIN: ${corsOrigin}`);
  if (corsOrigin.startsWith('https://')) {
    console.log('   ✓ Using HTTPS (secure)');
  } else if (corsOrigin.startsWith('http://localhost') || corsOrigin.startsWith('http://127.0.0.1')) {
    console.log('   ⚠️  Using localhost development URL');
  } else {
    console.log('   ❌ Should use HTTPS for production');
    credentialsOk = false;
  }
} else {
  console.log(`❌ CORS_ORIGIN: NOT SET`);
  credentialsOk = false;
}

// Test Encryption/Decryption
console.log('\n📋 AES ENCRYPTION/DECRYPTION TEST:');
console.log('-'.repeat(60));

try {
  const crypto = require('crypto');
  const algorithm = 'aes-256-cbc';
  const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 'utf8');
  const testData = '{"test":"data"}';

  // Encrypt with request key
  const password = Buffer.from(requestKey, 'utf8');
  const salt = Buffer.from(requestKey, 'utf8');
  const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
  
  const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
  let encrypted = cipher.update(testData, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  console.log(`✅ Encryption successful (${encrypted.length} characters)`);

  // Decrypt with same key
  const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  if (decrypted === testData) {
    console.log('✅ Decryption successful (data matches)');
  } else {
    console.log('⚠️  Decryption returned different data');
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
  console.log('\n✅ PRODUCTION SETUP IS CORRECT!');
  console.log('\n📝 Next steps:');
  console.log('   1. Verify database is accessible with MySQL credentials');
  console.log('   2. Restart backend service: pm2 restart backend-app');
  console.log('   3. Test payment initiation: Try checkout on frontend');
  console.log('   4. Monitor backend logs: pm2 logs backend-app');
  console.log('\n💡 Your backend will now use:');
  console.log(`   - Merchant ID: ${envVars.NDPS_MERCH_ID} (production)`);
  console.log(`   - Product ID: ${envVars.NDPS_PRODUCT_ID} (production)`);
  console.log(`   - Production API: ${envVars.NDPS_API_URL}`);
} else {
  console.log('\n❌ ISSUES FOUND - DO NOT DEPLOY YET!');
  if (nodeEnv !== 'production') {
    console.log('\n🚨 CRITICAL: NODE_ENV must be "production" in backend/.env');
  }
  console.log('\nPlease fix the errors marked with ❌ above.');
}

console.log('\n' + '='.repeat(60) + '\n');

// Return exit code based on verification
process.exit(credentialsOk && nodeEnv === 'production' ? 0 : 1);
