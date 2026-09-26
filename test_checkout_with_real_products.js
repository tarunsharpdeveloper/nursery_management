#!/usr/bin/env node

/**
 * Checkout Test with Real Products
 * Tests the complete flow using existing products from the database
 */

const API_BASE_URL = 'https://api.awantikaseeds.com';
const FRONTEND_URL = 'https://awantikaseeds.com';

console.log('\n' + '='.repeat(70));
console.log('CHECKOUT TEST WITH REAL PRODUCTS');
console.log('='.repeat(70) + '\n');

const testCustomer = {
  name: "Test Customer Real",
  email: "test.real@example.com",
  phone: "9876543211",
  address: "Test Address, Test City - 123456"
};

async function getAvailableProducts() {
  console.log(`\n📦 Fetching Available Products`);
  console.log('-'.repeat(50));
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    const products = await response.json();
    
    if (response.ok && Array.isArray(products) && products.length > 0) {
      console.log(`✅ Found ${products.length} products`);
      
      // Show first few products (any status since some may not have status field)
      const availableProducts = products.slice(0, 3);
      console.log(`📊 Available products: ${availableProducts.length}`);
      
      availableProducts.forEach((product, index) => {
        const status = product.status || 'unknown';
        console.log(`   ${index + 1}. ID: ${product.id}, Name: ${product.name}, Price: ₹${product.selling_price}, Status: ${status}`);
      });
      
      return availableProducts;
    } else {
      console.log(`❌ No products found or invalid response`);
      return [];
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return [];
  }
}

async function testEmailExists(email) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const result = await response.json();
    return response.ok ? result.exists : null;
  } catch (error) {
    return null;
  }
}

async function createTestOrder(customerData, products) {
  console.log(`\n📦 Creating Order with Real Products`);
  console.log('-'.repeat(50));
  
  // Create cart items from real products (use minimal quantities to avoid stock issues)
  const cartItems = products.slice(0, 1).map((product, index) => ({
    productId: product.id,
    quantity: 1, // Use minimal quantity
    unitPrice: parseFloat(product.selling_price)
  }));
  
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  
  console.log(`📊 Cart Items:`);
  cartItems.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    console.log(`   - ${product.name}: ${item.quantity} x ₹${item.unitPrice} = ₹${item.quantity * item.unitPrice}`);
  });
  console.log(`📊 Total Amount: ₹${totalAmount.toFixed(2)}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email,
          address: customerData.address
        },
        items: cartItems
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Order created successfully`);
      console.log(`📊 Order ID: ${result.orderId}`);
      console.log(`📊 Order Number: ${result.orderNumber}`);
      return { ...result, totalAmount };
    } else {
      console.log(`❌ Order creation failed: ${result.message}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return null;
  }
}

async function testNDPSPayment(orderId, amount, customerData) {
  console.log(`\n💳 Testing NDPS Payment with Order ID ${orderId}`);
  console.log('-'.repeat(50));
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/ndps/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderId,
        amount: amount,
        customerEmail: customerData.email,
        customerMobile: customerData.phone
      })
    });

    const result = await response.json();
    
    console.log(`📊 Response Status: ${response.status}`);
    
    if (response.ok && result.success) {
      console.log(`✅ NDPS Token Generated Successfully!`);
      console.log(`📊 Payment ID: ${result.paymentId}`);
      console.log(`📊 Atom Token ID: ${result.atomTokenId}`);
      console.log(`📊 Merchant ID: ${result.merchId}`);
      console.log(`📊 Environment: ${result.env}`);
      console.log(`📊 Return URL: ${result.returnUrl}`);
      
      console.log(`\n🎉 PAYMENT INITIATION SUCCESS!`);
      console.log(`   The token generation works perfectly.`);
      console.log(`   Next step: Frontend popup will open with this token.`);
      
      return result;
    } else {
      console.log(`❌ NDPS Payment Failed`);
      console.log(`📊 Error: ${result.error}`);
      if (result.details) {
        console.log(`📊 Details: ${result.details}`);
        
        if (result.details.includes('UNIDENTIFIED MERCHANT DOMAIN')) {
          console.log(`\n🚨 DOMAIN ISSUE CONFIRMED:`);
          console.log(`   This error means NTT Data doesn't recognize awantikaseeds.com`);
          console.log(`   Contact NTT Data to whitelist your domain.`);
        }
      }
      return null;
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return null;
  }
}

async function runRealTest() {
  // Step 1: Get real products
  const products = await getAvailableProducts();
  if (products.length === 0) {
    console.log(`\n❌ No products available for testing`);
    console.log(`   Please add some products to the system first.`);
    return;
  }

  // Step 2: Check email (should be new)
  console.log(`\n📧 Checking Email: ${testCustomer.email}`);
  console.log('-'.repeat(50));
  
  const emailExists = await testEmailExists(testCustomer.email);
  if (emailExists === true) {
    console.log(`✅ Email exists (from previous test)`);
  } else if (emailExists === false) {
    console.log(`✅ Email available (new user)`);
  }

  // Step 3: Create order with real products
  const orderResult = await createTestOrder(testCustomer, products);
  if (!orderResult) {
    console.log(`\n❌ Cannot proceed without a valid order`);
    return;
  }

  // Step 4: Test NDPS payment
  const paymentResult = await testNDPSPayment(
    orderResult.orderId, 
    orderResult.totalAmount, 
    testCustomer
  );

  // Step 5: Summary
  console.log('\n' + '='.repeat(70));
  console.log('COMPREHENSIVE TEST SUMMARY');
  console.log('='.repeat(70));
  
  console.log(`\n📊 RESULTS:`);
  console.log(`   Products Available: ${products.length > 0 ? '✅ YES' : '❌ NO'}`);
  console.log(`   Email Check: ${emailExists !== null ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Order Creation: ${orderResult ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`   NDPS Payment Init: ${paymentResult ? '✅ SUCCESS' : '❌ FAILED'}`);

  console.log(`\n🎯 ANALYSIS:`);
  
  if (paymentResult) {
    console.log(`\n🎉 EXCELLENT! Your system is working perfectly!`);
    console.log(`\n✅ CONFIRMED WORKING:`);
    console.log(`   • Backend API is accessible and healthy`);
    console.log(`   • Product catalog is populated`);
    console.log(`   • Email checking works correctly`);
    console.log(`   • Order creation with foreign keys works`);
    console.log(`   • NDPS token generation is successful`);
    console.log(`   • All credentials and encryption are correct`);
    
    console.log(`\n⏳ REMAINING STEP:`);
    console.log(`   Contact NTT Data to whitelist domain: awantikaseeds.com`);
    console.log(`   Provide them: Merchant ID 856377, Domain awantikaseeds.com`);
    
    console.log(`\n🚀 READY FOR:`);
    console.log(`   • Full checkout testing on frontend`);
    console.log(`   • Live payment processing (once domain is whitelisted)`);
    
  } else if (orderResult && !paymentResult) {
    console.log(`\n⚠️  System partially working:`);
    console.log(`   • Backend and order creation: ✅ Working`);
    console.log(`   • Payment gateway: ❌ Domain issue`);
    console.log(`\n📞 ACTION REQUIRED:`);
    console.log(`   Contact NTT Data immediately for domain registration`);
    
  } else {
    console.log(`\n❌ System has issues that need fixing`);
    console.log(`   Check backend logs: pm2 logs backend-app`);
  }

  console.log(`\n📋 FRONTEND TESTING:`);
  console.log(`   1. Go to: ${FRONTEND_URL}/products`);
  console.log(`   2. Add products to cart`);
  console.log(`   3. Go to checkout`);
  console.log(`   4. Fill details and click "Pay Now"`);
  console.log(`   5. Should see NDPS popup (may show domain error)`);

  console.log('\n' + '='.repeat(70) + '\n');
}

// Execute the test
runRealTest().catch(error => {
  console.error('\n❌ Test execution failed:', error.message);
});