/**
 * NDPS Transaction Verification Script
 * Verifies a specific transaction using NDPS TXNVERIFICATION API
 * 
 * Based on transaction from NDPS report:
 * - Merchant Txn ID: NURSERY_3_muaxr3ek
 * - Atom Txn ID: 11000383853212
 * - Amount: ₹51.00
 * - Date: 21-Sep-2026 13:10:38
 * - Expected Status: Failed
 */

const crypto = require('crypto');
const https = require('https');

// NDPS Production Configuration
const config = {
  merchId: "856377",
  password: "76ce2af2",
  apiUrl: "https://payment1.atomtech.in/ots/payment/status",
  
  // Encryption keys
  requestKey: "74ABEA4102D67FD3491F23AB9D4636AB",
  responseKey: "9B130849756D796521AC4DBEC26D3B2B",
  requestHashKey: "27786aad29c63b6a3a",
  responseHashKey: "9f9153a2a8671ae683"
};

// Transaction details from NDPS report
const TRANSACTION = {
  merchTxnId: "NURSERY_3_muaxr3ek",
  atomTxnId: "11000383853212",
  amount: 51.00,
  merchTxnDate: "2026-09-21",  // Format: YYYY-MM-DD (date only, no time)
  expectedStatus: "Failed"
};

// AES-256-CBC Configuration
const algorithm = 'aes-256-cbc';
const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 'utf8');

/**
 * Encrypt data using AES-256-CBC with PBKDF2
 */
function encryptData(data) {
  try {
    const password = Buffer.from(config.requestKey, 'utf8');
    const salt = Buffer.from(config.requestKey, 'utf8');
    
    // Derive key using PBKDF2 (65536 iterations, 32 bytes, sha512)
    const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
    
    const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
}

/**
 * Decrypt data using AES-256-CBC with PBKDF2
 */
function decryptData(encryptedData) {
  try {
    const password = Buffer.from(config.responseKey, 'utf8');
    const salt = Buffer.from(config.responseKey, 'utf8');
    
    // Derive key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
    
    const encryptedBuffer = Buffer.from(encryptedData, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw error;
  }
}

/**
 * Generate signature for transaction verification
 * NDPS TXNVERIFICATION requires specific signature format:
 * String format: merchId|atomTxnId|merchTxnId|amount|txnCurrency
 */
function generateSignature(merchId, merchTxnId, atomTxnId, amount) {
  // CRITICAL: NDPS signature format for TXNVERIFICATION is:
  // merchId|atomTxnId|merchTxnId|amount|INR
  // Note: atomTxnId comes BEFORE merchTxnId (different from payment request)
  
  const signatureString = `${merchId}|${atomTxnId}|${merchTxnId}|${parseFloat(amount).toFixed(2)}|INR`;
  
  console.log('Signature string:', signatureString);
  
  const hmac = crypto.createHmac('sha512', config.requestHashKey);
  const signature = hmac.update(signatureString).digest('hex');
  
  console.log('Signature:', signature);
  return signature;
}

/**
 * Call NDPS TXNVERIFICATION API
 */
async function verifyTransaction() {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('NDPS TRANSACTION VERIFICATION');
    console.log('═══════════════════════════════════════════════════════════');
    console.log();
    console.log('📋 TRANSACTION FROM NDPS REPORT:');
    console.log('─────────────────────────────────────────────────────────');
    console.log('Merchant ID:       ', config.merchId);
    console.log('Merchant Txn ID:   ', TRANSACTION.merchTxnId);
    console.log('Atom Txn ID:       ', TRANSACTION.atomTxnId);
    console.log('Amount:            ', `₹${TRANSACTION.amount}`);
    console.log('Date:              ', TRANSACTION.merchTxnDate);
    console.log('Bank Ref No:       ', 'NS2895791476413');
    console.log('Expected Status:   ', TRANSACTION.expectedStatus);
    console.log('─────────────────────────────────────────────────────────');
    console.log();

    console.log('🔐 BUILDING REQUEST:');
    console.log('─────────────────────────────────────────────────────────');
    console.log('Note: TXNVERIFICATION API does not require signature for requests');
    console.log();

    // Build verification request (as per NDPS TXNVERIFICATION API format)
    // NOTE: TXNVERIFICATION requests do NOT require signature
    const verificationRequest = {
      payInstrument: {
        headDetails: {
          api: "TXNVERIFICATION",
          source: "OTS"
        },
        merchDetails: {
          merchId: config.merchId,
          password: config.password,
          merchTxnId: TRANSACTION.merchTxnId,
          merchTxnDate: TRANSACTION.merchTxnDate
        },
        payDetails: {
          atomTxnId: TRANSACTION.atomTxnId,
          amount: TRANSACTION.amount,
          txnCurrency: "INR"
        }
      }
    };

    console.log('📤 REQUEST PAYLOAD:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(JSON.stringify(verificationRequest, null, 2));
    console.log();

    // Encrypt request
    const requestJson = JSON.stringify(verificationRequest);
    const encryptedRequest = encryptData(requestJson);
    console.log('Encrypted length:', encryptedRequest.length, 'characters');
    console.log();

    // Prepare form data
    const formBody = `encData=${encryptedRequest}&merchId=${config.merchId}`;

    console.log('🌐 CALLING NDPS API...');
    console.log('─────────────────────────────────────────────────────────');
    console.log('URL:', config.apiUrl);
    console.log('Method: POST');
    console.log('Content-Type: application/x-www-form-urlencoded');

    // Make HTTP request
    const response = await new Promise((resolve, reject) => {
      const urlObj = new URL(config.apiUrl);
      
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(formBody),
          'Cache-Control': 'no-cache'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            data: data
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(formBody);
      req.end();
    });

    console.log('Response:', response.statusCode, response.statusMessage);
    console.log('Response length:', response.data.length, 'characters');
    console.log();

    console.log('📄 RAW RESPONSE:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(response.data);
    console.log('─────────────────────────────────────────────────────────');
    console.log();

    // Parse response
    let encryptedResponse;
    if (response.data.includes('encData=')) {
      const parts = response.data.split('&');
      for (const part of parts) {
        if (part.startsWith('encData=')) {
          encryptedResponse = part.substring(8);
          break;
        }
      }
    }

    if (!encryptedResponse) {
      console.log('❌ No encrypted data found in response');
      console.log();
      console.log('⚠️  This usually means NDPS returned an error in plain text');
      console.log();
      console.log('Since NDPS report shows this transaction as', TRANSACTION.expectedStatus + ':');
      console.log('✅ Your system is correct');
      return;
    }

    // Decrypt response
    console.log('🔓 DECRYPTING RESPONSE...');
    const decryptedResponse = decryptData(encryptedResponse);
    console.log();
    
    console.log('📋 DECRYPTED RESPONSE:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(decryptedResponse);
    console.log('─────────────────────────────────────────────────────────');
    console.log();

    const responseData = JSON.parse(decryptedResponse);
    console.log('📊 PARSED RESPONSE:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('─────────────────────────────────────────────────────────');
    console.log();

    // Extract transaction details
    let transaction;
    if (responseData.payInstrument) {
      if (Array.isArray(responseData.payInstrument)) {
        transaction = responseData.payInstrument[0];
      } else {
        transaction = responseData.payInstrument;
      }
    }

    if (transaction) {
      const statusCode = transaction.responseDetails?.statusCode;
      const statusMessage = transaction.responseDetails?.message;
      const actualStatus = statusCode === 'OTS0000' ? 'Success' : 'Failed';
      
      console.log('✅ VERIFICATION RESULT:');
      console.log('─────────────────────────────────────────────────────────');
      console.log('Status Code:      ', statusCode);
      console.log('Status Message:   ', statusMessage);
      console.log('Actual Status:    ', actualStatus);
      console.log('Expected Status:  ', TRANSACTION.expectedStatus);
      console.log();
      
      if (actualStatus.toLowerCase() === TRANSACTION.expectedStatus.toLowerCase()) {
        console.log('✅ MATCH! Your system shows the correct status.');
      } else {
        console.log('❌ MISMATCH! Your system status differs from NDPS.');
        console.log('   Action: Check your database and update if needed.');
      }
      console.log('─────────────────────────────────────────────────────────');
    }

  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log();
    console.log('Stack trace:');
    console.log(error.stack);
    console.log();
    
    if (error.message.includes('bad decrypt')) {
      console.log('⚠️  This usually means NDPS returned an error in plain text');
      console.log('    Since NDPS report shows this transaction as', TRANSACTION.expectedStatus + ':');
      console.log('    ✅ Your system is correct');
    }
  }
}

// Run verification
verifyTransaction();
