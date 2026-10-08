const http = require('http');

// Test the thumbnail update API
const testData = JSON.stringify({
  id: 11,
  thumbnailUrl: "/uploads/test-thumbnail.jpg"
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/gallery/update-thumbnail',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData)
  }
};

console.log('Testing PATCH /api/gallery/update-thumbnail...');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Headers:', res.headers);
    console.log('Response Body:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(testData);
req.end();