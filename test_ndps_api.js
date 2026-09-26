#!/usr/bin/env node

/**
 * NDPS API Test Script
 * Tests if the NDPS payment gateway is responding and accessible
 * Run with: node test_ndps_api.js
 */

const https = require('https');
const http = require('http');

console.log('====================================');
console.log('  NDPS Payment Gateway Test');
console.log('====================================\n');

// Test URLs
const testUrls = [
  {
    name: 'Primary AtomPaynetz Script (Frontend)',
    url: 'https://pgtest.atomtech.in/staticdata/ots/js/atomcheckout.js',
    type: 'GET'
  },
  {
    name: 'Alternate AtomPaynetz Script',
    url: 'https://atomtech.in/ots/atomcheckout.js',
    type: 'GET'
  },
  {
    name: 'NDPS Test API (Backend)',
    url: 'https://caller.atomtech.in/ots/aipay/auth',
    type: 'POST'
  },
  {
    name: 'NDPS Production API (Backend)',
    url: 'https://paynetz.atomtech.in/ots/aipay/auth',
    type: 'POST'
  }
];

function testUrl(testCase) {
  return new Promise((resolve) => {
    const url = new URL(testCase.url);
    const protocol = url.protocol === 'https:' ? https : http;
    
    console.log(`\n🔍 Testing: ${testCase.name}`);
    console.log(`   URL: ${testCase.url}`);
    console.log(`   Method: ${testCase.type}`);
    
    const startTime = Date.now();
    
    const options = {
      method: testCase.type,
      hostname: url.hostname,
      path: url.pathname + url.search,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      timeout: 10000,
      headers: {
        'User-Agent': 'NDPS-Test-Script/1.0',
        'Accept': '*/*',
      }
    };

    const request = protocol.request(options, (response) => {
      const duration = Date.now() - startTime;
      const statusCode = response.statusCode;
      
      console.log(`   ✅ Response Status: ${statusCode}`);
      console.log(`   ⏱️  Response Time: ${duration}ms`);
      console.log(`   📍 Headers:`, {
        'Content-Type': response.headers['content-type'],
        'Content-Length': response.headers['content-length'],
        'Server': response.headers['server']
      });
      
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        if (data) {
          console.log(`   📦 Data (first 200 chars): ${data.substring(0, 200)}`);
        }
        resolve({
          name: testCase.name,
          success: statusCode < 400,
          statusCode,
          duration,
          error: null
        });
      });
    });

    request.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`   ❌ Error: ${error.code || error.message}`);
      console.log(`   ⏱️  Failed after: ${duration}ms`);
      resolve({
        name: testCase.name,
        success: false,
        statusCode: null,
        duration,
        error: error.message || error.code
      });
    });

    request.on('timeout', () => {
      request.destroy();
      console.log(`   ⏱️  Timeout after 10 seconds`);
      resolve({
        name: testCase.name,
        success: false,
        statusCode: null,
        duration: 10000,
        error: 'TIMEOUT'
      });
    });

    // For POST requests, send empty body
    if (testCase.type === 'POST') {
      request.write('');
    }
    
    request.end();
  });
}

async function runTests() {
  const results = [];
  
  console.log(`\n🚀 Starting ${testUrls.length} tests...\n`);
  console.log('================================\n');

  // Test each URL sequentially
  for (const testCase of testUrls) {
    const result = await testUrl(testCase);
    results.push(result);
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n\n================================');
  console.log('  TEST SUMMARY');
  console.log('================================\n');

  let successCount = 0;
  let failureCount = 0;

  results.forEach((result) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const statusCode = result.statusCode ? `(${result.statusCode})` : '';
    const errorMsg = result.error ? ` - ${result.error}` : '';
    
    console.log(`${status} ${result.name} ${statusCode}${errorMsg}`);
    
    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }
  });

  console.log(`\n📊 Results: ${successCount} passed, ${failureCount} failed\n`);

  // Analysis
  console.log('================================');
  console.log('  ANALYSIS & RECOMMENDATIONS');
  console.log('================================\n');

  const scriptTests = results.filter(r => r.name.includes('Script'));
  const apiTests = results.filter(r => r.name.includes('API'));

  const scriptsWorking = scriptTests.some(r => r.success);
  const apiWorking = apiTests.some(r => r.success);

  if (!scriptsWorking) {
    console.log('⚠️  FRONTEND SCRIPTS FAILING:');
    console.log('   - The AtomPaynetz payment scripts are not accessible');
    console.log('   - This explains the "Payment gateway is temporarily unavailable" error');
    console.log('   - Possible causes:');
    console.log('     1. AtomPaynetz service is down or under maintenance');
    console.log('     2. The script URLs have changed or been moved');
    console.log('     3. Network/ISP blocking the connection');
    console.log('     4. Regional restrictions on the service\n');
  } else {
    console.log('✅ FRONTEND SCRIPTS: Working correctly\n');
  }

  if (!apiWorking) {
    console.log('⚠️  BACKEND APIs FAILING:');
    console.log('   - The NDPS backend payment APIs are not responding');
    console.log('   - Backend initiation requests will fail');
    console.log('   - Check your backend logs and NDPS configuration\n');
  } else {
    console.log('✅ BACKEND APIS: Working correctly\n');
  }

  console.log('💡 NEXT STEPS:');
  console.log('   1. Check your internet connection');
  console.log('   2. Try from a different network/VPN');
  console.log('   3. Contact AtomPaynetz support:');
  console.log('      - Verify the correct script and API URLs');
  console.log('      - Check if service is under maintenance');
  console.log('      - Validate your merchant credentials');
  console.log('   4. Check backend .env for correct NDPS configuration');
  console.log('   5. Review backend logs for detailed error messages\n');

  console.log('====================================\n');
}

// Run the tests
runTests().catch(console.error);
