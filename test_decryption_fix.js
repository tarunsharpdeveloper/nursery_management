/**
 * Test script for the enhanced decryption function
 * This tests various problematic encrypted response scenarios
 */

const crypto = require('crypto');

// Test configuration
const config = {
  responseKey: "75AEF0FA1B94B3C10D4F5B268F757F11",
  responseSalt: "75AEF0FA1B94B3C10D4F5B268F757F11"
};

const algorithm = 'aes-256-cbc';
const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 'utf8');

/**
 * Enhanced decryption function (same as in ndps-payments.js)
 */
function decryptData(encryptedData) {
  try {
    console.log('=== TESTING DECRYPTION ===');
    console.log('Input:', encryptedData.substring(0, 100) + '...');
    console.log('Length:', encryptedData.length);
    
    // Clean the encrypted data
    let cleanedData = encryptedData;
    
    // Handle URL encoding
    try {
      let urlDecoded = cleanedData;
      let iterations = 0;
      const maxIterations = 5;
      
      while (iterations < maxIterations) {
        const temp = decodeURIComponent(urlDecoded);
        if (temp === urlDecoded) break;
        urlDecoded = temp;
        iterations++;
      }
      cleanedData = urlDecoded;
    } catch (e) {
      console.log('URL decoding not needed');
    }
    
    // Remove all non-hexadecimal characters
    const originalLength = cleanedData.length;
    cleanedData = cleanedData.replace(/[^0-9A-Fa-f]/g, '');
    
    if (cleanedData.length !== originalLength) {
      console.log(`Cleaned ${originalLength - cleanedData.length} non-hex characters`);
    }
    
    // Validate hex
    if (!cleanedData || !/^[0-9A-Fa-f]+$/.test(cleanedData)) {
      throw new Error('Invalid encrypted data: not valid hexadecimal');
    }
    
    // Ensure even length
    if (cleanedData.length % 2 !== 0) {
      console.log('Padding odd-length hex string');
      cleanedData = '0' + cleanedData;
    }
    
    // Validate AES block size
    const byteLength = cleanedData.length / 2;
    if (byteLength % 16 !== 0) {
      console.log(`Padding to AES block boundary (${byteLength} -> ${Math.ceil(byteLength/16)*16} bytes)`);
      const paddingNeeded = 16 - (byteLength % 16);
      const hexPadding = '0'.repeat(paddingNeeded * 2);
      cleanedData += hexPadding;
    }
    
    console.log('Final data length:', cleanedData.length);
    
    // Decrypt
    const password = Buffer.from(config.responseKey, 'utf8');
    const salt = Buffer.from(config.responseSalt, 'utf8');
    const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
    
    const encryptedBuffer = Buffer.from(cleanedData, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
    decipher.setAutoPadding(true);
    
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    const result = decrypted.toString('utf8');
    console.log('✅ Decryption successful');
    console.log('Result:', result.substring(0, 200) + '...');
    return result;
    
  } catch (error) {
    console.log('❌ Decryption failed:', error.message);
    throw error;
  }
}

// First, let's create a valid encrypted string to test with
function createTestEncryptedData() {
  console.log('=== CREATING TEST DATA ===');
  
  const testResponse = JSON.stringify({
    atomTokenId: 15000000953140,
    responseDetails: {
      txnStatusCode: "OTS0000",
      txnMessage: "SUCCESS",
      txnDescription: "ATOM TOKEN ID HAS BEEN GENERATED SUCCESSFULLY"
    }
  });
  
  // Encrypt using same method
  const password = Buffer.from(config.responseKey, 'utf8');
  const salt = Buffer.from(config.responseSalt, 'utf8');
  const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
  
  const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
  let encrypted = cipher.update(testResponse, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  console.log('Created test encrypted data:', encrypted.substring(0, 100) + '...');
  return encrypted;
}

// Test scenarios
async function runTests() {
  console.log('=== RUNNING DECRYPTION TESTS ===\n');
  
  // Create a valid test case first
  const validEncrypted = createTestEncryptedData();
  
  const testCases = [
    {
      name: "Valid hex string",
      data: validEncrypted
    },
    {
      name: "URL encoded hex",
      data: encodeURIComponent(validEncrypted)
    },
    {
      name: "Hex with spaces",
      data: validEncrypted.replace(/(.{8})/g, '$1 ')
    },
    {
      name: "Hex with + and / characters",
      data: validEncrypted.replace(/A/g, '+').replace(/B/g, '/')
    },
    {
      name: "Mixed case with special chars",
      data: validEncrypted.toLowerCase().replace(/c/g, '=').replace(/d/g, '_')
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    console.log(`\n--- TEST: ${testCase.name} ---`);
    try {
      const result = decryptData(testCase.data);
      const parsed = JSON.parse(result);
      if (parsed.atomTokenId && parsed.responseDetails) {
        console.log('✅ PASSED');
        passed++;
      } else {
        console.log('❌ FAILED: Invalid JSON structure');
        failed++;
      }
    } catch (error) {
      console.log('❌ FAILED:', error.message);
      failed++;
    }
  }
  
  console.log(`\n=== TEST RESULTS ===`);
  console.log(`Passed: ${passed}/${testCases.length}`);
  console.log(`Failed: ${failed}/${testCases.length}`);
  
  if (passed === testCases.length) {
    console.log('🎉 ALL TESTS PASSED! The decryption fix should work.');
  } else {
    console.log('⚠️ Some tests failed. The fix may need more work.');
  }
}

runTests().catch(console.error);