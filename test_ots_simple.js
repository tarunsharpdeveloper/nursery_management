const https = require('https');
const crypto = require('crypto');

// NDPS Production Configuration
const NDPS_CONFIG = {
  MERCHANT_ID: "856377",
  PASSWORD: "76ce2af2",
  PRODUCT_ID: "AWANT"
};

// Transaction details
const TRANSACTION_DATA = {
  atomTxnId: "11000385102440",
  merchTxnId: "NURSERY_10_muntf7a5",
  amount: 1000.00,
  merchTxnDate: "2026-09-30"
};

// Test multiple request formats
const TEST_REQUESTS = [
  {
    name: "Simple Query Parameters",
    data: `merchId=${NDPS_CONFIG.MERCHANT_ID}&atomTxnId=${TRANSACTION_DATA.atomTxnId}&merchTxnId=${TRANSACTION_DATA.merchTxnId}`,
    contentType: "application/x-www-form-urlencoded"
  },
  {
    name: "JSON with encData field",
    data: JSON.stringify({
      encData: `merchId=${NDPS_CONFIG.MERCHANT_ID}&atomTxnId=${TRANSACTION_DATA.atomTxnId}&merchTxnId=${TRANSACTION_DATA.merchTxnId}&password=${NDPS_CONFIG.PASSWORD}`
    }),
    contentType: "application/json"
  },
  {
    name: "Direct JSON Parameters",
    data: JSON.stringify({
      merchId: NDPS_CONFIG.MERCHANT_ID,
      atomTxnId: TRANSACTION_DATA.atomTxnId,
      merchTxnId: TRANSACTION_DATA.merchTxnId,
      password: NDPS_CONFIG.PASSWORD,
      amount: TRANSACTION_DATA.amount,
      merchTxnDate: TRANSACTION_DATA.merchTxnDate
    }),
    contentType: "application/json"
  }
];

async function testOTSEndpoint(testCase) {
  console.log(`\n🧪 === Testing: ${testCase.name} ===`);
  console.log('📤 Request Data:', testCase.data);
  console.log('📋 Content-Type:', testCase.contentType);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'payment1.atomtech.in',
      port: 443,
      path: '/ots/payment/status',
      method: 'POST',
      headers: {
        'Content-Type': testCase.contentType,
        'Content-Length': testCase.data.length,
        'User-Agent': 'Nursery-Management-System/1.0'
      }
    };

    console.log('\n🚀 Making HTTPS request...');

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
          if (res.statusCode === 200 && !jsonResponse.error) {
            console.log('\n🎉 SUCCESS: This format might work!');
          } else if (jsonResponse.message && jsonResponse.message.includes('encData')) {
            console.log('\n⚠️  Still needs encData parameter');
          } else {
            console.log('\n⚠️  Different error - may be progress');
          }
          
          resolve({ status: res.statusCode, response: jsonResponse });
        } catch (e) {
          console.log('\n⚠️  Response is not JSON:', data);
          resolve({ status: res.statusCode, rawResponse: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error);
      reject(error);
    });

    req.write(testCase.data);
    req.end();
  });
}

async function main() {
  console.log('🚀 OTS API Format Testing');
  console.log('=========================');
  console.log(`🎯 Target Transaction: ${TRANSACTION_DATA.atomTxnId}`);
  console.log(`🔗 API Endpoint: https://payment1.atomtech.in/ots/payment/status`);
  
  for (let i = 0; i < TEST_REQUESTS.length; i++) {
    const testCase = TEST_REQUESTS[i];
    
    try {
      await testOTSEndpoint(testCase);
      
      // Wait 2 seconds between requests
      if (i < TEST_REQUESTS.length - 1) {
        console.log('\n⏳ Waiting 2 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Test ${testCase.name} failed:`, error.message);
    }
  }
  
  console.log('\n🏁 All tests completed!');
  console.log('\nℹ️  Look for the test that shows different error messages - that indicates progress.');
}

// Run the tests
main();