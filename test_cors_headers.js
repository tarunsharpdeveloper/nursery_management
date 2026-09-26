#!/usr/bin/env node

/**
 * Test CORS Headers - Check what headers the backend is actually returning
 */

async function testCorsHeaders() {
  const apiUrl = 'https://api.awantikaseeds.com/api/products';
  
  console.log('\n' + '='.repeat(60));
  console.log('CORS HEADERS TEST');
  console.log('='.repeat(60) + '\n');

  console.log('Testing OPTIONS preflight request...');
  console.log(`URL: ${apiUrl}`);
  
  try {
    // Make OPTIONS request (preflight)
    const response = await fetch(apiUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://awantikaseeds.com',
        'Access-Control-Request-Method': 'PATCH',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });

    console.log('\n📋 RESPONSE STATUS:');
    console.log(`Status: ${response.status} ${response.statusText}`);

    console.log('\n📋 CORS HEADERS RECEIVED:');
    console.log('-'.repeat(60));
    
    const headers = {};
    response.headers.forEach((value, name) => {
      headers[name] = value;
      if (name.toLowerCase().includes('access-control')) {
        console.log(`✅ ${name}: ${value}`);
      }
    });

    // Check specific headers
    const allowMethods = response.headers.get('Access-Control-Allow-Methods');
    const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
    const allowHeaders = response.headers.get('Access-Control-Allow-Headers');

    console.log('\n📋 CORS VALIDATION:');
    console.log('-'.repeat(60));
    
    if (allowOrigin) {
      console.log(`✅ Access-Control-Allow-Origin: ${allowOrigin}`);
    } else {
      console.log('❌ Access-Control-Allow-Origin: MISSING');
    }

    if (allowMethods) {
      console.log(`✅ Access-Control-Allow-Methods: ${allowMethods}`);
      if (allowMethods.includes('PATCH')) {
        console.log('   ✓ PATCH method is allowed');
      } else {
        console.log('   ❌ PATCH method is NOT allowed');
      }
    } else {
      console.log('❌ Access-Control-Allow-Methods: MISSING');
    }

    if (allowHeaders) {
      console.log(`✅ Access-Control-Allow-Headers: ${allowHeaders}`);
    } else {
      console.log('❌ Access-Control-Allow-Headers: MISSING');
    }

    console.log('\n📋 ALL RESPONSE HEADERS:');
    console.log('-'.repeat(60));
    response.headers.forEach((value, name) => {
      console.log(`${name}: ${value}`);
    });

  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\nThis could mean:');
      console.log('1. Backend is not running');
      console.log('2. Backend is not accessible at api.awantikaseeds.com');
      console.log('3. DNS/network issue');
      console.log('4. SSL certificate issue');
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

testCorsHeaders().catch(console.error);