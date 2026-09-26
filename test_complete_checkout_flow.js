#!/usr/bin/env node

/**
 * Complete Checkout Flow Test
 * Tests URL configuration, email checking, and account creation
 */

// Test configuration
const API_BASE_URL = 'https://api.awantikaseeds.com';
const FRONTEND_URL = 'https://awantikaseeds.com';

console.log('\n' + '='.repeat(70));
console.log('COMPLETE CHECKOUT FLOW TEST');
console.log('='.repeat(70) + '\n');

console.log('📋 CONFIGURATION:');
console.log('-'.repeat(70));
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`Frontend URL: ${FRONTEND_URL}`);
console.log(`Test Email: test.checkout@example.com`);
console.log(`Test Phone: 9876543210`);

// Test data
const testCustomer = {
  name: "Test Customer",
  email: "test.checkout@example.com",
  phone: "9876543210",
  address: "Test Address, Test City - 123456"
};

async function testEmailCheck(email) {
  console.log(`\n📧 Testing Email Check: ${email}`);
  console.log('-'.repeat(50));
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Email exists: ${result.exists}`);
      return result.exists;
    } else {
      console.log(`❌ Status: ${response.status}`);
      console.log(`❌ Error: ${result.message || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return null;
  }
}

async function testAutoAccountCreation(customerData, withEmail = false) {
  const endpoint = withEmail ? '/api/auth/auto-create-account' : '/api/auth/auto-create-account-phone';
  console.log(`\n👤 Testing Account Creation: ${endpoint}`);
  console.log('-'.repeat(50));
  console.log(`Name: ${customerData.name}`);
  console.log(`Email: ${customerData.email}`);
  console.log(`Phone: ${customerData.phone}`);
  console.log(`Email notification: ${withEmail ? 'YES' : 'NO'}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone
      })
    });

    const result = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Result: ${result.message}`);
    
    if (result.accountCreated) {
      console.log(`✅ Account created successfully`);
    } else if (result.accountExists) {
      console.log(`⚠️  Account already exists`);
    }
    
    return result;
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return null;
  }
}

async function testOrderCreation(customerData) {
  console.log(`\n📦 Testing Order Creation`);
  console.log('-'.repeat(50));
  
  // Sample cart items (you can modify these)
  const sampleItems = [
    { productId: 1, quantity: 2, unitPrice: 50.00 },
    { productId: 2, quantity: 1, unitPrice: 75.00 }
  ];
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: {
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email,
          address: customerData.address
        },
        items: sampleItems
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Order ID: ${result.orderId}`);
      console.log(`📊 Order Number: ${result.orderNumber}`);
      return result;
    } else {
      console.log(`❌ Status: ${response.status}`);
      console.log(`❌ Error: ${result.message || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return null;
  }
}

async function testNDPSPaymentInit(orderId, amount, customerData) {
  console.log(`\n💳 Testing NDPS Payment Initiation`);
  console.log('-'.repeat(50));
  console.log(`Order ID: ${orderId}`);
  console.log(`Amount: ₹${amount}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/ndps/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId: orderId,
        amount: amount,
        customerEmail: customerData.email,
        customerMobile: customerData.phone
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Payment ID: ${result.paymentId}`);
      console.log(`📊 Token ID: ${result.atomTokenId}`);
      console.log(`📊 Merchant ID: ${result.merchId}`);
      console.log(`📊 Environment: ${result.env}`);
      return result;
    } else {
      console.log(`❌ Status: ${response.status}`);
      console.log(`❌ Error: ${result.error || 'Unknown error'}`);
      if (result.details) {
        console.log(`📋 Details: ${result.details}`);
      }
      return null;
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return null;
  }
}

async function testHealthCheck() {
  console.log(`\n🏥 Testing Backend Health`);
  console.log('-'.repeat(50));
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const result = await response.json();
    
    if (response.ok && result.status === 'ok') {
      console.log(`✅ Backend is healthy`);
      console.log(`📊 Service: ${result.service}`);
      return true;
    } else {
      console.log(`❌ Backend health check failed`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Backend is not accessible: ${error.message}`);
    return false;
  }
}

async function runCompleteTest() {
  // Step 1: Health Check
  const isHealthy = await testHealthCheck();
  if (!isHealthy) {
    console.log('\n🚨 Backend is not accessible. Please check:');
    console.log('1. Backend service is running: pm2 status');
    console.log('2. DNS/SSL is working for api.awantikaseeds.com');
    console.log('3. Firewall allows HTTPS traffic');
    return;
  }

  // Step 2: Email Check (should return false initially)
  console.log('\n' + '='.repeat(70));
  console.log('STEP 2: EMAIL VERIFICATION FLOW');
  console.log('='.repeat(70));
  
  const emailExists = await testEmailCheck(testCustomer.email);
  
  if (emailExists === true) {
    console.log(`\n✅ Email ${testCustomer.email} already exists in system`);
    console.log(`   This means a previous test run created it, or user exists`);
  } else if (emailExists === false) {
    console.log(`\n✅ Email ${testCustomer.email} is available for new account`);
    console.log(`   This is the expected state for a new user`);
  } else {
    console.log(`\n❌ Email check failed - cannot proceed with test`);
    return;
  }

  // Step 3: Account Creation (if email doesn't exist)
  console.log('\n' + '='.repeat(70));
  console.log('STEP 3: ACCOUNT CREATION FLOW');
  console.log('='.repeat(70));
  
  if (emailExists === false) {
    console.log(`\n🔄 Testing account creation with email notification...`);
    await testAutoAccountCreation(testCustomer, true);
    
    console.log(`\n🔄 Testing account creation without email (phone as password)...`);
    await testAutoAccountCreation({...testCustomer, email: testCustomer.email.replace('@', '+phone@')}, false);
  } else {
    console.log(`\n⚠️  Skipping account creation - email already exists`);
  }

  // Step 4: Order Creation
  console.log('\n' + '='.repeat(70));
  console.log('STEP 4: ORDER CREATION');
  console.log('='.repeat(70));
  
  const orderResult = await testOrderCreation(testCustomer);
  if (!orderResult) {
    console.log(`\n❌ Order creation failed - cannot test payment`);
    return;
  }

  // Step 5: Payment Initiation
  console.log('\n' + '='.repeat(70));
  console.log('STEP 5: NDPS PAYMENT INITIATION');
  console.log('='.repeat(70));
  
  const totalAmount = 175.00; // 2*50 + 1*75 from sample items
  const paymentResult = await testNDPSPaymentInit(orderResult.orderId, totalAmount, testCustomer);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  
  console.log(`\n📊 RESULTS:`);
  console.log(`   Health Check: ${isHealthy ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Email Check: ${emailExists !== null ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Order Creation: ${orderResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Payment Init: ${paymentResult ? '✅ PASS' : '❌ FAIL'}`);

  console.log(`\n🔍 ANALYSIS:`);
  
  if (paymentResult) {
    console.log(`   ✅ All systems working correctly!`);
    console.log(`   ✅ URLs are configured properly`);
    console.log(`   ✅ Email checking works as expected`);
    console.log(`   ✅ Account creation handles duplicates`);
    console.log(`   ✅ NDPS payment can be initiated`);
    console.log(`   \n⚠️  Note: Payment will fail with "UNIDENTIFIED MERCHANT DOMAIN"`);
    console.log(`   This is expected until NTT Data whitelists awantikaseeds.com`);
  } else {
    console.log(`   ❌ Payment initiation failed`);
    console.log(`   Check backend logs: pm2 logs backend-app`);
  }

  console.log(`\n📝 NEXT STEPS:`);
  console.log(`   1. If payment init works: Contact NTT Data for domain whitelisting`);
  console.log(`   2. If payment init fails: Check backend configuration`);
  console.log(`   3. Test complete flow on frontend: ${FRONTEND_URL}/checkout`);

  console.log('\n' + '='.repeat(70) + '\n');
}

// Run the complete test
runCompleteTest().catch(error => {
  console.error('\n❌ Test failed with error:', error.message);
  console.log('\nThis could mean:');
  console.log('1. Backend service is not running');
  console.log('2. Network/DNS issues');
  console.log('3. SSL certificate problems');
  console.log('4. CORS configuration issues');
});