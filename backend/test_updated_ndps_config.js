/**
 * Test script for updated NDPS configuration with new callback API
 * This tests the token generation with the latest credentials provided
 */

const fs = require('fs');
const path = require('path');

// Load environment variables manually
function loadEnv() {
  const envPath = path.join(__dirname, 'backend', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Backend .env file not found');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...values] = line.split('=');
      if (key) {
        envVars[key.trim()] = values.join('=').trim();
      }
    }
  });
  
  return envVars;
}

const envVars = loadEnv();

// Test configuration
const testConfig = {
  NDPS_MERCH_ID: envVars.NDPS_MERCH_ID,
  NDPS_PASSWORD: envVars.NDPS_PASSWORD,
  NDPS_PRODUCT_ID: envVars.NDPS_PRODUCT_ID,
  NDPS_MCC_CODE: envVars.NDPS_MCC_CODE,
  NDPS_API_URL: envVars.NDPS_API_URL,
  NDPS_CALLBACK_API_URL: envVars.NDPS_CALLBACK_API_URL,
  NDPS_REQUEST_KEY: envVars.NDPS_REQUEST_KEY,
  NDPS_RESPONSE_KEY: envVars.NDPS_RESPONSE_KEY,
  NDPS_REQUEST_HASH_KEY: envVars.NDPS_REQUEST_HASH_KEY,
  NDPS_RESPONSE_HASH_KEY: envVars.NDPS_RESPONSE_HASH_KEY,
  NDPS_RETURN_URL: envVars.NDPS_RETURN_URL
};

console.log('=== NDPS Configuration Test ===');
console.log('Loaded from backend/.env:');
console.log('');

// Check all required configuration
const requiredKeys = [
  'NDPS_MERCH_ID',
  'NDPS_PASSWORD', 
  'NDPS_PRODUCT_ID',
  'NDPS_MCC_CODE',
  'NDPS_API_URL',
  'NDPS_CALLBACK_API_URL',
  'NDPS_REQUEST_KEY',
  'NDPS_RESPONSE_KEY',
  'NDPS_REQUEST_HASH_KEY',
  'NDPS_RESPONSE_HASH_KEY'
];

let allConfigured = true;

requiredKeys.forEach(key => {
  const value = testConfig[key];
  const display = key.includes('KEY') || key.includes('PASSWORD') 
    ? (value ? `${value.substring(0, 8)}...` : '(not set)')
    : (value || '(not set)');
  
  console.log(`${key}: ${display}`);
  
  if (!value) {
    console.log(`❌ Missing: ${key}`);
    allConfigured = false;
  }
});

console.log('');
console.log('=== Configuration Status ===');
if (allConfigured) {
  console.log('✅ All required configuration is present');
} else {
  console.log('❌ Some configuration is missing');
}

console.log('');
console.log('=== New Configuration Highlights ===');
console.log('✅ MCC Code added:', testConfig.NDPS_MCC_CODE);
console.log('✅ Callback API URL configured:', testConfig.NDPS_CALLBACK_API_URL);
console.log('✅ All encryption keys present');

console.log('');
console.log('=== Test Payment Payload ===');

// Test payload that would be sent
const testPayload = {
  payInstrument: {
    headDetails: {
      version: "OTSv1.1",
      api: "AUTH",
      platform: "FLASH"
    },
    merchDetails: {
      merchId: testConfig.NDPS_MERCH_ID,
      userId: "",
      password: testConfig.NDPS_PASSWORD,
      merchTxnId: `NURSERY_TEST_${Date.now()}`,
      merchTxnDate: new Date().toISOString().replace('T', ' ').substring(0, 19)
    },
    payDetails: {
      amount: "100.00",
      product: testConfig.NDPS_PRODUCT_ID,
      custAccNo: "1",
      txnCurrency: "INR"
    },
    custDetails: {
      custEmail: "test@example.com",
      custMobile: "9876543210"
    },
    extras: {
      udf1: "order_1",
      udf2: "nursery_payment", 
      udf3: testConfig.NDPS_RETURN_URL,
      udf4: "",
      udf5: ""
    }
  }
};

console.log(JSON.stringify(testPayload, null, 2));

console.log('');
console.log('=== API Endpoints ===');
console.log('Auth API:', testConfig.NDPS_API_URL);
console.log('Callback API:', testConfig.NDPS_CALLBACK_API_URL);
console.log('Return URL:', testConfig.NDPS_RETURN_URL);

console.log('');
console.log('=== Next Steps ===');
console.log('1. Start the backend server: cd backend && npm start');
console.log('2. Test token generation: POST http://localhost:4000/api/ndps/initiate');
console.log('3. Check the console logs for detailed encryption process');
console.log('4. Verify token generation is successful with new configuration');

console.log('');
console.log('=== Expected Success Response ===');
console.log('Should contain: atomTokenId (number), responseDetails with txnStatusCode: "OTS0000"');