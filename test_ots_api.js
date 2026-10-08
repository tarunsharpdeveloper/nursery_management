const https = require('https');
const crypto = require('crypto');

// NDPS Production Configuration
const NDPS_CONFIG = {
  MERCHANT_ID: "856377",
  PASSWORD: "76ce2af2",
  PRODUCT_ID: "AWANT",
  ENCRYPTION_KEY: "90e7e2cea33a436f8ad8a588dffecf37", // You may need to provide the correct encryption key
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

function encryptAES(data, key) {
  try {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

function createOTSRequest(txnData) {
  // Create the verification data structure
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
  const encData = encryptAES(jsonData, NDPS_CONFIG.ENCRYPTION_KEY);
  console.log('🔒 Encrypted Data:', encData);

  return { encData };
}

async function verifyTransactionOTS(txnData) {
  console.log('\n🧪 === OTS Transaction Verification ===');
  console.log('📋 Transaction Data:', txnData);
  
  const requestPayload = createOTSRequest(txnData);
  
  if (!requestPayload.encData) {
    console.error('❌ Failed to encrypt data');
    return;
  }
  
  console.log('\n📤 Request Payload:');
  console.log(JSON.stringify(requestPayload, null, 2));

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(requestPayload);

    const options = {
      hostname: 'payment1.atomtech.in',
      port: 443,
      path: '/ots/payment/status',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
        'User-Agent': 'Nursery-Management-System/1.0'
      }
    };

    console.log('\n🚀 Making HTTPS request to OTS API...');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n📡 Response Status: ${res.statusCode}`);
        console.log('📄 Response Body:', data);
        
        try {
          const jsonResponse = JSON.parse(data);
          console.log('\n✅ Parsed JSON Response:');
          console.log(JSON.stringify(jsonResponse, null, 2));
          
          // Analyze the response
          if (res.statusCode === 200) {
            console.log('\n🎉 SUCCESS: OTS API responded successfully!');
            if (jsonResponse.status === 200) {
              console.log('✅ Transaction verification completed successfully!');
            } else {
              console.log('⚠️  API returned non-200 status:', jsonResponse.status);
            }
          } else {
            console.log('\n❌ HTTP Error:', res.statusCode);
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
  console.log('🚀 OTS Transaction Verification Test');
  console.log('===================================');
  console.log(`🎯 Target Transaction: ${TRANSACTION_DATA.atomTxnId}`);
  console.log(`💰 Amount: ₹${TRANSACTION_DATA.amount}`);
  console.log(`📅 Date: ${TRANSACTION_DATA.merchTxnDate}`);
  console.log(`🔗 API Endpoint: ${NDPS_CONFIG.OTS_URL}`);
  
  try {
    const result = await verifyTransactionOTS(TRANSACTION_DATA);
    console.log('\n🏁 Test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
main();