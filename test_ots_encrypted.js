const https = require('https');
const crypto = require('crypto');

// NDPS Production Configuration
const NDPS_CONFIG = {
  MERCHANT_ID: "856377",
  PASSWORD: "76ce2af2",
  PRODUCT_ID: "AWANT",
  ENCRYPTION_KEY: "90e7e2cea33a436f8ad8a588dffecf37", // 32-byte key for AES-256
  OTS_URL: "https://payment1.atomtech.in/ots/payment/status"
};

// Transaction details
const TRANSACTION_DATA = {
  atomTxnId: "11000385102440",
  merchTxnId: "NURSERY_10_muntf7a5",
  amount: 1000.00,
  merchTxnDate: "2026-09-30"
};

function generateSignature(data) {
  const hashString = `${NDPS_CONFIG.MERCHANT_ID}${data.merchTxnId}${data.amount.toFixed(2)}${data.txnCurrency}${NDPS_CONFIG.PASSWORD}`;
  console.log('🔐 Hash String:', hashString);
  
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');
  console.log('🔑 Generated Signature:', hash);
  return hash;
}

function encryptAES256(data, key) {
  try {
    // The key should be exactly 32 bytes for AES-256
    // If the key is a hex string, convert it to buffer
    let keyBuffer;
    if (key.length === 64) {
      // Hex string (32 bytes * 2 = 64 hex chars)
      keyBuffer = Buffer.from(key, 'hex');
    } else if (key.length === 32) {
      // Already 32 bytes
      keyBuffer = Buffer.from(key, 'utf8');
    } else {
      // Pad or truncate to 32 bytes
      keyBuffer = Buffer.alloc(32);
      Buffer.from(key, 'utf8').copy(keyBuffer);
    }
    
    console.log('🔑 Key length:', keyBuffer.length, 'bytes');
    
    // Create a random IV
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Prepend IV to encrypted data
    const result = iv.toString('hex') + encrypted;
    console.log('🔒 Encrypted Data Length:', result.length);
    return result;
  } catch (error) {
    console.error('❌ Encryption error:', error);
    return null;
  }
}

function decryptAES256(encryptedData, key) {
  try {
    // Extract IV (first 32 hex characters = 16 bytes)
    const iv = Buffer.from(encryptedData.slice(0, 32), 'hex');
    const encrypted = encryptedData.slice(32);
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Decryption error:', error);
    return null;
  }
}

function createOTSEncryptedRequest(txnData) {
  // Create the verification data structure (similar to your sample)
  const verificationData = {
    api: "TXNVERIFICATION",
    source: "OTS",
    merchId: NDPS_CONFIG.MERCHANT_ID,
    password: NDPS_CONFIG.PASSWORD,
    merchTxnId: txnData.merchTxnId,
    merchTxnDate: txnData.merchTxnDate,
    atomTxnId: txnData.atomTxnId,
    amount: txnData.amount,
    txnCurrency: "INR"
  };

  // Generate signature
  verificationData.signature = generateSignature(verificationData);

  // Convert to JSON string
  const jsonData = JSON.stringify(verificationData);
  console.log('📋 Data to encrypt:', jsonData);

  // Encrypt the data
  const encData = encryptAES256(jsonData, NDPS_CONFIG.ENCRYPTION_KEY);
  console.log('🔒 Encrypted Data:', encData ? encData.substring(0, 50) + '...' : 'null');

  return encData ? { encData } : null;
}

async function verifyTransactionOTSEncrypted(txnData) {
  console.log('\n🧪 === OTS Encrypted Transaction Verification ===');
  console.log('📋 Transaction Data:', txnData);
  
  const requestPayload = createOTSEncryptedRequest(txnData);
  
  if (!requestPayload) {
    console.error('❌ Failed to create encrypted request');
    return;
  }
  
  console.log('\n📤 Sending encrypted request to OTS API...');

  return new Promise((resolve, reject) => {
    // Send as form data instead of JSON
    const postData = `encData=${encodeURIComponent(requestPayload.encData)}`;

    const options = {
      hostname: 'payment1.atomtech.in',
      port: 443,
      path: '/ots/payment/status',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length,
        'User-Agent': 'Nursery-Management-System/1.0'
      }
    };

    console.log('🚀 Making HTTPS request to OTS API...');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n📡 Response Status: ${res.statusCode}`);
        console.log('📄 Raw Response Body:', data.substring(0, 200) + (data.length > 200 ? '...' : ''));
        
        try {
          const jsonResponse = JSON.parse(data);
          console.log('\n✅ Parsed JSON Response:');
          console.log(JSON.stringify(jsonResponse, null, 2));
          
          // Try to decrypt if we have encrypted response
          if (jsonResponse.encData) {
            console.log('\n🔓 Attempting to decrypt response...');
            const decryptedData = decryptAES256(jsonResponse.encData, NDPS_CONFIG.ENCRYPTION_KEY);
            if (decryptedData) {
              console.log('🎉 Decrypted Response:');
              try {
                const decryptedJson = JSON.parse(decryptedData);
                console.log(JSON.stringify(decryptedJson, null, 2));
                
                // Check if transaction was successful
                if (decryptedJson.payInstrument && decryptedJson.payInstrument.length > 0) {
                  const payDetails = decryptedJson.payInstrument[0];
                  if (payDetails.responseDetails && payDetails.responseDetails.statusCode === "OTS0000") {
                    console.log('\n🎉 SUCCESS: Transaction verification completed!');
                    console.log('💰 Amount:', payDetails.payDetails?.amount);
                    console.log('🆔 Atom Transaction ID:', payDetails.payDetails?.atomTxnId);
                    console.log('✅ Status:', payDetails.responseDetails.message);
                  } else {
                    console.log('\n⚠️  Transaction status:', payDetails.responseDetails?.statusCode);
                  }
                }
              } catch (e) {
                console.log('Decrypted data:', decryptedData);
              }
            }
          } else {
            // Analyze non-encrypted response
            if (res.statusCode === 200 && !jsonResponse.error) {
              console.log('\n🎉 SUCCESS: API responded successfully!');
            } else if (jsonResponse.message && jsonResponse.message.includes('encData')) {
              console.log('\n⚠️  Still asking for encData - encryption may need adjustment');
            } else {
              console.log('\n⚠️  Different error - progress made!');
            }
          }
          
          resolve(jsonResponse);
        } catch (e) {
          console.log('\n⚠️  Response is not JSON:', data);
          resolve({ rawResponse: data, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🚀 OTS Encrypted Transaction Verification Test');
  console.log('==============================================');
  console.log(`🎯 Target Transaction: ${TRANSACTION_DATA.atomTxnId}`);
  console.log(`💰 Amount: ₹${TRANSACTION_DATA.amount}`);
  console.log(`📅 Date: ${TRANSACTION_DATA.merchTxnDate}`);
  console.log(`🔗 API Endpoint: ${NDPS_CONFIG.OTS_URL}`);
  console.log(`🔐 Using Encryption Key: ${NDPS_CONFIG.ENCRYPTION_KEY.substring(0, 8)}...`);
  
  try {
    const result = await verifyTransactionOTSEncrypted(TRANSACTION_DATA);
    console.log('\n🏁 Test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
main();