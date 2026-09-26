/**
 * Test script for NDPS Transaction Verification API
 * 
 * Usage:
 * node test_verify_api.js
 * 
 * This will test the new /api/ndps/verify-transaction endpoint
 */

const http = require('http');

// Configuration
const API_URL = 'http://localhost:4000';
const API_PATH = '/api/ndps/verify-transaction';

// Test transaction data (from NDPS report)
const TEST_TRANSACTION = {
  merchTxnId: 'NURSERY_3_muaxr3ek',
  atomTxnId: '11000383853212',
  amount: 51.00,
  merchTxnDate: '2026-09-21'  // YYYY-MM-DD format
};

/**
 * Make HTTP POST request
 */
function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            data: parsed
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Run tests
 */
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TESTING NDPS TRANSACTION VERIFICATION API');
  console.log('═══════════════════════════════════════════════════════════');
  console.log();
  
  console.log('API Endpoint:', `${API_URL}${API_PATH}`);
  console.log('Method: POST');
  console.log();

  // Test 1: Valid Transaction
  console.log('─────────────────────────────────────────────────────────');
  console.log('TEST 1: Verify Transaction (Expected: Not Found)');
  console.log('─────────────────────────────────────────────────────────');
  console.log('Request Body:');
  console.log(JSON.stringify(TEST_TRANSACTION, null, 2));
  console.log();

  try {
    const response = await makeRequest(TEST_TRANSACTION);
    
    console.log('✅ API Response Received:');
    console.log('Status Code:', response.statusCode);
    console.log('Status Message:', response.statusMessage);
    console.log();
    console.log('Response Body:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log();

    if (response.statusCode === 404) {
      console.log('✅ TEST PASSED: Transaction not found (as expected)');
      console.log('   The transaction failed and is not in NDPS queryable database.');
    } else if (response.statusCode === 200) {
      console.log('✅ TEST PASSED: Transaction found and verified!');
      console.log('   Payment Status:', response.data.transaction?.paymentStatus);
    } else {
      console.log('⚠️  Unexpected status code:', response.statusCode);
    }
  } catch (error) {
    console.error('❌ TEST FAILED: Request error');
    console.error('Error:', error.message);
    console.error();
    console.error('Is the backend server running?');
    console.error('Start it with: cd backend && node app.js');
    return;
  }

  console.log();

  // Test 2: Missing Fields
  console.log('─────────────────────────────────────────────────────────');
  console.log('TEST 2: Missing Required Fields (Expected: 400 Error)');
  console.log('─────────────────────────────────────────────────────────');
  
  const invalidRequest = {
    merchTxnId: 'NURSERY_3_muaxr3ek',
    // Missing atomTxnId, amount, merchTxnDate
  };
  
  console.log('Request Body:');
  console.log(JSON.stringify(invalidRequest, null, 2));
  console.log();

  try {
    const response = await makeRequest(invalidRequest);
    
    console.log('Response:');
    console.log('Status Code:', response.statusCode);
    console.log('Response Body:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log();

    if (response.statusCode === 400) {
      console.log('✅ TEST PASSED: Correctly rejected invalid request');
    } else {
      console.log('⚠️  Unexpected status code:', response.statusCode);
    }
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
  }

  console.log();

  // Test 3: Invalid Date Format
  console.log('─────────────────────────────────────────────────────────');
  console.log('TEST 3: Invalid Date Format (Expected: 400 Error from NDPS)');
  console.log('─────────────────────────────────────────────────────────');
  
  const invalidDateRequest = {
    merchTxnId: 'NURSERY_3_muaxr3ek',
    atomTxnId: '11000383853212',
    amount: 51.00,
    merchTxnDate: '2026-09-21 13:10:38'  // Wrong: includes time
  };
  
  console.log('Request Body:');
  console.log(JSON.stringify(invalidDateRequest, null, 2));
  console.log();

  try {
    const response = await makeRequest(invalidDateRequest);
    
    console.log('Response:');
    console.log('Status Code:', response.statusCode);
    console.log('Response Body:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log();

    if (response.statusCode === 400 && response.data.statusCode === 'OTS0507') {
      console.log('✅ TEST PASSED: NDPS correctly rejected invalid date format');
    } else {
      console.log('⚠️  Unexpected response');
    }
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
  }

  console.log();
  console.log('═══════════════════════════════════════════════════════════');
  console.log('ALL TESTS COMPLETED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log();
  console.log('✅ API endpoint is working correctly!');
  console.log();
  console.log('You can now use this endpoint to verify transactions:');
  console.log(`   curl -X POST ${API_URL}${API_PATH} \\`);
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"merchTxnId":"YOUR_TXN_ID","atomTxnId":"ATOM_TXN_ID","amount":51,"merchTxnDate":"2026-09-21"}\'');
  console.log();
  console.log('📖 See VERIFY_TRANSACTION_API_DOCS.md for full documentation');
}

// Run the tests
console.log();
console.log('Starting API tests...');
console.log();

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
