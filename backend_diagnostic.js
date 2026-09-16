// Simple diagnostic script to check NDPS configuration
// Load .env file manually (without requiring dotenv)
const fs = require('fs');
const path = require('path');

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

console.log('=== BACKEND DIAGNOSTIC ===');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('NDPS_MERCH_ID:', process.env.NDPS_MERCH_ID || 'NOT SET');
console.log('NDPS_USER_ID:', process.env.NDPS_USER_ID || 'NOT SET');
console.log('NDPS_PRODUCT_ID:', process.env.NDPS_PRODUCT_ID || 'NOT SET');
console.log('NDPS_API_URL:', process.env.NDPS_API_URL || 'NOT SET');
console.log('NDPS_REQUEST_KEY:', process.env.NDPS_REQUEST_KEY ? process.env.NDPS_REQUEST_KEY.substring(0, 8) + '...' : 'NOT SET');
console.log('NDPS_RESPONSE_KEY:', process.env.NDPS_RESPONSE_KEY ? process.env.NDPS_RESPONSE_KEY.substring(0, 8) + '...' : 'NOT SET');
console.log('NDPS_REQUEST_HASH_KEY:', process.env.NDPS_REQUEST_HASH_KEY ? process.env.NDPS_REQUEST_HASH_KEY.substring(0, 8) + '...' : 'NOT SET');
console.log('NDPS_RESPONSE_HASH_KEY:', process.env.NDPS_RESPONSE_HASH_KEY ? process.env.NDPS_RESPONSE_HASH_KEY.substring(0, 8) + '...' : 'NOT SET');

// Check if production environment is properly detected
const isProduction = process.env.NODE_ENV === 'production';
console.log('\nEnvironment Detection:', isProduction ? 'PRODUCTION' : 'UAT/DEVELOPMENT');

// Expected values for production
console.log('\n=== EXPECTED PRODUCTION VALUES ===');
console.log('NDPS_MERCH_ID should be: 856377');
console.log('NDPS_PRODUCT_ID should be: AWANT');
console.log('NDPS_API_URL should be: https://payment1.atomtech.in/ots/aipay/auth');
console.log('NDPS_REQUEST_KEY should start with: 74ABEA41...');
console.log('NDPS_RESPONSE_KEY should start with: 9B130849...');

// Check configuration problems
console.log('\n=== CONFIGURATION CHECK ===');
let issues = [];

if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
  issues.push('❌ NODE_ENV is not set to "production"');
} else {
  console.log('✅ NODE_ENV is correctly set to production');
}

if (!process.env.NDPS_MERCH_ID || process.env.NDPS_MERCH_ID !== '856377') {
  issues.push('❌ NDPS_MERCH_ID is not set to live value (856377)');
} else {
  console.log('✅ NDPS_MERCH_ID is correctly set');
}

if (!process.env.NDPS_PRODUCT_ID || process.env.NDPS_PRODUCT_ID !== 'AWANT') {
  issues.push('❌ NDPS_PRODUCT_ID is not set to live value (AWANT)');
} else {
  console.log('✅ NDPS_PRODUCT_ID is correctly set');
}

if (!process.env.NDPS_API_URL || !process.env.NDPS_API_URL.includes('payment1.atomtech.in')) {
  issues.push('❌ NDPS_API_URL is not set to production URL');
} else {
  console.log('✅ NDPS_API_URL is correctly set');
}

if (!process.env.NDPS_REQUEST_KEY || !process.env.NDPS_REQUEST_KEY.startsWith('74ABEA41')) {
  issues.push('❌ NDPS_REQUEST_KEY is not set to production AES key');
} else {
  console.log('✅ NDPS_REQUEST_KEY is correctly set');
}

if (!process.env.NDPS_RESPONSE_KEY || !process.env.NDPS_RESPONSE_KEY.startsWith('9B130849')) {
  issues.push('❌ NDPS_RESPONSE_KEY is not set to production AES key');
} else {
  console.log('✅ NDPS_RESPONSE_KEY is correctly set');
}

if (issues.length > 0) {
  console.log('\n🚨 CONFIGURATION ISSUES FOUND:');
  issues.forEach(issue => console.log(issue));
  console.log('\n📋 ACTION REQUIRED:');
  console.log('1. Copy backend_production_FIXED.env to your backend/.env file');
  console.log('2. Restart your backend service');
  console.log('3. Ensure NODE_ENV=production is set');
} else {
  console.log('\n🎉 ALL CONFIGURATION CHECKS PASSED!');
  console.log('The NDPS configuration appears to be correct for production.');
}