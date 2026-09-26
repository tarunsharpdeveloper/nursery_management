#!/usr/bin/env node

/**
 * Test Correct Transaction Password
 * Verify that the new password (76ce2af2) works with NTT Data
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
  password: envVars.NDPS_PASSWORD || "76ce2af2",
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

async function testNewPassword() {
  console.log('\n' + '='.repeat(70));
  console.log('TESTING CORRECT TRANSACTION PASSWORD');
  console.log('='.repeat(70) + '\n');

  console.log('📋 UPDATED CONFIGURATION:');
  console.log('-'.repeat(70));
  console.log(`Merchant ID: ${config.merchId}`);
  console.log(`Password: ${config.password} (NEW - from spreadsheet)`);
  console.log(`Product: ${config.product}`);
  console.log(`API URL: ${config.apiUrl}`);

  // Create test payment request
  const orderId = 999;
  const amount = 100;
  const merchTxnId = `TEST_${orderId}_${Date.now().toString(36)}`;
  const merchTxnDate = new Date().toISOString().replace('T', ' ').substring(0, 19);

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
        password: config.password,  // Using NEW password
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
        custEmail: "test@example.com",
        custMobile: "9009088123"
      },
      extras: {
        udf1: `order_${orderId}`,
        udf2: "test_payment",
        udf3: config.returnUrl,
        udf4: "",
        udf5: ""
      }
    }
  };

  const paymentData = JSON.stringify(paymentRequest);
  const encryptedData = encryptData(paymentData);
  const formBody = `encData=${encryptedData}&merchId=${config.merchId}`;

  console.log('\n📋 TEST PAYMENT REQUEST:');
  console.log('-'.repeat(70));
  console.log(`Test Order ID: ${orderId}`);
  console.log(`Amount: ₹${amount}`);
  console.log(`Merchant Txn ID: ${merchTxnId}`);
  console.log(`Using Password: ${config.password}`);

  try {
    console.log('\n📋 MAKING REQUEST TO NTT API:');
    console.log('-'.repeat(70));
    console.log(`URL: ${config.apiUrl}`);
    
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
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Response length: ${responseText.length} characters`);

    // Check for encrypted response
    if (responseText.includes('encData=')) {
      console.log('\n✅ RECEIVED ENCRYPTED RESPONSE');
      const parts = responseText.split('&');
      for (const part of parts) {
        if (part.startsWith('encData=')) {
          const encResp = part.substring(8);
          console.log(`Encrypted response length: ${encResp.length} characters`);
          
          // Try to decrypt
          try {
            const crypto = require('crypto');
            const responseKey = envVars.NDPS_RESPONSE_KEY || "9B130849756D796521AC4DBEC26D3B2B";
            const password = Buffer.from(responseKey, 'utf8');
            const salt = Buffer.from(responseKey, 'utf8');
            const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
            
            const encryptedBuffer = Buffer.from(encResp, 'hex');
            const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
            let decrypted = decipher.update(encryptedBuffer);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            const decryptedText = decrypted.toString('utf8');
            console.log('\n📋 DECRYPTED RESPONSE:');
            console.log('-'.repeat(70));
            console.log(decryptedText);

            const jsonResponse = JSON.parse(decryptedText);
            if (jsonResponse.responseDetails) {
              const statusCode = jsonResponse.responseDetails.txnStatusCode;
              const message = jsonResponse.responseDetails.txnMessage;
              
              console.log('\n📋 RESULT ANALYSIS:');
              console.log('-'.repeat(70));
              
              if (statusCode === 'OTS0000') {
                console.log('🎉 SUCCESS! Password is correct!');
                console.log(`✅ Status: ${statusCode} - ${message}`);
                if (jsonResponse.atomTokenId) {
                  console.log(`✅ Token Generated: ${jsonResponse.atomTokenId}`);
                }
              } else if (statusCode === 'OTS0654') {
                console.log('❌ Password still incorrect');
                console.log(`❌ Status: ${statusCode} - ${message}`);
              } else {
                console.log(`⚠️  Status: ${statusCode} - ${message}`);
              }
            }
            
          } catch (decryptError) {
            console.log('❌ Could not decrypt response:', decryptError.message);
          }
          break;
        }
      }
    } else {
      console.log('\n❓ UNEXPECTED RESPONSE FORMAT:');
      console.log(responseText.substring(0, 500));
    }

  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('CONCLUSION:');
  console.log('='.repeat(70));
  console.log(`\nIf you see "SUCCESS! Password is correct!" above, then:`);
  console.log(`✅ Password ${config.password} is working`);
  console.log(`✅ Ready for live payments`);
  console.log(`✅ Backend can be restarted with confidence`);
  console.log(`\nIf you still see "Password incorrect":`);
  console.log(`❌ Double-check the password in the spreadsheet`);
  console.log(`❌ Contact NTT Data support for correct credentials`);
  console.log('\n' + '='.repeat(70) + '\n');
}

testNewPassword().catch(console.error);