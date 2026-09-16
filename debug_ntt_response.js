#!/usr/bin/env node
/**
 * Debug script to capture NTT Data response format
 * This helps understand what NTT sends back
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load .env
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
        if (key) process.env[key.trim()] = value;
      }
    });
  }
}

loadEnv();

const config = {
  merchId: process.env.NDPS_MERCH_ID || '856377',
  userId: process.env.NDPS_USER_ID || '856377',
  password: process.env.NDPS_PASSWORD || '856377_titan@123',
  apiUrl: process.env.NDPS_API_URL || 'https://payment1.atomtech.in/ots/aipay/auth',
  product: process.env.NDPS_PRODUCT_ID || 'AWANT',
  requestKey: process.env.NDPS_REQUEST_KEY || '74ABEA4102D67FD3491F23AB9D4636AB',
  responseKey: process.env.NDPS_RESPONSE_KEY || '9B130849756D796521AC4DBEC26D3B2B'
};

const algorithm = 'aes-256-cbc';
const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 'utf8');

function encryptData(data) {
  const password = Buffer.from(config.requestKey, 'utf8');
  const salt = Buffer.from(config.requestKey, 'utf8');
  const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
  
  const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return encrypted;
}

async function testRequest() {
  try {
    console.log('🔍 DEBUG: NTT DATA RESPONSE FORMAT\n');
    console.log('Configuration:');
    console.log('  Merchant ID:', config.merchId);
    console.log('  Product:', config.product);
    console.log('  API URL:', config.apiUrl);
    console.log('  Request Key:', config.requestKey.substring(0, 8) + '...');
    console.log('  Response Key:', config.responseKey.substring(0, 8) + '...\n');

    // Create test request
    const testPayload = {
      payInstrument: {
        headDetails: {
          version: 'OTSv1.1',
          api: 'AUTH',
          platform: 'FLASH'
        },
        merchDetails: {
          merchId: config.merchId,
          userId: config.userId,
          password: config.password,
          merchTxnId: `DEBUG_${Date.now()}`,
          merchTxnDate: new Date().toISOString().replace('T', ' ').substring(0, 19)
        },
        payDetails: {
          amount: '1.00',
          product: config.product,
          custAccNo: 'TEST123',
          txnCurrency: 'INR'
        },
        custDetails: {
          custEmail: 'test@example.com',
          custMobile: '9999999999'
        },
        extras: {
          udf1: 'test_order',
          udf2: 'debug_payment',
          udf3: 'https://awantikaseeds.com/payment/return',
          udf4: '',
          udf5: ''
        }
      }
    };

    const paymentData = JSON.stringify(testPayload);
    console.log('📤 Sending request...\n');
    
    const encryptedData = encryptData(paymentData);
    const formBody = `encData=${encryptedData}&merchId=${config.merchId}`;

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: formBody,
      timeout: 15000
    });

    const responseText = await response.text();

    console.log('📥 Response received:\n');
    console.log('  Status:', response.status);
    console.log('  Status Text:', response.statusText);
    console.log('  Content-Length:', responseText.length);
    console.log('  Content-Type:', response.headers.get('content-type'));
    console.log('\n📋 Response Content (first 500 chars):\n');
    console.log(responseText.substring(0, 500));
    
    if (responseText.length > 500) {
      console.log('\n  ... [truncated, total length:', responseText.length, 'chars] ...\n');
    }

    // Try to parse
    console.log('🔧 Parsing response...\n');

    if (responseText.includes('encData=')) {
      console.log('✅ Response contains "encData=" - standard format detected\n');
      const parts = responseText.split('&');
      for (const part of parts) {
        if (part.startsWith('encData=')) {
          const encData = part.substring(8);
          console.log('  Encrypted data length:', encData.length, 'characters');
          console.log('  Encrypted data (first 100 chars):', encData.substring(0, 100) + '...\n');
          
          // Try to decrypt
          console.log('🔓 Attempting decryption...\n');
          try {
            const password = Buffer.from(config.responseKey, 'utf8');
            const salt = Buffer.from(config.responseKey, 'utf8');
            const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
            
            const encryptedBuffer = Buffer.from(encData, 'hex');
            const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
            let decrypted = decipher.update(encryptedBuffer);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            const decryptedText = decrypted.toString('utf8');
            console.log('✅ Decryption successful!\n');
            console.log('📄 Decrypted response (first 500 chars):\n');
            console.log(decryptedText.substring(0, 500));
            
            try {
              const parsed = JSON.parse(decryptedText);
              console.log('\n✅ Valid JSON detected');
              console.log('✅ Response keys:', Object.keys(parsed));
            } catch (e) {
              console.log('\n⚠️  Response is not valid JSON');
            }
          } catch (decryptError) {
            console.log('❌ Decryption failed:', decryptError.message);
            console.log('\n🔍 Troubleshooting:');
            console.log('   1. Is the response key correct?');
            console.log('   2. Is NTT Data using a different encryption method?');
            console.log('   3. Is the IV different?');
          }
          break;
        }
      }
    } else if (responseText.length > 50) {
      console.log('❓ Response does not contain "encData=" - unknown format\n');
      console.log('Full response:\n', responseText);
    } else {
      console.log('❌ Empty or invalid response from NTT Data');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n🆘 Troubleshooting:');
    console.error('   1. Check internet connectivity to payment1.atomtech.in');
    console.error('   2. Verify merchant ID is registered for production');
    console.error('   3. Check if API URL is correct');
    console.error('   4. Verify credentials with NTT Data support');
  }
}

testRequest().catch(console.error);