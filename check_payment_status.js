/**
 * Check NDPS Payment Status
 * 
 * This script queries NDPS to check the actual status of a transaction
 * 
 * Usage: node check_payment_status.js <merchantTxnId>
 * Example: node check_payment_status.js NURSERY_123_abc123
 */

const crypto = require('crypto');

// NDPS Configuration (update these with your production credentials)
const config = {
  merchId: '856377',
  userId: '856377',
  password: '76ce2af2',
  product: 'AWANT',
  statusApiUrl: 'https://payment1.atomtech.in/ots/payment/status',
  requestKey: '74ABEA4102D67FD3491F23AB9D4636AB', // AES Request Salt/IV
  responseKey: '9B130849756D796521AC4DBEC26D3B2B' // AES Response Salt/IV
};

// AES-256-CBC Encryption (same as in backend)
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

async function checkPaymentStatus(merchantTxnId, atomTxnId, amount, merchTxnDate) {
  try {
    console.log('=== CHECKING NDPS PAYMENT STATUS ===\n');
    console.log(`Merchant Transaction ID: ${merchantTxnId}`);
    console.log(`Atom Transaction ID: ${atomTxnId || 'Not provided'}`);
    console.log(`Status API URL: ${config.statusApiUrl}\n`);

    // Generate signature (HMAC-SHA512)
    const requestHashKey = '27786aad29c63b6a3a'; // Your hash key for requests
    const signatureData = [
      { merchId: config.merchId },
      { merchTxnId: merchantTxnId },
      ...(atomTxnId ? [{ atomTxnId: atomTxnId }] : []),
      { amount: amount }
    ];
    
    const signatureString = JSON.stringify(signatureData);
    const signature = crypto.createHmac('sha512', requestHashKey)
      .update(signatureString)
      .digest('hex');

    console.log('Signature data:', signatureString);
    console.log('Signature:', signature);
    console.log('');

    // Create status check request (TXNVERIFICATION format per NDPS specification)
    const statusRequest = {
      payInstrument: {
        headDetails: {
          api: 'TXNVERIFICATION',
          source: 'OTS'
        },
        merchDetails: {
          merchId: config.merchId,
          password: config.password,
          merchTxnId: merchantTxnId,
          merchTxnDate: merchTxnDate
        },
        payDetails: {
          ...(atomTxnId && { atomTxnId: atomTxnId }),
          amount: parseFloat(amount),
          txnCurrency: 'INR',
          signature: signature
        }
      }
    };

    const requestJson = JSON.stringify(statusRequest);
    console.log('Request JSON:');
    console.log(JSON.stringify(statusRequest, null, 2));
    console.log('');

    // Encrypt the request
    const encryptedRequest = encryptData(requestJson);
    console.log(`Encrypted request length: ${encryptedRequest.length} characters`);
    console.log('');

    // Make API call
    console.log('Sending request to NDPS...\n');
    const formBody = `encData=${encodeURIComponent(encryptedRequest)}&merchId=${config.merchId}`;
    
    const response = await fetch(config.statusApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody
    });

    console.log(`Response Status: ${response.status} ${response.statusText}\n`);

    const responseText = await response.text();
    console.log(`Response Length: ${responseText.length} characters`);
    console.log('');

    if (!response.ok) {
      console.error('❌ API Error:', responseText);
      return;
    }

    // Extract encrypted response
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
      console.error('❌ No encrypted data in response');
      return;
    }

    // Decrypt response
    console.log('Decrypting response...\n');
    const decryptedResponse = decryptData(encryptedResponse);
    console.log('=== DECRYPTED RESPONSE ===');
    console.log(decryptedResponse);
    console.log('');

    // Parse and display nicely
    const statusData = JSON.parse(decryptedResponse);
    console.log('=== PARSED STATUS DATA ===\n');

    // Handle both array and object formats
    let transaction;
    if (statusData.payInstrument) {
      if (Array.isArray(statusData.payInstrument)) {
        transaction = statusData.payInstrument[0];
      } else {
        transaction = statusData.payInstrument;
      }
    }

    if (!transaction) {
      console.log('❌ No transaction data found in response');
      console.log('Full response:', JSON.stringify(statusData, null, 2));
      return;
    }

    // Display transaction details
    console.log('📋 TRANSACTION DETAILS:');
    console.log('─────────────────────────────────────────');
    
    if (transaction.merchDetails) {
      console.log(`\n🏪 Merchant Details:`);
      console.log(`  Merchant ID: ${transaction.merchDetails.merchId || 'N/A'}`);
      console.log(`  Merchant Txn ID: ${transaction.merchDetails.merchTxnId || 'N/A'}`);
      console.log(`  Merchant Txn Date: ${transaction.merchDetails.merchTxnDate || 'N/A'}`);
    }

    if (transaction.payDetails) {
      console.log(`\n💰 Payment Details:`);
      console.log(`  Amount: ₹${transaction.payDetails.totalAmount || transaction.payDetails.amount || 'N/A'}`);
      console.log(`  Currency: ${transaction.payDetails.txnCurrency || 'N/A'}`);
      console.log(`  Atom Txn ID: ${transaction.payDetails.atomTxnId || 'N/A'}`);
      console.log(`  Product: ${transaction.payDetails.product || 'N/A'}`);
    }

    if (transaction.responseDetails) {
      console.log(`\n📊 Response Details:`);
      const statusCode = transaction.responseDetails.statusCode || transaction.responseDetails.txnStatusCode;
      const message = transaction.responseDetails.message || transaction.responseDetails.txnMessage;
      
      console.log(`  Status Code: ${statusCode || 'N/A'}`);
      console.log(`  Message: ${message || 'N/A'}`);
      
      // Determine success/failure
      if (statusCode === 'OTS0000') {
        console.log(`  Result: ✅ SUCCESS`);
      } else {
        console.log(`  Result: ❌ FAILED/PENDING`);
      }
    }

    if (transaction.custDetails) {
      console.log(`\n👤 Customer Details:`);
      console.log(`  Email: ${transaction.custDetails.custEmail || 'N/A'}`);
      console.log(`  Mobile: ${transaction.custDetails.custMobile || 'N/A'}`);
    }

    if (transaction.payModeSpecificData?.bankDetails) {
      console.log(`\n🏦 Bank Details:`);
      console.log(`  Bank Txn ID: ${transaction.payModeSpecificData.bankDetails.bankTxnId || 'N/A'}`);
      console.log(`  Bank Name: ${transaction.payModeSpecificData.bankDetails.bankName || 'N/A'}`);
    }

    console.log('\n─────────────────────────────────────────');
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:\n');
    const statusCode = transaction.responseDetails?.statusCode || transaction.responseDetails?.txnStatusCode;
    
    if (statusCode === 'OTS0000') {
      console.log('✅ Payment was SUCCESSFUL according to NDPS');
      console.log('   → Update your database to mark this payment as PAID');
      console.log('   → Update order status to PAID');
      console.log('   → Send confirmation email to customer');
    } else if (!statusCode || statusCode === 'OTS0001') {
      console.log('⏳ Payment is PENDING');
      console.log('   → Wait for final callback from NDPS');
      console.log('   → Do NOT ship order yet');
    } else {
      console.log('❌ Payment FAILED');
      console.log('   → If money was deducted, it should be auto-refunded by bank');
      console.log('   → Customer should contact their bank if refund not received in 5-7 days');
      console.log('   → Mark order as FAILED in your system');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Get merchant transaction ID from command line
const merchantTxnId = process.argv[2];
const atomTxnId = process.argv[3] || null; // Optional
const amount = process.argv[4];
const merchTxnDate = process.argv[5];

if (!merchantTxnId || !amount || !merchTxnDate) {
  console.error('❌ Missing required parameters');
  console.error('\nUsage: node check_payment_status.js <merchantTxnId> [atomTxnId] <amount> <merchTxnDate>');
  console.error('\nExamples:');
  console.error('  node check_payment_status.js NURSERY_123_abc123 null 51.00 "2025-02-06"');
  console.error('  node check_payment_status.js NURSERY_123_abc123 11000000631738 51.00 "2025-02-06 10:30:00"');
  console.error('\nNote: Use "null" for atomTxnId if you don\'t have it yet');
  process.exit(1);
}

checkPaymentStatus(merchantTxnId, atomTxnId === 'null' ? null : atomTxnId, amount, merchTxnDate);
