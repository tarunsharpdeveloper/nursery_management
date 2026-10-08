const https = require('https');
const crypto = require('crypto');

// NDPS Configuration
const NDPS_CONFIG = {
  MERCHANT_ID: "446442",
  PASSWORD: "Test@123",
  ENCRYPTION_KEY: "90e7e2cea33a436f8ad8a588dffecf37",
  VERIFICATION_URL: "https://paynetzuat.atomtech.in/paynetz/epi/fts"
};

// Transaction details from your example
const TEST_TRANSACTION = {
  merchTxnId: "67a44ce2ed4c6",        // From your JSON example
  atomTxnId: "11000000631738",        // From your JSON example
  amount: 10.00,                      // From your JSON example
  txnDate: "2025-02-06"              // From your JSON example
};

// Alternative transaction you mentioned
const NURSERY_TRANSACTION = {
  atomTxnId: "NURSERY_10_muntf7a511000385102440",
  amount: 100.00,
  txnDate: "2025-02-06",
  merchTxnId: "TEST_NURSERY_TXN_001"
};

function generateSignature(data) {
  const hashString = `${NDPS_CONFIG.MERCHANT_ID}${data.merchTxnId}${data.amount.toFixed(2)}${data.txnCurrency}${NDPS_CONFIG.PASSWORD}`;
  console.log('🔐 Hash String:', hashString);
  
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');
  console.log('🔑 Generated Signature:', hash);
  return hash;
}

function createVerificationRequest(txnData) {
  const requestData = {
    api: "TXNVERIFICATION",
    source: "OTS",
    merchId: NDPS_CONFIG.MERCHANT_ID,
    password: NDPS_CONFIG.PASSWORD,
    merchTxnId: txnData.merchTxnId,
    merchTxnDate: txnData.txnDate,
    atomTxnId: txnData.atomTxnId,
    amount: txnData.amount,
    txnCurrency: "INR"
  };

  // Generate signature
  requestData.signature = generateSignature(requestData);

  // Create the payInstrument structure
  const payInstrument = {
    payInstrument: {
      headDetails: {
        api: requestData.api,
        source: requestData.source
      },
      merchDetails: {
        merchId: parseInt(requestData.merchId),
        password: requestData.password,
        merchTxnId: requestData.merchTxnId,
        merchTxnDate: requestData.merchTxnDate
      },
      payDetails: {
        atomTxnId: requestData.atomTxnId,
        amount: requestData.amount,
        txnCurrency: requestData.txnCurrency,
        signature: requestData.signature
      }
    }
  };

  return payInstrument;
}

async function verifyTransaction(txnData, testName) {
  console.log(`\n🧪 === ${testName} ===`);
  console.log('📋 Transaction Data:', txnData);
  
  const requestPayload = createVerificationRequest(txnData);
  console.log('\n📤 Request Payload:');
  console.log(JSON.stringify(requestPayload, null, 2));

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(requestPayload);

    const options = {
      hostname: 'paynetzuat.atomtech.in',
      port: 443,
      path: '/paynetz/epi/fts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
        'User-Agent': 'Nursery-Management-System/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n📡 Response Status: ${res.statusCode}`);
        console.log('📬 Response Headers:', res.headers);
        console.log('📄 Response Body:', data);
        
        try {
          const jsonResponse = JSON.parse(data);
          console.log('\n✅ Parsed JSON Response:');
          console.log(JSON.stringify(jsonResponse, null, 2));
          resolve(jsonResponse);
        } catch (e) {
          console.log('\n⚠️  Response is not JSON:', data);
          resolve({ rawResponse: data });
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

async function runTests() {
  console.log('🚀 NDPS Transaction Verification Tests');
  console.log('=====================================');
  
  try {
    // Test 1: Your example transaction
    await verifyTransaction(TEST_TRANSACTION, "Example Transaction from JSON");
    
    // Wait 2 seconds between requests
    console.log('\n⏳ Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: The NURSERY transaction ID you mentioned
    await verifyTransaction(NURSERY_TRANSACTION, "NURSERY Transaction ID");
    
  } catch (error) {
    console.error('❌ Test Failed:', error);
  }
}

// Run the tests
runTests();