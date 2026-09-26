/**
 * CORS Fix Test Script
 * 
 * Tests CORS configuration between frontend (localhost:3000) and backend (localhost:4000)
 */

const http = require('http');

console.log('🧪 Testing CORS Configuration...\n');

// Test 1: OPTIONS preflight request
function testOptionsRequest() {
  console.log('1️⃣  Testing OPTIONS preflight request...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/products',
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`   📊 Status: ${res.statusCode}`);
      console.log(`   🔍 CORS Headers:`);
      console.log(`      Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'MISSING'}`);
      console.log(`      Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods'] || 'MISSING'}`);
      console.log(`      Access-Control-Allow-Headers: ${res.headers['access-control-allow-headers'] || 'MISSING'}`);
      
      if (res.headers['access-control-allow-origin'] === 'http://localhost:3000') {
        console.log(`   ✅ CORS preflight: WORKING`);
      } else {
        console.log(`   ❌ CORS preflight: FAILED - Expected 'http://localhost:3000', got '${res.headers['access-control-allow-origin']}'`);
      }
      
      resolve(res.statusCode === 204);
    });

    req.on('error', (error) => {
      console.log(`   ❌ OPTIONS request failed: ${error.message}`);
      resolve(false);
    });

    req.end();
  });
}

// Test 2: Actual GET request
function testGetRequest() {
  console.log('\n2️⃣  Testing GET request with Origin header...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/products',
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`   📊 Status: ${res.statusCode}`);
      console.log(`   🔍 CORS Headers:`);
      console.log(`      Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'MISSING'}`);
      
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`   📦 Response: ${Array.isArray(result) ? result.length + ' products' : 'Non-array response'}`);
        } catch (e) {
          console.log(`   📦 Response: ${data.substring(0, 100)}...`);
        }
        
        if (res.headers['access-control-allow-origin'] === 'http://localhost:3000') {
          console.log(`   ✅ GET request CORS: WORKING`);
        } else {
          console.log(`   ❌ GET request CORS: FAILED - Expected 'http://localhost:3000', got '${res.headers['access-control-allow-origin']}'`);
        }
        
        resolve(res.statusCode === 200 && res.headers['access-control-allow-origin'] === 'http://localhost:3000');
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ GET request failed: ${error.message}`);
      resolve(false);
    });

    req.end();
  });
}

// Test 3: POST request (simulating admin operation)
function testPostRequest() {
  console.log('\n3️⃣  Testing POST request (admin operation)...');
  
  return new Promise((resolve) => {
    const testData = JSON.stringify({
      categoryId: 1,
      name: 'CORS Test Product',
      sellingPrice: 100,
      actualPrice: 80,
      availableQuantity: 10,
      mediaUrls: '["test.jpg"]',
      variants: []
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/products',
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData)
      }
    };

    const req = http.request(options, (res) => {
      console.log(`   📊 Status: ${res.statusCode}`);
      console.log(`   🔍 CORS Headers:`);
      console.log(`      Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'MISSING'}`);
      
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`   📦 Response: ${result.message || JSON.stringify(result).substring(0, 100)}`);
        } catch (e) {
          console.log(`   📦 Response: ${data.substring(0, 100)}`);
        }
        
        // Even if auth fails (401), CORS headers should be present
        if (res.headers['access-control-allow-origin'] === 'http://localhost:3000') {
          console.log(`   ✅ POST request CORS: WORKING`);
          if (res.statusCode === 401) {
            console.log(`   💡 Note: 401 is expected (auth required) - CORS is working`);
          }
        } else {
          console.log(`   ❌ POST request CORS: FAILED`);
        }
        
        resolve(res.headers['access-control-allow-origin'] === 'http://localhost:3000');
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ POST request failed: ${error.message}`);
      resolve(false);
    });

    req.write(testData);
    req.end();
  });
}

// Test 4: Check browser can make the requests
function testBrowserCompatibility() {
  console.log('\n4️⃣  Browser compatibility test...');
  
  console.log(`   💡 To test in browser, open Developer Tools and run:`);
  console.log(`   
fetch('http://localhost:4000/api/products', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(r => console.log('Status:', r.status, 'CORS OK:', r.ok))
.then(r => r.json())
.then(data => console.log('Data:', Array.isArray(data) ? data.length + ' products' : data))
.catch(e => console.error('CORS Error:', e));`);
}

// Main test execution
async function runCORSTests() {
  console.log('🎯 GOAL: Fix CORS issues between localhost:3000 and localhost:4000\n');
  
  const optionsOk = await testOptionsRequest();
  const getOk = await testGetRequest();
  const postOk = await testPostRequest();
  
  testBrowserCompatibility();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 CORS TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log(`✅ OPTIONS preflight: ${optionsOk ? 'WORKING' : 'FAILED'}`);
  console.log(`✅ GET request CORS: ${getOk ? 'WORKING' : 'FAILED'}`);
  console.log(`✅ POST request CORS: ${postOk ? 'WORKING' : 'FAILED'}`);
  
  if (optionsOk && getOk && postOk) {
    console.log('\n🎉 ALL CORS TESTS PASSED!');
    console.log('✅ Your frontend should now be able to communicate with backend');
    console.log('💡 If you still see CORS errors, restart both servers');
  } else {
    console.log('\n❌ SOME CORS TESTS FAILED');
    console.log('\n🔧 FIXES TO TRY:');
    console.log('1. Check backend/.env CORS_ORIGIN=http://localhost:3000');
    console.log('2. Restart backend server: cd backend && npm start');
    console.log('3. Restart frontend server: cd frontend && npm run dev');
    console.log('4. Clear browser cache and cookies');
    console.log('5. Check no other processes using port 4000');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the tests
runCORSTests().catch(console.error);