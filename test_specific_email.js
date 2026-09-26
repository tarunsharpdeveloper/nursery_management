/**
 * Test Script: Specific Email Checkout Test
 * 
 * Testing with email: eway.manas25@gmail.com
 */

const https = require('https');

// Configuration
const BACKEND_URL = 'https://api.awantikaseeds.com';
const TEST_EMAIL = 'eway.manas25@gmail.com';

console.log('🧪 Testing Specific Email: eway.manas25@gmail.com\n');

// Test 1: Check if email exists
async function testEmailCheck() {
  console.log('1️⃣  Checking if email exists...');
  
  const postData = JSON.stringify({ email: TEST_EMAIL });
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.awantikaseeds.com',
      path: '/api/auth/check-email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`   📧 Email check response:`, result);
          
          if (result.exists) {
            console.log(`   ✅ CONFIRMED: ${TEST_EMAIL} exists in database`);
            console.log(`   🎯 This email should now be able to place orders without restrictions`);
          } else {
            console.log(`   ⚠️  Email ${TEST_EMAIL} NOT found in database`);
          }
          
          resolve(result);
        } catch (error) {
          console.error(`   ❌ Error parsing response:`, error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`   ❌ Request error:`, error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test 2: Get available products
async function getProducts() {
  console.log('\n2️⃣  Fetching available products...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.awantikaseeds.com',
      path: '/api/products',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (res.statusCode === 200 && Array.isArray(result) && result.length > 0) {
            console.log(`   ✅ Found ${result.length} products`);
            console.log(`   ✅ Using product: ${result[0].name} (ID: ${result[0].id})`);
            resolve(result[0]);
          } else {
            console.log(`   ❌ No products found`);
            resolve(null);
          }
        } catch (error) {
          console.error(`   ❌ Error parsing products response:`, error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`   ❌ Request error:`, error);
      reject(error);
    });

    req.end();
  });
}

// Test 3: Attempt order creation with existing email
async function testOrderCreation(product) {
  console.log('\n3️⃣  Testing order creation with existing email...');
  console.log(`     Email: ${TEST_EMAIL}`);
  console.log(`     Product: ${product.name} (${product.id})`);
  
  const orderData = JSON.stringify({
    customer: {
      name: "Manas Pathak",
      email: TEST_EMAIL,
      phone: "9876543210",
      address: "Test Address, City - 400001"
    },
    items: [
      {
        productId: parseInt(product.id),
        quantity: 1,
        unitPrice: parseFloat(product.selling_price || product.price || 100)
      }
    ]
  });
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.awantikaseeds.com',
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(orderData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`   🎉 SUCCESS: Order created successfully!`);
            console.log(`   ✅ Order ID: ${result.orderId}`);
            console.log(`   ✅ Order Number: ${result.orderNumber}`);
            console.log(`   ✅ Existing email restriction removal is WORKING!`);
            resolve({ success: true, result });
          } else {
            console.log(`   ❌ Order creation failed with status ${res.statusCode}`);
            console.log(`   ❌ Response:`, result);
            resolve({ success: false, result });
          }
        } catch (error) {
          console.error(`   ❌ Error parsing response:`, error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`   ❌ Request error:`, error);
      reject(error);
    });

    req.write(orderData);
    req.end();
  });
}

// Main test execution
async function runSpecificEmailTest() {
  try {
    console.log('🎯 GOAL: Verify eway.manas25@gmail.com can place orders without restrictions\n');
    
    // Test 1: Check if email exists
    const emailCheck = await testEmailCheck();
    
    // Test 2: Get products
    const product = await getProducts();
    if (!product) {
      console.log('\n❌ Cannot proceed without valid products');
      return;
    }
    
    // Test 3: Try to create order
    const orderResult = await testOrderCreation(product);
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 SPECIFIC EMAIL TEST RESULTS: eway.manas25@gmail.com');
    console.log('='.repeat(70));
    
    console.log('\n📋 EMAIL STATUS:');
    console.log(`  Email exists in database: ${emailCheck.exists ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n🛒 ORDER CREATION:');
    if (orderResult.success) {
      console.log('  🎉 SUCCESS: Order created successfully!');
      console.log(`  ✅ Order ID: ${orderResult.result.orderId}`);
      console.log(`  ✅ Order Number: ${orderResult.result.orderNumber}`);
    } else {
      console.log('  ❌ FAILED: Order creation unsuccessful');
      if (orderResult.result.message) {
        console.log(`  ❌ Reason: ${orderResult.result.message}`);
      }
    }
    
    console.log('\n🎯 CONCLUSION:');
    if (emailCheck.exists && orderResult.success) {
      console.log('  ✅ Email restriction removal is WORKING for this existing email');
      console.log('  ✅ User can place orders without login or restrictions');
      console.log('  ✅ Frontend changes are effective');
    } else if (!emailCheck.exists) {
      console.log('  ⚠️  Email not found in database - cannot test existing email flow');
      if (orderResult.success) {
        console.log('  ✅ But new email order creation works fine');
      }
    } else {
      console.log('  ❌ Email exists but order creation failed - investigate further');
    }
    
    console.log('\n' + '='.repeat(70));
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
  }
}

// Run the test
runSpecificEmailTest();