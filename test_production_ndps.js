const crypto = require('crypto');

// Test the production NDPS configuration
const PRODUCTION_CONFIG = {
  merchId: "856377",
  userId: "856377",
  password: "856377_titan@123",
  apiUrl: "https://payment1.atomtech.in/ots/aipay/auth",
  product: "AWANT",
  version: "OTSv1.1",
  api: "AUTH",
  platform: "FLASH",
  requestKey: "74ABEA4102D67FD3491F23AB9D4636AB",
  responseKey: "9B130849756D796521AC4DBEC26D3B2B",
  requestHashKey: "27786aad29c63b6a3a",
  responseHashKey: "9f9153a2a8671ae683"
};

console.log('=== PRODUCTION NDPS TEST ===');
console.log('Environment: PRODUCTION');
console.log('Merchant ID:', PRODUCTION_CONFIG.merchId);
console.log('Product ID:', PRODUCTION_CONFIG.product);
console.log('API URL:', PRODUCTION_CONFIG.apiUrl);
console.log('Request Key:', PRODUCTION_CONFIG.requestKey.substring(0, 8) + '...');
console.log('Response Key:', PRODUCTION_CONFIG.responseKey.substring(0, 8) + '...');

// Test AES encryption/decryption
const algorithm = 'aes-256-cbc';
const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 'utf8');

function testEncryption() {
  try {
    console.log('\n=== TESTING AES ENCRYPTION ===');
    
    // Test payload
    const testPayload = {
      payInstrument: {
        headDetails: {
          version: PRODUCTION_CONFIG.version,
          api: PRODUCTION_CONFIG.api,
          platform: PRODUCTION_CONFIG.platform
        },
        merchDetails: {
          merchId: PRODUCTION_CONFIG.merchId,
          userId: PRODUCTION_CONFIG.userId,
          password: PRODUCTION_CONFIG.password,
          merchTxnId: "TEST_126_" + Date.now(),
          merchTxnDate: new Date().toISOString().replace('T', ' ').substring(0, 19)
        },
        payDetails: {
          amount: "1500.00",
          product: PRODUCTION_CONFIG.product,
          custAccNo: "126",
          txnCurrency: "INR"
        },
        custDetails: {
          custEmail: "Manoj@gmail.com",
          custMobile: "9009088123"
        },
        extras: {
          udf1: "order_126",
          udf2: "nursery_payment",
          udf3: "https://awantikaseeds.com/payment/return",
          udf4: "",
          udf5: ""
        }
      }
    };

    const paymentData = JSON.stringify(testPayload);
    console.log('Payload size:', paymentData.length, 'characters');
    
    // Encrypt using PBKDF2
    const password = Buffer.from(PRODUCTION_CONFIG.requestKey, 'utf8');
    const salt = Buffer.from(PRODUCTION_CONFIG.requestKey, 'utf8');
    
    const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
    console.log('Derived key length:', derivedKey.length, 'bytes');
    
    const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
    let encrypted = cipher.update(paymentData, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    console.log('Encrypted data length:', encrypted.length, 'characters');
    console.log('Encryption successful ✅');
    
    // Test decryption
    console.log('\n=== TESTING AES DECRYPTION ===');
    const responsePassword = Buffer.from(PRODUCTION_CONFIG.responseKey, 'utf8');
    const responseSalt = Buffer.from(PRODUCTION_CONFIG.responseKey, 'utf8');
    const responseKey = crypto.pbkdf2Sync(responsePassword, responseSalt, 65536, 32, 'sha512');
    
    const decipher = crypto.createDecipheriv(algorithm, responseKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const decryptedPayload = JSON.parse(decrypted);
    console.log('Decryption successful ✅');
    console.log('Merchant ID from decrypted:', decryptedPayload.payInstrument.merchDetails.merchId);
    
    return encrypted;
    
  } catch (error) {
    console.error('❌ Encryption/Decryption test failed:', error.message);
    return null;
  }
}

async function testNTTAPI() {
  try {
    console.log('\n=== TESTING NTT DATA API ===');
    
    const encryptedData = testEncryption();
    if (!encryptedData) {
      console.error('❌ Cannot test API - encryption failed');
      return;
    }
    
    const formBody = `encData=${encryptedData}&merchId=${PRODUCTION_CONFIG.merchId}`;
    console.log('Form body size:', formBody.length, 'characters');
    console.log('Calling:', PRODUCTION_CONFIG.apiUrl);
    
    const response = await fetch(PRODUCTION_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: formBody
    });
    
    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response length:', responseText.length, 'characters');
    console.log('Response preview:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
    
    if (response.status === 200 && responseText.includes('encData=')) {
      console.log('✅ NTT API call successful - received encrypted response');
      
      // Try to extract and decrypt the response
      const parts = responseText.split('&');
      let encryptedResponse = '';
      for (const part of parts) {
        if (part.startsWith('encData=')) {
          encryptedResponse = part.substring(8);
          break;
        }
      }
      
      if (encryptedResponse) {
        console.log('Encrypted response length:', encryptedResponse.length);
        
        // Test decryption of response
        try {
          const responsePassword = Buffer.from(PRODUCTION_CONFIG.responseKey, 'utf8');
          const responseSalt = Buffer.from(PRODUCTION_CONFIG.responseKey, 'utf8');
          const responseKey = crypto.pbkdf2Sync(responsePassword, responseSalt, 65536, 32, 'sha512');
          
          const decipher = crypto.createDecipheriv(algorithm, responseKey, iv);
          let decrypted = decipher.update(encryptedResponse, 'hex', 'utf8');
          decrypted += decipher.final('utf8');
          
          const responseData = JSON.parse(decrypted);
          console.log('✅ Response decryption successful');
          console.log('Response data keys:', Object.keys(responseData));
          
          if (responseData.atomTokenId) {
            console.log('✅ Token received:', responseData.atomTokenId);
          }
          
        } catch (decryptError) {
          console.error('❌ Response decryption failed:', decryptError.message);
        }
      }
      
    } else {
      console.error('❌ NTT API call failed');
      console.error('Status:', response.status);
      console.error('Response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ NTT API test failed:', error.message);
  }
}

// Run tests
testEncryption();
testNTTAPI().catch(console.error);