/**
 * Test Payment Return API Endpoints
 * This script tests the payment status and requery APIs to ensure they work correctly
 */

// Test configuration
const BACKEND_URL = 'https://api.awantikaseeds.com'; // Production backend
const TEST_MERCHANT_TXN_ID = 'NURSERY_123_test'; // Replace with actual merchant transaction ID from a test payment

async function testPaymentStatusAPI() {
  console.log('=== Testing Payment Status API ===');
  
  try {
    // Test 1: Check if NDPS status endpoint works
    const statusResponse = await fetch(`${BACKEND_URL}/api/ndps/status/1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('Status API Response Code:', statusResponse.status);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('Status API Response:', statusData);
    } else {
      const errorText = await statusResponse.text();
      console.log('Status API Error:', errorText);
    }
    
    // Test 2: Check requery endpoint
    console.log('\n=== Testing Requery API ===');
    
    const requeryResponse = await fetch(`${BACKEND_URL}/api/ndps/requery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        merchTxnId: TEST_MERCHANT_TXN_ID
      })
    });
    
    console.log('Requery API Response Code:', requeryResponse.status);
    
    if (requeryResponse.ok) {
      const requeryData = await requeryResponse.json();
      console.log('Requery API Response:', requeryData);
    } else {
      const errorText = await requeryResponse.text();
      console.log('Requery API Error:', errorText);
    }
    
    // Test 3: Check CORS headers
    console.log('\n=== Testing CORS Headers ===');
    
    const corsResponse = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'OPTIONS'
    });
    
    console.log('CORS Response Code:', corsResponse.status);
    console.log('CORS Headers:');
    corsResponse.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testPaymentStatusAPI();

console.log(`
=== Payment Return Page Diagnostics ===

This script tests the key APIs that the payment return page uses:

1. /api/ndps/status/{paymentId} - Gets payment status from database
2. /api/ndps/requery - Queries live status from NDPS gateway
3. CORS headers - Ensures frontend can make these API calls

If you see any errors above:
- Check that the backend server is running at ${BACKEND_URL}
- Verify the NDPS route fix is deployed (no extra space in "response")
- Ensure database connection is working
- Check CORS_ORIGIN is set to https://awantikaseeds.com in backend .env

To test with a real payment:
1. Make a test payment and get the merchant transaction ID
2. Replace TEST_MERCHANT_TXN_ID in this script with the real ID
3. Run the script again to see actual payment data
`);