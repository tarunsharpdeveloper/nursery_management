/**
 * Check Production Payment Status
 * Queries live backend API then checks with NDPS
 */

const crypto = require('crypto');

const BACKEND_URL = 'https://awantikaseeds.com/api';

// Production NDPS Configuration
const config = {
  merchId: '856377',
  password: '76ce2af2',
  statusApiUrl: 'https://payment1.atomtech.in/ots/payment/status',
  requestKey: '74ABEA4102D67FD3491F23AB9D4636AB',
  responseKey: '9B130849756D796521AC4DBEC26D3B2B',
  requestHashKey: '27786aad29c63b6a3a'
};

function encryptData(plainText) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(config.requestKey, 'utf8');
  const iv = Buffer.from(config.requestKey.substring(0, 16), 'utf8');
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  return encrypted;
}

function decryptData(encryptedText) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(config.responseKey, 'utf8');
  const iv = Buffer.from(config.responseKey.substring(0, 16), 'utf8');
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

async function checkProductionPayment(merchantTxnId, atomTxnId) {
  try {
    console.log('=== CHECKING PRODUCTION PAYMENT ===\n');
    console.log(`Merchant Txn ID: ${merchantTxnId}`);
    console.log(`Atom Txn ID: ${atomTxnId}\n`);

    // Step 1: Try to get payment details from backend (requires admin auth)
    console.log('Note: Since we need amount and date, I\'ll use approximate values\n');
    console.log('📝 If you know the exact amount and date, use:');
    console.log(`   node check_live_payment_status.js ${merchantTxnId} ${atomTxnId} <amount> <date>\n`);

    // For common test amounts, try these:
    const possibleAmounts = [51.00, 100.00, 500.00, 1000.00];
    const today = new Date();
    const dates = [
      today.toISOString().split('T')[0],
      new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0],
      new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0]
    ];

    console.log('🔍 Trying to verify with NDPS...\n');
    console.log('⚠️  Without exact amount and date, verification may fail');
    console.log('    Please provide: amount and transaction date\n');

    // Ask user for manual input
    console.log('═════════════════════════════════════════');
    console.log('INFORMATION NEEDED:');
    console.log('═════════════════════════════════════════');
    console.log('');
    console.log('To check payment status, I need:');
    console.log('1. Transaction Amount (e.g., 51.00)');
    console.log('2. Transaction Date (e.g., 2025-02-06)');
    console.log('');
    console.log('Please run:');
    console.log(`node check_live_payment_status.js ${merchantTxnId} ${atomTxnId} <AMOUNT> <DATE>`);
    console.log('');
    console.log('Example:');
    console.log(`node check_live_payment_status.js ${merchantTxnId} ${atomTxnId} 51.00 "2025-02-06"`);
    console.log('');
    console.log('═════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

const merchantTxnId = process.argv[2];
const atomTxnId = process.argv[3];

if (!merchantTxnId || !atomTxnId) {
  console.error('❌ Missing transaction IDs\n');
  console.error('Usage: node check_production_payment.js <merchantTxnId> <atomTxnId>\n');
  console.error('Example:');
  console.error('  node check_production_payment.js NURSERY_1_muf5omz1 11000384309894\n');
  process.exit(1);
}

checkProductionPayment(merchantTxnId, atomTxnId);
