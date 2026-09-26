/**
 * Check Live Payment Status with NDPS
 * Direct API call to verify payment status on production
 */

const crypto = require('crypto');

// Production NDPS Configuration
const config = {
  merchId: '856377',
  userId: '856377',
  password: '76ce2af2',
  product: 'AWANT',
  statusApiUrl: 'https://payment1.atomtech.in/ots/payment/status',
  requestKey: '74ABEA4102D67FD3491F23AB9D4636AB',
  responseKey: '9B130849756D796521AC4DBEC26D3B2B',
  requestHashKey: '27786aad29c63b6a3a'
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

async function checkLivePaymentStatus(merchantTxnId, atomTxnId, amount, date) {
  try {
    console.log('=== CHECKING LIVE PAYMENT STATUS WITH NDPS ===\n');
    console.log(`Merchant Transaction ID: ${merchantTxnId}`);
    console.log(`Atom Transaction ID: ${atomTxnId}`);
    console.log(`Amount: ₹${amount}`);
    console.log(`Transaction Date: ${date}`);
    console.log(`Status API URL: ${config.statusApiUrl}\n`);

    // Generate signature (HMAC-SHA512)
    const signatureData = [
      { merchId: config.merchId },
      { merchTxnId: merchantTxnId },
      { atomTxnId: atomTxnId },
      { amount: parseFloat(amount) }
    ];
    
    const signatureString = JSON.stringify(signatureData);
    const signature = crypto.createHmac('sha512', config.requestHashKey)
      .update(signatureString)
      .digest('hex');

    console.log('📝 Request Details:');
    console.log(`Signature Data: ${signatureString}`);
    console.log(`Signature: ${signature}\n`);

    // Create TXNVERIFICATION request per NDPS specification
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
          merchTxnDate: date
        },
        payDetails: {
          atomTxnId: atomTxnId,
          amount: parseFloat(amount),
          txnCurrency: 'INR',
          signature: signature
        }
      }
    };

    const requestJson = JSON.stringify(statusRequest);
    console.log('📤 Request Payload:');
    console.log(JSON.stringify(statusRequest, null, 2));
    console.log('');

    // Encrypt the request
    const encryptedRequest = encryptData(requestJson);
    console.log(`🔒 Encrypted request length: ${encryptedRequest.length} characters`);
    console.log('');

    // Make API call to NDPS
    console.log('🌐 Sending request to NDPS gateway...\n');
    const formBody = `encData=${encodeURIComponent(encryptedRequest)}&merchId=${config.merchId}`;
    
    const response = await fetch(config.statusApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody
    });

    console.log(`📥 Response Status: ${response.status} ${response.statusText}\n`);

    const responseText = await response.text();
    console.log(`Response Length: ${responseText.length} characters\n`);

    if (!response.ok) {
      console.error('❌ NDPS API Error:');
      console.error(responseText);
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
      console.error('❌ No encrypted data in NDPS response');
      return;
    }

    // Decrypt response
    console.log('🔓 Decrypting NDPS response...\n');
    const decryptedResponse = decryptData(encryptedResponse);
    
    console.log('📋 DECRYPTED RESPONSE:');
    console.log('─────────────────────────────────────────');
    console.log(decryptedResponse);
    console.log('─────────────────────────────────────────\n');

    // Parse and display nicely
    const statusData = JSON.parse(decryptedResponse);

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

    // Display transaction details in organized format
    console.log('📊 TRANSACTION STATUS FROM NDPS:');
    console.log('═════════════════════════════════════════\n');
    
    if (transaction.merchDetails) {
      console.log('🏪 MERCHANT DETAILS:');
      console.log(`   Merchant ID: ${transaction.merchDetails.merchId || 'N/A'}`);
      console.log(`   Merchant Txn ID: ${transaction.merchDetails.merchTxnId || 'N/A'}`);
      console.log(`   Merchant Txn Date: ${transaction.merchDetails.merchTxnDate || 'N/A'}`);
      console.log('');
    }

    if (transaction.payDetails) {
      console.log('💰 PAYMENT DETAILS:');
      console.log(`   Amount: ₹${transaction.payDetails.totalAmount || transaction.payDetails.amount || 'N/A'}`);
      console.log(`   Currency: ${transaction.payDetails.txnCurrency || 'INR'}`);
      console.log(`   Atom Txn ID: ${transaction.payDetails.atomTxnId || 'N/A'}`);
      console.log(`   Product: ${transaction.payDetails.product || 'N/A'}`);
      console.log('');
    }

    if (transaction.responseDetails) {
      console.log('📈 STATUS DETAILS:');
      const statusCode = transaction.responseDetails.statusCode || transaction.responseDetails.txnStatusCode;
      const message = transaction.responseDetails.message || transaction.responseDetails.txnMessage;
      
      console.log(`   Status Code: ${statusCode || 'N/A'}`);
      console.log(`   Message: ${message || 'N/A'}`);
      console.log('');
      
      // Determine success/failure with visual indicator
      if (statusCode === 'OTS0000') {
        console.log('   ✅ PAYMENT SUCCESSFUL');
        console.log('   └─ Transaction was completed successfully');
      } else if (statusCode === 'OTS0001') {
        console.log('   ⏳ PAYMENT PENDING');
        console.log('   └─ Transaction is still being processed');
      } else if (statusCode) {
        console.log('   ❌ PAYMENT FAILED');
        console.log(`   └─ Reason: ${message || 'Unknown error'}`);
      } else {
        console.log('   ⚠️  STATUS UNKNOWN');
      }
      console.log('');
    }

    if (transaction.custDetails) {
      console.log('👤 CUSTOMER DETAILS:');
      console.log(`   Email: ${transaction.custDetails.custEmail || 'N/A'}`);
      console.log(`   Mobile: ${transaction.custDetails.custMobile || 'N/A'}`);
      console.log('');
    }

    if (transaction.payModeSpecificData?.bankDetails) {
      console.log('🏦 BANK DETAILS:');
      console.log(`   Bank Txn ID: ${transaction.payModeSpecificData.bankDetails.bankTxnId || 'N/A'}`);
      console.log(`   Bank Name: ${transaction.payModeSpecificData.bankDetails.bankName || 'N/A'}`);
      console.log('');
    }

    console.log('═════════════════════════════════════════\n');
    
    // Provide recommendations
    const statusCode = transaction.responseDetails?.statusCode || transaction.responseDetails?.txnStatusCode;
    
    console.log('💡 RECOMMENDATIONS:\n');
    
    if (statusCode === 'OTS0000') {
      console.log('✅ Payment was SUCCESSFUL according to NDPS gateway');
      console.log('');
      console.log('   Action Items:');
      console.log('   1. Update database payment_status to "paid"');
      console.log('   2. Update order status to "paid"');
      console.log('   3. Mark order as ready for dispatch');
      console.log('   4. Send payment confirmation email to customer');
      console.log('');
    } else if (statusCode === 'OTS0001') {
      console.log('⏳ Payment is PENDING - still being processed by bank');
      console.log('');
      console.log('   Action Items:');
      console.log('   1. Keep payment_status as "pending" in database');
      console.log('   2. DO NOT dispatch the order yet');
      console.log('   3. Wait for final callback from NDPS');
      console.log('   4. Recheck status after 30 minutes');
      console.log('');
    } else if (statusCode) {
      console.log('❌ Payment FAILED');
      console.log('');
      console.log('   Action Items:');
      console.log('   1. Update database payment_status to "failed"');
      console.log('   2. Update order status to "failed"');
      console.log('   3. If money was deducted, it will be auto-refunded by bank in 5-7 days');
      console.log('   4. Customer can retry payment or contact support');
      console.log('');
    } else {
      console.log('⚠️  Unable to determine payment status');
      console.log('');
      console.log('   Action Items:');
      console.log('   1. Verify transaction IDs are correct');
      console.log('   2. Check if transaction exists in NDPS system');
      console.log('   3. Contact NDPS support if issue persists');
      console.log('');
    }

    console.log('═════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERROR OCCURRED:');
    console.error(`Message: ${error.message}`);
    console.error('\nStack Trace:');
    console.error(error.stack);
  }
}

// Get parameters from command line
const merchantTxnId = process.argv[2];
const atomTxnId = process.argv[3];
const amount = process.argv[4];
const date = process.argv[5];

if (!merchantTxnId || !atomTxnId || !amount || !date) {
  console.error('❌ Missing required parameters\n');
  console.error('Usage: node check_live_payment_status.js <merchantTxnId> <atomTxnId> <amount> <date>\n');
  console.error('Examples:');
  console.error('  node check_live_payment_status.js NURSERY_1_muf5omz1 11000384309894 51.00 "2025-02-06"');
  console.error('  node check_live_payment_status.js NURSERY_1_muf5omz1 11000384309894 51.00 "2025-02-06 10:30:00"\n');
  console.error('Parameters:');
  console.error('  merchantTxnId - Your merchant transaction ID (e.g., NURSERY_1_muf5omz1)');
  console.error('  atomTxnId     - Atom gateway transaction ID (e.g., 11000384309894)');
  console.error('  amount        - Transaction amount (e.g., 51.00)');
  console.error('  date          - Transaction date in format YYYY-MM-DD or "YYYY-MM-DD HH:MM:SS"\n');
  process.exit(1);
}

checkLivePaymentStatus(merchantTxnId, atomTxnId, amount, date);
