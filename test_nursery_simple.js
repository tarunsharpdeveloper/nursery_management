const https = require('https');
const crypto = require('crypto');

// NDPS Production Configuration
const NDPS_CONFIG = {
  MERCHANT_ID: "856377",
  PASSWORD: "76ce2af2",
  PRODUCT_ID: "AWANT",
  VERIFICATION_URL: "https://payment1.atomtech.in/ots/payment/status" // OTS Payment Status API
};

// Transaction details you provided
const TRANSACTION_DATA = {
  atomTxnId: "11000385102440", // Correct Atom Transaction ID
  merchTxnId: "NURSERY_10_muntf7a5", // Correct Merchant Transaction ID
  amount: 1000.00, // Amount: 1000.00
  merchTxnDate: "2026-09-30" // Date: 30-Sep-2026 13:30:25
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
    merchTxnDate: txnData.merchTxnDate,
    atomTxnId: txnData.atomTxnId,
    amount: txnData.amount,
    txnCurrency: "INR"
  };

  // Generate signature
  requestData.signature = generateSignature(requestData);

  // Create the payInstrument structure (matching your format exactly)
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

async function verifyTransactionWithNDPS(txnData) {
  console.log('\n🧪 === NDPS Transaction Verification ===');
  console.log('📋 Transaction Data:', txnData);
  
  const requestPayload = createVerificationRequest(txnData);
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

    console.log('\n🚀 Making HTTPS request to NDPS...');

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
          if (res.statusCode === 200 && jsonResponse.payInstrument) {
            console.log('\n🎉 SUCCESS: Transaction verification completed successfully!');
            const payDetails = jsonResponse.payInstrument.payDetails;
            if (payDetails) {
              console.log('💰 Transaction Status:', payDetails.txnStatusCode || 'Unknown');
              console.log('💳 Amount:', payDetails.amount || 'Unknown');
              console.log('🔗 Atom Transaction ID:', payDetails.atomTxnId || 'Unknown');
            }
          } else if (res.statusCode === 500) {
            console.log('\n❌ NDPS server returned 500 error');
            console.log('   This could mean:');
            console.log('   - Transaction ID does not exist');
            console.log('   - Signature mismatch');
            console.log('   - Invalid merchant transaction ID');
            console.log('   - Server-side issue');
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
  console.log('🚀 NDPS Transaction Verification Test');
  console.log('====================================');
  console.log(`🎯 Target Transaction: ${TRANSACTION_DATA.atomTxnId}`);
  console.log(`💰 Amount: ₹${TRANSACTION_DATA.amount}`);
  console.log(`📅 Date: ${TRANSACTION_DATA.merchTxnDate}`);
  
  try {
    const result = await verifyTransactionWithNDPS(TRANSACTION_DATA);
    console.log('\n🏁 Test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
main();