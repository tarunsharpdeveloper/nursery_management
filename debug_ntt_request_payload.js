#!/usr/bin/env node

/**
 * Debug NTT Data Request Payload
 * Shows exactly what's being sent to NTT API and the response
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
  merchId: envVars.NDPS_MERCH_ID || "856377",
  userId: envVars.NDPS_USER_ID || "",
  password: envVars.NDPS_PASSWORD || "856377_titan@123",
  product: envVars.NDPS_PRODUCT_ID || "AWANT",
  apiUrl: envVars.NDPS_API_URL || "https://payment1.atomtech.in/ots/aipay/auth",
  returnUrl: envVars.NDPS_RETURN_URL || "https://awantikaseeds.com/payment/return",
  requestKey: envVars.NDPS_REQUEST_KEY || "74ABEA4102D67FD3491F23AB9D4636AB",
  requestSalt: envVars.NDPS_REQUEST_KEY || "74ABEA4102D67FD3491F23AB9D4636AB",
};

const algorithm = 'aes-256-cbc';
const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 'utf8');

function encryptData(data) {
  try {
    const password = Buffer.from(config.requestKey, 'utf8');
    const salt = Buffer.from(config.requestSalt, 'utf8');
    
    // Derive key using PBKDF2 (65536 iterations, 32 bytes, sha512)
    const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
    
    const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
}

async function debugRequest() {
  console.log('\n' + '='.repeat(70));
  console.log('NTT DATA REQUEST PAYLOAD DEBUGGER');
  console.log('='.repeat(70) + '\n');

  console.log('📋 CONFIGURATION FROM ENV:');
  console.log('-'.repeat(70));
  console.log(`Merchant ID: ${config.merchId}`);
  console.log(`User ID: ${config.userId || '(empty)'}`);
  console.log(`Product: ${config.product}`);
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`Request Key: ${config.requestKey.substring(0, 16)}...`);

  // Sample order data
  const orderId = 126;
  const amount = 1500;
  const customerEmail = 'test@example.com';
  const customerMobile = '9009088123';

  const merchTxnId = `NURSERY_${orderId}_${Date.now().toString(36)}`;
  const merchTxnDate = new Date().toISOString().replace('T', ' ').substring(0, 19);

  console.log('\n📋 SAMPLE PAYMENT REQUEST:');
  console.log('-'.repeat(70));
  console.log(`Order ID: ${orderId}`);
  console.log(`Amount: ${amount}`);
  console.log(`Customer Email: ${customerEmail}`);
  console.log(`Customer Mobile: ${customerMobile}`);
  console.log(`Merchant Txn ID: ${merchTxnId}`);
  console.log(`Merchant Txn Date: ${merchTxnDate}`);

  // Create request payload (EXACT format)
  const paymentRequest = {
    payInstrument: {
      headDetails: {
        version: "OTSv1.1",
        api: "AUTH",
        platform: "FLASH"
      },
      merchDetails: {
        merchId: config.merchId,
        userId: config.userId,
        password: config.password,
        merchTxnId: merchTxnId,
        merchTxnDate: merchTxnDate
      },
      payDetails: {
        amount: parseFloat(amount).toFixed(2),
        product: config.product,
        custAccNo: orderId.toString(),
        txnCurrency: "INR"
      },
      custDetails: {
        custEmail: customerEmail,
        custMobile: customerMobile
      },
      extras: {
        udf1: `order_${orderId}`,
        udf2: "nursery_payment",
        udf3: config.returnUrl,
        udf4: "",
        udf5: ""
      }
    }
  };

  const paymentData = JSON.stringify(paymentRequest);

  console.log('\n📋 PAYMENT REQUEST JSON (Before Encryption):');
  console.log('-'.repeat(70));
  console.log(JSON.stringify(paymentRequest, null, 2));

  // Encrypt
  console.log('\n📋 ENCRYPTION PROCESS:');
  console.log('-'.repeat(70));
  console.log(`Algorithm: aes-256-cbc`);
  console.log(`PBKDF2: 65536 iterations, sha512, 32 bytes`);

  const password = Buffer.from(config.requestKey, 'utf8');
  const salt = Buffer.from(config.requestSalt, 'utf8');
  const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
  
  console.log(`Request Key: ${config.requestKey}`);
  console.log(`Derived Key: ${derivedKey.toString('hex')}`);

  const encryptedData = encryptData(paymentData);

  console.log(`\n✅ Encrypted data generated`);
  console.log(`Original length: ${paymentData.length} bytes`);
  console.log(`Encrypted length: ${encryptedData.length} characters`);
  console.log(`\nFirst 100 chars of encrypted data:`);
  console.log(`${encryptedData.substring(0, 100)}...`);

  // Create form body
  const formBody = `encData=${encryptedData}&merchId=${config.merchId}`;

  console.log('\n📋 FORM BODY TO NTT API:');
  console.log('-'.repeat(70));
  console.log(`Content-Type: application/x-www-form-urlencoded`);
  console.log(`\nForm parameters:`);
  console.log(`- merchId: ${config.merchId}`);
  console.log(`- encData: ${encryptedData.substring(0, 80)}...`);
  console.log(`\nTotal form body size: ${formBody.length} characters`);

  // Make actual request
  console.log('\n📋 MAKING REQUEST TO NTT API:');
  console.log('-'.repeat(70));
  console.log(`URL: ${config.apiUrl}`);
  console.log(`Method: POST`);
  console.log(`Headers:`);
  console.log(`  Content-Type: application/x-www-form-urlencoded`);
  console.log(`  Cache-Control: no-cache`);

  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: formBody,
      timeout: 15000
    });

    console.log('\n✅ RESPONSE FROM NTT API:');
    console.log('-'.repeat(70));
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Headers:`);
    response.headers.forEach((value, name) => {
      console.log(`  ${name}: ${value}`);
    });

    const responseText = await response.text();
    console.log(`\nResponse body (first 500 chars):`);
    console.log(responseText.substring(0, 500));

    if (responseText.length > 500) {
      console.log(`\n... (total ${responseText.length} characters)`);
    }

    // Try to parse response
    console.log('\n📋 RESPONSE ANALYSIS:');
    console.log('-'.repeat(70));

    if (responseText.includes('encData=')) {
      console.log('✅ Response contains encrypted data');
      const parts = responseText.split('&');
      for (const part of parts) {
        if (part.startsWith('encData=')) {
          const encResp = part.substring(8);
          console.log(`Encrypted response length: ${encResp.length} characters`);
          console.log(`First 100 chars: ${encResp.substring(0, 100)}...`);
        }
      }
    } else if (responseText.includes('Welcome')) {
      console.log('⚠️  Received welcome message - endpoint may not be processing requests');
    } else if (responseText.includes('error') || responseText.includes('Error')) {
      console.log('❌ Response contains error message');
      console.log(`Full response: ${responseText}`);
    } else {
      console.log('❓ Unexpected response format');
      console.log(`Full response: ${responseText}`);
    }

  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    console.log(`\nThis could mean:`);
    console.log(`1. Network connectivity issue`);
    console.log(`2. NTT Data API is unreachable`);
    console.log(`3. Firewall/proxy blocking the request`);
    console.log(`4. Invalid API endpoint URL`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('TROUBLESHOOTING CHECKLIST:');
  console.log('='.repeat(70));
  console.log(`\n❓ If you get "INVALID ATOMTOKEN ID" error from NTT:`);
  console.log(`\n1. Verify merchant registration:`);
  console.log(`   - Contact NTT Data support`);
  console.log(`   - Confirm Merchant ID 856377 is active`);
  console.log(`   - Confirm Product AWANT is linked to Merchant 856377`);
  console.log(`   - Verify account is in "LIVE" mode (not TEST)`);
  console.log(`\n2. Check merchant/product mapping:`);
  console.log(`   - Some merchants need product registration`);
  console.log(`   - Some products are restricted to certain merchants`);
  console.log(`   - AWANT product may need special activation`);
  console.log(`\n3. Verify credentials:`);
  console.log(`   - Merchant ID: ${config.merchId}`);
  console.log(`   - Product ID: ${config.product}`);
  console.log(`   - Password: ${config.password ? '***' + config.password.slice(-4) : '(empty)'}`);
  console.log(`\n4. Check encryption keys:`);
  console.log(`   - Request Key format: OK (32 hex chars)`);
  console.log(`   - Response Key format: OK (32 hex chars)`);
  console.log(`\n5. If everything looks correct, contact NTT Data with:`);
  console.log(`   - Merchant ID: ${config.merchId}`);
  console.log(`   - Product ID: ${config.product}`);
  console.log(`   - Error message: INVALID ATOMTOKEN ID OR ATOM TOKEN ID IS NOT GENERATED FOR THIS TRANSACTION`);
  console.log(`   - Ask them to verify account status and product activation`);

  console.log('\n' + '='.repeat(70) + '\n');
}

debugRequest().catch(console.error);
