#!/usr/bin/env node
/**
 * Comprehensive NDPS Diagnostic Script
 * Tests the entire payment flow configuration
 * Run: node full_ndps_diagnostic.js (from backend directory or root with backend/.env)
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Load .env file manually (without requiring dotenv)
function loadEnv() {
  const envPath = path.join(__dirname, 'backend', '.env');
  const envRootPath = path.join(__dirname, '.env');
  
  const fileToRead = fs.existsSync(envPath) ? envPath : (fs.existsSync(envRootPath) ? envRootPath : null);
  
  if (fileToRead) {
    const content = fs.readFileSync(fileToRead, 'utf8');
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        const value = values.join('=').replace(/^['"]|['"]$/g, '');
        if (key) {
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

loadEnv();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function success(message) {
  log('✅ ' + message, 'green');
}

function errorMsg(message) {
  log('❌ ' + message, 'red');
}

function warning(message) {
  log('⚠️  ' + message, 'yellow');
}

function info(message) {
  log('ℹ️  ' + message, 'blue');
}

let testsPassed = 0;
let testsFailed = 0;

section('NDPS COMPREHENSIVE DIAGNOSTIC');

// Test 1: Environment Variables
section('Test 1: Environment Variables Configuration');

const envVars = {
  'NODE_ENV': 'production',
  'NDPS_MERCH_ID': '856377',
  'NDPS_USER_ID': '856377',
  'NDPS_PRODUCT_ID': 'AWANT',
  'NDPS_API_URL': 'https://payment1.atomtech.in/ots/aipay/auth',
  'NDPS_REQUEST_KEY': '74ABEA4102D67FD3491F23AB9D4636AB',
  'NDPS_RESPONSE_KEY': '9B130849756D796521AC4DBEC26D3B2B',
  'NDPS_REQUEST_HASH_KEY': '27786aad29c63b6a3a',
  'NDPS_RESPONSE_HASH_KEY': '9f9153a2a8671ae683'
};

let envPassed = true;
for (const [key, expectedValue] of Object.entries(envVars)) {
  const actualValue = process.env[key];
  const isSet = actualValue !== undefined && actualValue !== '';
  
  if (!isSet) {
    errorMsg(`${key} is NOT SET`);
    envPassed = false;
    testsFailed++;
  } else if (key !== 'NDPS_API_URL' && actualValue !== expectedValue) {
    warning(`${key} might be incorrect`);
    info(`  Expected: ${expectedValue.substring(0, 20)}...`);
    info(`  Actual:   ${actualValue.substring(0, 20)}...`);
  } else {
    success(`${key} is set correctly`);
    testsPassed++;
  }
}

if (envPassed) {
  success('All environment variables are properly configured');
} else {
  errorMsg('Some environment variables are missing or incorrect');
}

// Test 2: Environment Detection
section('Test 2: Environment Detection');

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  success('Running in PRODUCTION environment');
  testsPassed++;
} else {
  warning('Running in DEVELOPMENT environment');
  warning('For live payments, NODE_ENV must be set to "production"');
  testsFailed++;
}

// Test 3: AES Encryption
section('Test 3: AES Encryption/Decryption');

try {
  const algorithm = 'aes-256-cbc';
  const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 'utf8');
  
  // Test data
  const testData = JSON.stringify({
    payInstrument: {
      headDetails: { version: 'OTSv1.1', api: 'AUTH', platform: 'FLASH' },
      merchDetails: { merchId: '856377', userId: '856377', password: '856377_titan@123' },
      payDetails: { amount: '100.00', product: 'AWANT', custAccNo: '1', txnCurrency: 'INR' },
      custDetails: { custEmail: 'test@example.com', custMobile: '9999999999' }
    }
  });
  
  // Encrypt
  const requestPassword = Buffer.from(process.env.NDPS_REQUEST_KEY || '74ABEA4102D67FD3491F23AB9D4636AB', 'utf8');
  const requestSalt = Buffer.from(process.env.NDPS_REQUEST_KEY || '74ABEA4102D67FD3491F23AB9D4636AB', 'utf8');
  const requestKey = crypto.pbkdf2Sync(requestPassword, requestSalt, 65536, 32, 'sha512');
  
  const cipher = crypto.createCipheriv(algorithm, requestKey, iv);
  let encrypted = cipher.update(testData, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  success('AES Encryption: Successful');
  info(`  Encrypted data length: ${encrypted.length} characters`);
  testsPassed++;
  
  // Decrypt
  const responsePassword = Buffer.from(process.env.NDPS_RESPONSE_KEY || '9B130849756D796521AC4DBEC26D3B2B', 'utf8');
  const responseSalt = Buffer.from(process.env.NDPS_RESPONSE_KEY || '9B130849756D796521AC4DBEC26D3B2B', 'utf8');
  const responseKey = crypto.pbkdf2Sync(responsePassword, responseSalt, 65536, 32, 'sha512');
  
  const decipher = crypto.createDecipheriv(algorithm, responseKey, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  const decryptedData = JSON.parse(decrypted);
  success('AES Decryption: Successful');
  info(`  Merchant ID from decrypted: ${decryptedData.payInstrument.merchDetails.merchId}`);
  testsPassed++;
  
} catch (error) {
  errorMsg(`Encryption/Decryption test failed: ${error.message}`);
  testsFailed++;
}

// Test 4: API Endpoint Format
section('Test 4: NDPS API Configuration');

const apiUrl = process.env.NDPS_API_URL || 'https://payment1.atomtech.in/ots/aipay/auth';
if (apiUrl.includes('payment1.atomtech.in')) {
  success('Using correct production API URL');
  testsPassed++;
} else if (apiUrl.includes('caller.atomtech.in')) {
  warning('Using UAT API URL instead of production');
  testsFailed++;
} else {
  errorMsg('Unknown API URL');
  testsFailed++;
}

// Test 5: Key Format Validation
section('Test 5: Key Format Validation');

const reqKey = process.env.NDPS_REQUEST_KEY || '74ABEA4102D67FD3491F23AB9D4636AB';
const respKey = process.env.NDPS_RESPONSE_KEY || '9B130849756D796521AC4DBEC26D3B2B';

if (reqKey.length === 32 && /^[0-9A-F]{32}$/i.test(reqKey)) {
  success('Request Key format is valid (32 hex characters)');
  testsPassed++;
} else {
  errorMsg(`Request Key format invalid. Expected 32 hex chars, got: ${reqKey.length}`);
  testsFailed++;
}

if (respKey.length === 32 && /^[0-9A-F]{32}$/i.test(respKey)) {
  success('Response Key format is valid (32 hex characters)');
  testsPassed++;
} else {
  errorMsg(`Response Key format invalid. Expected 32 hex chars, got: ${respKey.length}`);
  testsFailed++;
}

// Test 6: Merchant Configuration
section('Test 6: Merchant Configuration');

const merchId = process.env.NDPS_MERCH_ID;
const product = process.env.NDPS_PRODUCT_ID;

if (merchId === '856377') {
  success('Merchant ID is production ID (856377)');
  testsPassed++;
} else if (merchId === '446442') {
  warning('Merchant ID is UAT ID (446442)');
  testsFailed++;
} else {
  warning(`Unknown Merchant ID: ${merchId}`);
  testsFailed++;
}

if (product === 'AWANT') {
  success('Product ID is production product (AWANT)');
  testsPassed++;
} else if (product === 'NSE') {
  warning('Product ID is UAT product (NSE)');
  testsFailed++;
} else {
  warning(`Unknown Product ID: ${product}`);
  testsFailed++;
}

// Final Summary
section('DIAGNOSTIC SUMMARY');

const totalTests = testsPassed + testsFailed;
const passPercentage = totalTests > 0 ? ((testsPassed / totalTests) * 100).toFixed(1) : 0;

log(`\nTests Passed: ${testsPassed}/${totalTests} (${passPercentage}%)\n`);

if (testsFailed === 0) {
  success('ALL TESTS PASSED! ✨');
  log('\n✅ Your NDPS configuration appears to be correct for production.');
  log('✅ Payment gateway should be working properly.');
  log('\n📝 Next steps:');
  log('   1. Verify the backend is running with this .env file');
  log('   2. Test the /api/ndps/initiate endpoint');
  log('   3. Complete a test payment through the frontend');
  log('   4. Check admin dashboard for transaction IDs');
} else {
  errorMsg(`${testsFailed} TEST(S) FAILED`);
  log('\n⚠️  Please fix the issues above before proceeding.');
  log('\n📝 Common fixes:');
  log('   1. Copy backend_production_FIXED.env to backend/.env');
  log('   2. Make sure NODE_ENV is set to "production"');
  log('   3. Restart your backend service: pm2 restart backend-app');
  log('   4. Run this diagnostic again to verify');
}

log('\n' + '='.repeat(60) + '\n');

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);
