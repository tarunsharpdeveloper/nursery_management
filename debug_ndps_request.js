/**
 * Debug script to test NDPS API request directly
 * Based on working NTT DATA Node.js implementation
 * Run with: node debug_ndps_request.js
 */

const crypto = require('crypto');

// NDPS Configuration (from your .env)
const config = {
  merchId: "446442",
  userId: "",
  password: "Test@123",
  apiUrl: "https://caller.atomtech.in/ots/aipay/auth",
  product: "NSE",
  requestKey: "A4476C2062FFA58980DC8F79EB6A799E",
  requestSalt: "A4476C2062FFA58980DC8F79EB6A799E",
  responseKey: "75AEF0FA1B94B3C10D4F5B268F757F11",
  responseSalt: "75AEF0FA1B94B3C10D4F5B268F757F11"
};

// AES-256-CBC configuration (as per working implementation)
const algorithm = 'aes-256-cbc';
const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 'utf8');

/**
 * Encrypt data using AES-256-CBC with PBKDF2 (as per working implementation)
 */
function encryptData(data) {
  try {
    console.log('=== ENCRYPTION DEBUG ===');
    console.log('Algorithm: aes-256-cbc with PBKDF2');
    console.log('Key:', config.requestKey);
    console.log('Salt:', config.requestSalt);
    
    const password = Buffer.from(config.requestKey, 'utf8');
    const salt = Buffer.from(config.requestSalt, 'utf8');
    
    // Derive key using PBKDF2 (65536 iterations, 32 bytes, sha512)
    console.log('Deriving key with PBKDF2 (65536 iterations, sha512)...');
    const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
    console.log('Derived key length:', derivedKey.length, 'bytes');
    
    console.log('Original data:', data);
    console.log('Original data length:', data.length, 'characters');
    
    const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    console.log('Encrypted data:', encrypted.substring(0, 100) + '...');
    console.log('Encrypted data length:', encrypted.length, 'characters');
    
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
}

/**
 * Decrypt data using AES-256-CBC with PBKDF2
 */
function decryptData(encryptedData) {
  try {
    const password = Buffer.from(config.responseKey, 'utf8');
    const salt = Buffer.from(config.responseSalt, 'utf8');
    
    const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
    
    const encryptedBuffer = Buffer.from(encryptedData, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
}

async function testNDPSRequest() {
  try {
    console.log('=== NDPS API REQUEST DEBUG (Working Implementation) ===');
    console.log('Testing with merchant ID:', config.merchId);
    console.log('API URL:', config.apiUrl);
    
    // Generate test transaction data
    const merchTxnId = `TEST_${Date.now().toString(36)}`;
    const merchTxnDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // Create payment request payload (EXACT format from working implementation)
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
          amount: "100.00",
          product: config.product,
          custAccNo: "TEST123",
          txnCurrency: "INR"
        },
        custDetails: {
          custEmail: "test@example.com",
          custMobile: "9876543210"
        },
        extras: {
          udf1: "test_order",
          udf2: "debug_payment",
          udf3: "http://localhost:3000/payment/return",
          udf4: "",
          udf5: ""
        }
      }
    };

    console.log('=== PAYMENT REQUEST JSON ===');
    const paymentData = JSON.stringify(paymentRequest);
    console.log(paymentData);
    
    // Encrypt the data
    const encryptedData = encryptData(paymentData);
    
    // Create form data (order matches working implementation: encData first, then merchId)
    const formBody = `encData=${encryptedData}&merchId=${config.merchId}`;
    
    console.log('=== FINAL REQUEST ===');
    console.log('URL:', config.apiUrl);
    console.log('Method: POST');
    console.log('Content-Type: application/x-www-form-urlencoded');
    console.log('Body length:', formBody.length, 'characters');
    console.log('Body format: encData=[encrypted]&merchId=' + config.merchId);
    
    // Make the request
    console.log('=== SENDING REQUEST ===');
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: formBody
    });

    console.log('=== RESPONSE RECEIVED ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    const responseText = await response.text();
    console.log('Response body length:', responseText.length, 'characters');
    console.log('Response body:', responseText || '(empty)');
    
    if (responseText.length === 0) {
      console.log('');
      console.log('❌ EMPTY RESPONSE DETECTED');
      console.log('This confirms the issue is with NTT\'s server, not our request format.');
      console.log('We are now using the EXACT encryption method from the working implementation.');
    } else {
      console.log('✅ Received response from NTT API');
      
      // Try to parse response (format: merchId=xxx&encData=yyy)
      if (responseText.includes('encData=')) {
        const parts = responseText.split('&');
        for (const part of parts) {
          if (part.startsWith('encData=')) {
            const encData = part.substring(8);
            console.log('Encrypted response found, decrypting...');
            const decrypted = decryptData(encData);
            console.log('Decrypted response:', decrypted);
            const parsed = JSON.parse(decrypted);
            console.log('✅ atomTokenId:', parsed.atomTokenId);
            console.log('✅ Status Code:', parsed.responseDetails?.txnStatusCode);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Run the test
testNDPSRequest();