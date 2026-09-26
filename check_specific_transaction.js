/**
 * Check Specific Transaction Status
 * Queries database first, then checks with NDPS
 */

const mysql = require('mysql2/promise');
const crypto = require('crypto');

// NDPS Configuration
const config = {
  merchId: '856377',
  userId: '856377',
  password: '76ce2af2',
  product: 'AWANT',
  statusApiUrl: 'https://payment1.atomtech.in/ots/payment/status',
  requestKey: '74ABEA4102D67FD3491F23AB9D4636AB',
  responseKey: '9B130849756D796521AC4DBEC26D3B2B'
};

// AES-256-CBC Encryption
function encryptData(plainText) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(config.requestKey, 'utf8');
  const iv = Buffer.from(config.requestKey.substring(0, 16), 'utf8');
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  return encrypted;
}

// AES-256-CBC Decryption
function decryptData(encryptedText) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(config.responseKey, 'utf8');
  const iv = Buffer.from(config.responseKey.substring(0, 16), 'utf8');
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

async function checkTransaction(merchantTxnId, atomTxnId) {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'nursery_management'
  });

  try {
    console.log('=== TRANSACTION STATUS CHECK ===\n');
    console.log(`Looking for:`);
    console.log(`  Merchant Txn ID: ${merchantTxnId}`);
    console.log(`  Atom Txn ID: ${atomTxnId}\n`);

    // Query database for transaction details
    const [rows] = await pool.query(`
      SELECT 
        p.id,
        p.order_id,
        p.payment_status,
        p.amount,
        p.merchant_transaction_id,
        p.atom_transaction_id,
        p.gateway_payment_id,
        p.remarks,
        p.paid_at,
        p.created_at,
        DATE_FORMAT(p.created_at, '%Y-%m-%d') as merch_txn_date,
        o.order_number,
        o.payment_status as order_status
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE p.merchant_transaction_id = ? 
         OR p.atom_transaction_id = ?
         OR p.gateway_payment_id = ?
      LIMIT 1
    `, [merchantTxnId, atomTxnId, merchantTxnId]);

    if (rows.length === 0) {
      console.log('❌ Transaction not found in database');
      console.log('\n💡 This transaction might not exist or was never created');
      await pool.end();
      return;
    }

    const payment = rows[0];
    console.log('✅ Transaction found in database:\n');
    console.log('📋 LOCAL DATABASE RECORD:');
    console.log('─────────────────────────────────────────');
    console.log(`Payment ID: ${payment.id}`);
    console.log(`Order ID: ${payment.order_id}`);
    console.log(`Order Number: ${payment.order_number || 'N/A'}`);
    console.log(`Payment Status: ${payment.payment_status}`);
    console.log(`Order Status: ${payment.order_status}`);
    console.log(`Amount: ₹${payment.amount}`);
    console.log(`Merchant Txn ID: ${payment.merchant_transaction_id || payment.gateway_payment_id || 'NOT SET'}`);
    console.log(`Atom Txn ID: ${payment.atom_transaction_id || 'NOT SET'}`);
    console.log(`Created At: ${payment.created_at}`);
    console.log(`Paid At: ${payment.paid_at || 'NOT PAID'}`);
    console.log(`Remarks: ${payment.remarks || 'NONE'}`);
    console.log('─────────────────────────────────────────\n');

    // Now check with NDPS
    const merchTxnIdToUse = payment.merchant_transaction_id || payment.gateway_payment_id;
    const atomTxnIdToUse = payment.atom_transaction_id || atomTxnId;
    const amount = payment.amount;
    const merchTxnDate = payment.merch_txn_date;

    if (!merchTxnIdToUse) {
      console.log('❌ No merchant transaction ID found - cannot check with NDPS');
      await pool.end();
      return;
    }

    console.log('🔄 Now checking with NDPS gateway...\n');

    // Generate signature
    const requestHashKey = '27786aad29c63b6a3a';
    const signatureData = [
      { merchId: config.merchId },
      { merchTxnId: merchTxnIdToUse },
      ...(atomTxnIdToUse ? [{ atomTxnId: atomTxnIdToUse }] : []),
      { amount: parseFloat(amount) }
    ];
    
    const signatureString = JSON.stringify(signatureData);
    const signature = crypto.createHmac('sha512', requestHashKey)
      .update(signatureString)
      .digest('hex');

    // Create status check request
    const statusRequest = {
      payInstrument: {
        headDetails: {
          api: 'TXNVERIFICATION',
          source: 'OTS'
        },
        merchDetails: {
          merchId: config.merchId,
          password: config.password,
          merchTxnId: merchTxnIdToUse,
          merchTxnDate: merchTxnDate
        },
        payDetails: {
          ...(atomTxnIdToUse && { atomTxnId: atomTxnIdToUse }),
          amount: parseFloat(amount),
          txnCurrency: 'INR',
          signature: signature
        }
      }
    };

    const requestJson = JSON.stringify(statusRequest);
    const encryptedRequest = encryptData(requestJson);

    // Make API call
    const formBody = `encData=${encodeURIComponent(encryptedRequest)}&merchId=${config.merchId}`;
    
    const response = await fetch(config.statusApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody
    });

    console.log(`NDPS Response Status: ${response.status} ${response.statusText}\n`);

    const responseText = await response.text();

    if (!response.ok) {
      console.error('❌ NDPS API Error:', responseText);
      await pool.end();
      return;
    }

    // Extract and decrypt response
    let encryptedResponse;
    if (responseText.includes('encData=')) {
      const parts = responseText.split('&');
      for (const part of parts) {
        if (part.startsWith('encData=')) {
          encryptedResponse = decodeURIComponent(part.substring(8));
          break;
        }
      }
    } else {
      encryptedResponse = responseText.trim();
    }

    if (!encryptedResponse) {
      console.error('❌ No encrypted data in NDPS response');
      await pool.end();
      return;
    }

    const decryptedResponse = decryptData(encryptedResponse);
    const statusData = JSON.parse(decryptedResponse);

    // Handle response format
    let transaction;
    if (statusData.payInstrument) {
      if (Array.isArray(statusData.payInstrument)) {
        transaction = statusData.payInstrument[0];
      } else {
        transaction = statusData.payInstrument;
      }
    }

    if (!transaction) {
      console.log('❌ No transaction data in NDPS response');
      console.log('Full response:', JSON.stringify(statusData, null, 2));
      await pool.end();
      return;
    }

    // Display NDPS results
    console.log('📊 NDPS GATEWAY RECORD:');
    console.log('─────────────────────────────────────────');
    
    if (transaction.merchDetails) {
      console.log(`Merchant Txn ID: ${transaction.merchDetails.merchTxnId || 'N/A'}`);
    }

    if (transaction.payDetails) {
      console.log(`Amount: ₹${transaction.payDetails.totalAmount || transaction.payDetails.amount || 'N/A'}`);
      console.log(`Atom Txn ID: ${transaction.payDetails.atomTxnId || 'N/A'}`);
    }

    if (transaction.responseDetails) {
      const statusCode = transaction.responseDetails.statusCode || transaction.responseDetails.txnStatusCode;
      const message = transaction.responseDetails.message || transaction.responseDetails.txnMessage;
      
      console.log(`Status Code: ${statusCode || 'N/A'}`);
      console.log(`Message: ${message || 'N/A'}`);
      
      if (statusCode === 'OTS0000') {
        console.log(`Result: ✅ SUCCESS`);
      } else if (statusCode === 'OTS0001') {
        console.log(`Result: ⏳ PENDING`);
      } else {
        console.log(`Result: ❌ FAILED`);
      }
    }

    console.log('─────────────────────────────────────────\n');

    // Compare database vs NDPS
    const ndpsStatusCode = transaction.responseDetails?.statusCode || transaction.responseDetails?.txnStatusCode;
    const dbStatus = payment.payment_status;

    console.log('🔍 COMPARISON:');
    console.log('─────────────────────────────────────────');
    console.log(`Database Status: ${dbStatus.toUpperCase()}`);
    
    let ndpsStatus = 'UNKNOWN';
    if (ndpsStatusCode === 'OTS0000') ndpsStatus = 'PAID';
    else if (ndpsStatusCode === 'OTS0001') ndpsStatus = 'PENDING';
    else if (ndpsStatusCode) ndpsStatus = 'FAILED';
    
    console.log(`NDPS Status: ${ndpsStatus}`);
    
    if (dbStatus === 'paid' && ndpsStatusCode === 'OTS0000') {
      console.log(`\n✅ MATCH: Both database and NDPS show payment as SUCCESSFUL`);
    } else if (dbStatus === 'failed' && ndpsStatusCode !== 'OTS0000') {
      console.log(`\n✅ MATCH: Both database and NDPS show payment as FAILED`);
    } else if (dbStatus === 'pending') {
      console.log(`\n⚠️  Database shows PENDING - should be updated based on NDPS response`);
      if (ndpsStatusCode === 'OTS0000') {
        console.log(`\n💡 ACTION NEEDED: Update database to PAID`);
      } else if (ndpsStatusCode && ndpsStatusCode !== 'OTS0001') {
        console.log(`\n💡 ACTION NEEDED: Update database to FAILED`);
      }
    } else {
      console.log(`\n⚠️  MISMATCH: Database and NDPS statuses differ`);
      console.log(`\n💡 NDPS is the source of truth - database should match NDPS status`);
    }

    console.log('─────────────────────────────────────────\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Get transaction IDs from command line
const arg1 = process.argv[2];
const arg2 = process.argv[3];

if (!arg1) {
  console.error('❌ Missing transaction ID');
  console.error('\nUsage: node check_specific_transaction.js <merchantTxnId> [atomTxnId]');
  console.error('\nExamples:');
  console.error('  node check_specific_transaction.js NURSERY_1_muf5omz1');
  console.error('  node check_specific_transaction.js NURSERY_1_muf5omz1 11000384309894');
  console.error('  node check_specific_transaction.js 11000384309894 (can lookup by atom ID too)');
  process.exit(1);
}

checkTransaction(arg1, arg2 || null);
