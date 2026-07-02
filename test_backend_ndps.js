/**
 * Test the backend NDPS endpoint directly
 */

const testPayment = {
  orderId: 1, // Make sure this order exists in your database
  customerEmail: "test@example.com",
  customerMobile: "9876543210",
  amount: "100.00"
};

async function testNDPSBackend() {
  try {
    console.log('=== Testing Backend NDPS Endpoint ===');
    console.log('Test data:', testPayment);
    
    const response = await fetch('http://localhost:4000/api/ndps/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayment)
    });
    
    console.log('Backend response status:', response.status);
    console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Backend response success:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Backend response error:');
      console.log(error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testNDPSBackend();