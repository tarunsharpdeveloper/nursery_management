#!/usr/bin/env node

/**
 * Comprehensive URL and Configuration Verification
 * Tests all URLs, domains, and configurations for NDPS setup
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

const backendEnv = parseEnv(path.join(__dirname, 'backend', '.env'));
const frontendEnv = parseEnv(path.join(__dirname, 'frontend', '.env'));

console.log('\n' + '='.repeat(80));
console.log('COMPREHENSIVE URL AND CONFIGURATION VERIFICATION');
console.log('='.repeat(80) + '\n');

// 1. Environment Variables Check
console.log('📋 BACKEND ENVIRONMENT VARIABLES:');
console.log('-'.repeat(80));
const backendConfig = {
  'NODE_ENV': backendEnv.NODE_ENV,
  'CORS_ORIGIN': backendEnv.CORS_ORIGIN,
  'NDPS_MERCH_ID': backendEnv.NDPS_MERCH_ID,
  'NDPS_PASSWORD': backendEnv.NDPS_PASSWORD,
  'NDPS_PRODUCT_ID': backendEnv.NDPS_PRODUCT_ID,
  'NDPS_API_URL': backendEnv.NDPS_API_URL,
  'NDPS_RESPONSE_URL': backendEnv.NDPS_RESPONSE_URL,
  'NDPS_RETURN_URL': backendEnv.NDPS_RETURN_URL,
  'NDPS_REQUEST_KEY': backendEnv.NDPS_REQUEST_KEY,
  'NDPS_RESPONSE_KEY': backendEnv.NDPS_RESPONSE_KEY
};

Object.entries(backendConfig).forEach(([key, value]) => {
  if (value) {
    if (key.includes('KEY') || key.includes('PASSWORD')) {
      console.log(`✅ ${key}: ${value.substring(0, 8)}... (${value.length} chars)`);
    } else {
      console.log(`✅ ${key}: ${value}`);
    }
  } else {
    console.log(`❌ ${key}: NOT SET`);
  }
});

console.log('\n📋 FRONTEND ENVIRONMENT VARIABLES:');
console.log('-'.repeat(80));
const frontendConfig = {
  'NEXT_PUBLIC_API_BASE_URL': frontendEnv.NEXT_PUBLIC_API_BASE_URL,
  'NEXT_PUBLIC_FRONTEND_URL': frontendEnv.NEXT_PUBLIC_FRONTEND_URL,
  'NEXT_PUBLIC_NDPS_CDN_URL': frontendEnv.NEXT_PUBLIC_NDPS_CDN_URL,
  'NODE_ENV': frontendEnv.NODE_ENV
};

Object.entries(frontendConfig).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}: ${value}`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
  }
});

// 2. URL Configuration Analysis
console.log('\n📋 URL CONFIGURATION ANALYSIS:');
console.log('-'.repeat(80));

const expectedUrls = {
  'Frontend Domain': 'https://awantikaseeds.com',
  'Backend API': 'https://api.awantikaseeds.com',
  'NTT API (Production)': 'https://payment1.atomtech.in/ots/aipay/auth',
  'AtomPaynetz CDN (Production)': 'https://psa.atomtech.in/staticdata/ots/js/atomcheckout.js'
};

const actualUrls = {
  'Frontend Domain': backendEnv.CORS_ORIGIN,
  'Backend API': frontendEnv.NEXT_PUBLIC_API_BASE_URL,
  'NTT API (Production)': backendEnv.NDPS_API_URL,
  'AtomPaynetz CDN (Production)': frontendEnv.NEXT_PUBLIC_NDPS_CDN_URL
};

Object.entries(expectedUrls).forEach(([key, expected]) => {
  const actual = actualUrls[key];
  if (actual === expected) {
    console.log(`✅ ${key}: CORRECT`);
    console.log(`   ${actual}`);
  } else {
    console.log(`❌ ${key}: MISMATCH`);
    console.log(`   Expected: ${expected}`);
    console.log(`   Actual:   ${actual || 'NOT SET'}`);
  }
});

// 3. URL Accessibility Test
console.log('\n📋 URL ACCESSIBILITY TESTS:');
console.log('-'.repeat(80));

async function testUrl(name, url, options = {}) {
  try {
    console.log(`Testing ${name}...`);
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000
    });
    
    console.log(`✅ ${name}: ${response.status} ${response.statusText}`);
    
    if (options.checkContent && response.ok) {
      const text = await response.text();
      if (text.length > 0) {
        console.log(`   Content length: ${text.length} characters`);
      }
    }
    
    return { success: true, status: response.status, statusText: response.statusText };
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test all URLs
const urlTests = [
  { name: 'Frontend Site', url: 'https://awantikaseeds.com' },
  { name: 'Backend API Health', url: 'https://api.awantikaseeds.com/api/health' },
  { 
    name: 'Backend CORS Preflight', 
    url: 'https://api.awantikaseeds.com/api/products',
    options: { 
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://awantikaseeds.com',
        'Access-Control-Request-Method': 'PATCH'
      }
    }
  },
  { 
    name: 'AtomPaynetz CDN Script', 
    url: frontendEnv.NEXT_PUBLIC_NDPS_CDN_URL || 'https://psa.atomtech.in/staticdata/ots/js/atomcheckout.js',
    options: { checkContent: true }
  }
];

// Run URL tests
for (const test of urlTests) {
  await testUrl(test.name, test.url, test.options || {});
}

// 4. NDPS Configuration Test
console.log('\n📋 NDPS CONFIGURATION TEST:');
console.log('-'.repeat(80));

async function testNDPSConfig() {
  const algorithm = 'aes-256-cbc';
  const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 'utf8');
  
  const testPayload = {
    payInstrument: {
      headDetails: {
        version: "OTSv1.1",
        api: "AUTH",
        platform: "FLASH"
      },
      merchDetails: {
        merchId: backendEnv.NDPS_MERCH_ID || "856377",
        userId: backendEnv.NDPS_USER_ID || "",
        password: backendEnv.NDPS_PASSWORD || "76ce2af2",
        merchTxnId: `TEST_${Date.now()}`,
        merchTxnDate: new Date().toISOString().replace('T', ' ').substring(0, 19)
      },
      payDetails: {
        amount: "10.00",
        product: backendEnv.NDPS_PRODUCT_ID || "AWANT",
        custAccNo: "TEST001",
        txnCurrency: "INR"
      },
      custDetails: {
        custEmail: "test@awantikaseeds.com",
        custMobile: "9000000000"
      },
      extras: {
        udf1: "test_order",
        udf2: "url_verification",
        udf3: backendEnv.NDPS_RETURN_URL || "https://awantikaseeds.com/payment/return",
        udf4: "",
        udf5: ""
      }
    }
  };

  console.log('Testing NDPS API with current configuration...');
  console.log(`Merchant ID: ${backendEnv.NDPS_MERCH_ID}`);
  console.log(`Password: ${backendEnv.NDPS_PASSWORD}`);
  console.log(`Product: ${backendEnv.NDPS_PRODUCT_ID}`);
  console.log(`API URL: ${backendEnv.NDPS_API_URL}`);
  console.log(`Return URL: ${backendEnv.NDPS_RETURN_URL}`);

  try {
    // Encrypt payload
    const payloadData = JSON.stringify(testPayload);
    const password = Buffer.from(backendEnv.NDPS_REQUEST_KEY, 'utf8');
    const salt = Buffer.from(backendEnv.NDPS_REQUEST_KEY, 'utf8');
    const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
    
    const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
    let encrypted = cipher.update(payloadData, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const formBody = `encData=${encrypted}&merchId=${backendEnv.NDPS_MERCH_ID}`;

    // Call NTT API
    const response = await fetch(backendEnv.NDPS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: formBody,
      timeout: 15000
    });

    const responseText = await response.text();
    
    console.log(`✅ NTT API Response: ${response.status} ${response.statusText}`);
    console.log(`Response length: ${responseText.length} characters`);

    // Try to decrypt response
    if (responseText.includes('encData=')) {
      const parts = responseText.split('&');
      for (const part of parts) {
        if (part.startsWith('encData=')) {
          const encResp = part.substring(8);
          
          try {
            const responsePassword = Buffer.from(backendEnv.NDPS_RESPONSE_KEY, 'utf8');
            const responseSalt = Buffer.from(backendEnv.NDPS_RESPONSE_KEY, 'utf8');
            const responseDerivedKey = crypto.pbkdf2Sync(responsePassword, responseSalt, 65536, 32, 'sha512');
            
            const encryptedBuffer = Buffer.from(encResp, 'hex');
            const decipher = crypto.createDecipheriv(algorithm, responseDerivedKey, iv);
            let decrypted = decipher.update(encryptedBuffer);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            const decryptedText = decrypted.toString('utf8');
            const jsonResponse = JSON.parse(decryptedText);
            
            if (jsonResponse.responseDetails) {
              const status = jsonResponse.responseDetails.txnStatusCode;
              const message = jsonResponse.responseDetails.txnMessage;
              const description = jsonResponse.responseDetails.txnDescription;
              
              console.log(`📋 NDPS Response Details:`);
              console.log(`   Status: ${status}`);
              console.log(`   Message: ${message}`);
              console.log(`   Description: ${description}`);
              
              if (status === 'OTS0000') {
                console.log('🎉 SUCCESS: All URLs and configuration are correct!');
                if (jsonResponse.atomTokenId) {
                  console.log(`   Token Generated: ${jsonResponse.atomTokenId}`);
                }
              } else if (status === 'OTS0678') {
                console.log('🚨 DOMAIN ISSUE: "UNIDENTIFIED MERCHANT DOMAIN"');
                console.log('   ➜ Contact NTT Data to whitelist: awantikaseeds.com');
                console.log('   ➜ Merchant 856377 needs domain registration');
              } else if (status === 'OTS0654') {
                console.log('❌ PASSWORD ISSUE: Check merchant password');
              } else {
                console.log(`⚠️  Other Issue: ${status} - ${message}`);
              }
            } else {
              console.log('⚠️  Unexpected response format');
              console.log(decryptedText);
            }
            
          } catch (decryptError) {
            console.log('❌ Could not decrypt response:', decryptError.message);
          }
          break;
        }
      }
    } else {
      console.log('⚠️  No encrypted response found');
      console.log('Response:', responseText.substring(0, 200));
    }

  } catch (error) {
    console.log(`❌ NDPS Test Failed: ${error.message}`);
  }
}

await testNDPSConfig();

// 5. Summary and Recommendations
console.log('\n' + '='.repeat(80));
console.log('SUMMARY AND RECOMMENDATIONS');
console.log('='.repeat(80));

console.log('\n📊 CONFIGURATION STATUS:');

// Check critical configurations
const criticalChecks = [
  { name: 'Backend NODE_ENV', value: backendEnv.NODE_ENV, expected: 'production' },
  { name: 'CORS Origin', value: backendEnv.CORS_ORIGIN, expected: 'https://awantikaseeds.com' },
  { name: 'Frontend API URL', value: frontendEnv.NEXT_PUBLIC_API_BASE_URL, expected: 'https://api.awantikaseeds.com' },
  { name: 'NDPS CDN URL', value: frontendEnv.NEXT_PUBLIC_NDPS_CDN_URL, expected: 'https://psa.atomtech.in/staticdata/ots/js/atomcheckout.js' },
  { name: 'NTT API URL', value: backendEnv.NDPS_API_URL, expected: 'https://payment1.atomtech.in/ots/aipay/auth' },
  { name: 'Merchant ID', value: backendEnv.NDPS_MERCH_ID, expected: '856377' },
  { name: 'Product ID', value: backendEnv.NDPS_PRODUCT_ID, expected: 'AWANT' },
  { name: 'Transaction Password', value: backendEnv.NDPS_PASSWORD, expected: '76ce2af2' }
];

let allCorrect = true;
criticalChecks.forEach(check => {
  if (check.value === check.expected) {
    console.log(`✅ ${check.name}: CORRECT`);
  } else {
    console.log(`❌ ${check.name}: ${check.value} (expected: ${check.expected})`);
    allCorrect = false;
  }
});

console.log('\n📝 NEXT ACTIONS:');
if (allCorrect) {
  console.log('✅ All URLs and configurations are correct!');
  console.log('✅ Technical setup is ready for production');
  console.log('\n🚨 REMAINING ISSUE: Domain Registration');
  console.log('   ➜ Contact NTT Data to whitelist domain: awantikaseeds.com');
  console.log('   ➜ Provide: Merchant ID 856377, Domain awantikaseeds.com');
  console.log('   ➜ This is typically resolved within 1 business day');
} else {
  console.log('❌ Fix the configuration issues above first');
  console.log('❌ Then contact NTT Data for domain registration');
}

console.log('\n📞 NTT DATA CONTACT:');
console.log('   Dashboard: https://titan.atomtech.in/titan_merchant_console');
console.log('   Support: Contact technical team');
console.log('   Request: "Please whitelist domain awantikaseeds.com for Merchant 856377"');

console.log('\n' + '='.repeat(80) + '\n');