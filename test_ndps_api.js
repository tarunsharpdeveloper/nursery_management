/**
 * Simple Node.js script to test NDPS payment initiation API
 * Run: node test_ndps_api.js
 */

const http = require('http');

const payload = {
  orderId: 1,
  customerEmail: 'test@example.com',
  customerMobile: '9876543210',
  amount: 100.00
};

const data = JSON.stringify(payload);

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/ndps/initiate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Testing NDPS Payment Initiation API...');
console.log('Payload:', payload);
console.log('');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  console.log('');

  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:');
    try {
      const parsed = JSON.parse(responseData);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (res.statusCode === 200) {
        console.log('\n✅ SUCCESS! Payment initiation successful.');
        console.log('Payment ID:', parsed.paymentId);
        console.log('Gateway URL:', parsed.gatewayUrl);
      } else {
        console.log('\n❌ ERROR! Payment initiation failed.');
      }
    } catch (e) {
      console.log(responseData);
      console.log('\n❌ ERROR! Invalid JSON response.');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('\nMake sure the backend server is running:');
  console.log('  cd backend');
  console.log('  node app.js');
});

req.write(data);
req.end();
