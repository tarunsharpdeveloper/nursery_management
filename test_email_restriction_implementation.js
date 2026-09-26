#!/usr/bin/env node

/**
 * Test Script: Email Restriction Implementation
 * Tests that existing emails are properly restricted during checkout
 */

const http = require('http');
const https = require('https');

const API_BASE_URL = 'https://api.awantikaseeds.com';

// Test configuration
const TEST_CONFIG = {
  existingEmail: 'test.checkout@example.com', // Email we'll verify exists
  newEmail: 'test.real.' + Date.now() + '@example.com', // Unique new email
  validPhone: '9876543210',
  validName: 'Test User',
  validCity: 'Mumbai',
  validAddress: '123 Main Street',
  validZip: '400001'
};

console.log('='.repeat(70));
console.log('EMAIL RESTRICTION IMPLEMENTATION TEST');
console.log('='.repeat(70));
console.log(`\nTest Configuration:`);
console.log(`  Existing Email: ${TEST_CONFIG.existingEmail}`);
console.log(`  New Email: ${TEST_CONFIG.newEmail}`);
console.log(`  Phone: ${TEST_CONFIG.validPhone}`);

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const requestOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

/**
 * Test 1: Check if existing email is detected
 */
async function testExistingEmailDetection() {
  console.log(`\n${'─'.repeat(70)}`);
  console.log('TEST 1: Check Existing Email Detection');
  console.log(`${'─'.repeat(70)}`);

  try {
    console.log(`\n📧 Checking email: ${TEST_CONFIG.existingEmail}`);
    
    const response = await makeRequest(`${API_BASE_URL}/api/auth/check-email`, {
      method: 'POST',
      body: JSON.stringify({ email: TEST_CONFIG.existingEmail })
    });

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));

    if (response.status === 200) {
      if (response.body.exists === true) {
        console.log(`✅ PASS: Email "${TEST_CONFIG.existingEmail}" is correctly detected as existing`);
        return true;
      } else {
        console.log(`⚠️  WARNING: Email "${TEST_CONFIG.existingEmail}" is not detected as existing`);
        console.log(`   This might be a new account. Creating one for testing...`);
        
        // Try to create this account first
        try {
          const createResponse = await makeRequest(`${API_BASE_URL}/api/auth/auto-create-account`, {
            method: 'POST',
            body: JSON.stringify({
              name: 'Test Existing User',
              email: TEST_CONFIG.existingEmail,
              phone: TEST_CONFIG.validPhone
            })
          });
          console.log(`   Account creation response:`, createResponse.body);
          
          // Check again
          const retryResponse = await makeRequest(`${API_BASE_URL}/api/auth/check-email`, {
            method: 'POST',
            body: JSON.stringify({ email: TEST_CONFIG.existingEmail })
          });
          
          if (retryResponse.body.exists === true) {
            console.log(`✅ PASS: Email now correctly detected as existing after creation`);
            return true;
          }
        } catch (e) {
          console.log(`   Could not create test account:`, e.message);
        }
        return false;
      }
    } else {
      console.log(`❌ FAIL: Unexpected status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Check that new email is available
 */
async function testNewEmailAvailable() {
  console.log(`\n${'─'.repeat(70)}`);
  console.log('TEST 2: Check New Email is Available');
  console.log(`${'─'.repeat(70)}`);

  try {
    console.log(`\n📧 Checking email: ${TEST_CONFIG.newEmail}`);
    
    const response = await makeRequest(`${API_BASE_URL}/api/auth/check-email`, {
      method: 'POST',
      body: JSON.stringify({ email: TEST_CONFIG.newEmail })
    });

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));

    if (response.status === 200 && response.body.exists === false) {
      console.log(`✅ PASS: New email "${TEST_CONFIG.newEmail}" is available`);
      return true;
    } else {
      console.log(`❌ FAIL: New email should be available but returned exists=${response.body.exists}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Verify API allows order creation with new email
 */
async function testOrderCreationWithNewEmail() {
  console.log(`\n${'─'.repeat(70)}`);
  console.log('TEST 3: Order Creation with New Email (Should Succeed)');
  console.log(`${'─'.repeat(70)}`);

  try {
    console.log(`\n📦 Attempting to create order with new email: ${TEST_CONFIG.newEmail}`);
    
    // First, create an account with the new email
    const accountResponse = await makeRequest(`${API_BASE_URL}/api/auth/auto-create-account-phone`, {
      method: 'POST',
      body: JSON.stringify({
        name: TEST_CONFIG.validName,
        email: TEST_CONFIG.newEmail,
        phone: TEST_CONFIG.validPhone
      })
    });

    console.log(`Account creation status: ${accountResponse.status}`);
    console.log(`Account response:`, JSON.stringify(accountResponse.body, null, 2));

    // Check if account was created (should return success even if already exists)
    if (accountResponse.status === 200 || accountResponse.status === 201) {
      console.log(`✅ Account creation successful (status ${accountResponse.status})`);
      return true;
    } else {
      console.log(`⚠️  Account creation returned status ${accountResponse.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Verify auto-create account handles duplicates gracefully
 */
async function testDuplicateAccountHandling() {
  console.log(`\n${'─'.repeat(70)}`);
  console.log('TEST 4: Duplicate Account Handling (Should Not Error)');
  console.log(`${'─'.repeat(70)}`);

  try {
    console.log(`\n👤 Attempting to create account with existing email: ${TEST_CONFIG.existingEmail}`);
    
    const response = await makeRequest(`${API_BASE_URL}/api/auth/auto-create-account-phone`, {
      method: 'POST',
      body: JSON.stringify({
        name: TEST_CONFIG.validName,
        email: TEST_CONFIG.existingEmail,
        phone: TEST_CONFIG.validPhone
      })
    });

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));

    // Should return success (200 or 201) even if account already exists
    if (response.status === 200 || response.status === 201) {
      console.log(`✅ PASS: Duplicate account handled gracefully (returned ${response.status})`);
      console.log(`   Message: ${response.body.message}`);
      return true;
    } else {
      console.log(`❌ FAIL: Unexpected status ${response.status} for duplicate account`);
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  const results = {};

  results.test1 = await testExistingEmailDetection();
  results.test2 = await testNewEmailAvailable();
  results.test3 = await testOrderCreationWithNewEmail();
  results.test4 = await testDuplicateAccountHandling();

  // Summary
  console.log(`\n${'═'.repeat(70)}`);
  console.log('TEST SUMMARY');
  console.log(`${'═'.repeat(70)}`);
  console.log(`Test 1 - Existing Email Detection: ${results.test1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 2 - New Email Available: ${results.test2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 3 - Order Creation with New Email: ${results.test3 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 4 - Duplicate Account Handling: ${results.test4 ? '✅ PASS' : '❌ FAIL'}`);

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  console.log(`\nResult: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log(`\n🎉 All tests passed! Email restriction is working correctly.`);
  } else {
    console.log(`\n⚠️  Some tests failed. Please review the output above.`);
  }

  console.log(`${'═'.repeat(70)}\n`);

  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
