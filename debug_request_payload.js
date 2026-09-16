#!/usr/bin/env node
/**
 * Debug script to show exact request being sent to NTT Data
 * This helps identify what NTT Data is rejecting
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load .env
function loadEnv() {
  const envPath = path.join(__dirname, 'backend', '.env');
  const envRootPath = path.join(__dirname, '.env');
  const fileToRead = fs.existsSync(envPath) ? envPath : (fs.existsSync(envRootPath) ? envRootPath : null);
  
  if (fileToRead) {
    const content = fs.readFileSync(fileToRead, 'utf8');
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        const value = values.join('=').replace(/^['"]|['"]$/g, '');
        if (key) process.env[key.trim()] = value;
      }
    });
  }
}

loadEnv();

const config = {
  merchId: process.env.NDPS_MERCH_ID || '856377',
  userId: process.env.NDPS_USER_ID || '856377',
  password: process.env.NDPS_PASSWORD || '856377_titan@123',
  product: process.env.NDPS_PRODUCT_ID || 'AWANT',
  requestKey: process.env.NDPS_REQUEST_KEY || '74ABEA4102D67FD3491F23AB9D4636AB'
};

const algorithm = 'aes-256-cbc';
const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 'utf8');

function encryptData(data) {
  const password = Buffer.from(config.requestKey, 'utf8');
  const salt = Buffer.from(config.requestKey, 'utf8');
  const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
  
  const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return encrypted;
}

console.log('🔍 DEBUG: REQUEST PAYLOAD ANALYSIS\n');
console.log('='.repeat(70));

// Create exact payload
const merchTxnId = `NURSERY_999_${Date.now().toString(36)}`;
const merchTxnDate = new Date().toISOString().replace('T', ' ').substring(0, 19);

const payload = {
  payInstrument: {
    headDetails: {
      version: "OTSv1.1",
      api: "AUTH",
      platform: "FLASH"
    },
    merchDetails: {
      merchId: config.merchId,
      userId: config.userId,
      password: config.password,
      merchTxnId: merchTxnId,
      merchTxnDate: merchTxnDate
    },
    payDetails: {
      amount: "100.00",
      product: config.product,
      custAccNo: "999",
      txnCurrency: "INR"
    },
    custDetails: {
      custEmail: "test@example.com",
      custMobile: "9999999999"
    },
    extras: {
      udf1: "order_999",
      udf2: "nursery_payment",
      udf3: "https://awantikaseeds.com/payment/return",
      udf4: "",
      udf5: ""
    }
  }
};

console.log('\n📋 REQUEST PAYLOAD (Pretty printed):\n');
console.log(JSON.stringify(payload, null, 2));

console.log('\n' + '='.repeat(70));
console.log('\n✅ PAYLOAD VERIFICATION:\n');

console.log('Merchant Details:');
console.log(`  ✅ merchId: ${payload.payInstrument.merchDetails.merchId}`);
console.log(`  ✅ userId: ${payload.payInstrument.merchDetails.userId}`);
console.log(`  ✅ password: ${payload.payInstrument.merchDetails.password.substring(0, 10)}...`);
console.log(`  ✅ merchTxnId: ${payload.payInstrument.merchDetails.merchTxnId}`);
console.log(`  ✅ merchTxnDate: ${payload.payInstrument.merchDetails.merchTxnDate}`);

console.log('\nPayment Details:');
console.log(`  ✅ amount: ${payload.payInstrument.payDetails.amount}`);
console.log(`  ✅ product: ${payload.payInstrument.payDetails.product}`);
console.log(`  ✅ custAccNo: ${payload.payInstrument.payDetails.custAccNo}`);
console.log(`  ✅ txnCurrency: ${payload.payInstrument.payDetails.txnCurrency}`);

console.log('\nCustomer Details:');
console.log(`  ✅ custEmail: ${payload.payInstrument.custDetails.custEmail}`);
console.log(`  ✅ custMobile: ${payload.payInstrument.custDetails.custMobile}`);

console.log('\n' + '='.repeat(70));
console.log('\n⚠️  POSSIBLE ISSUES:\n');

if (config.merchId !== '856377') {
  console.log('❌ Merchant ID is NOT 856377');
  console.log(`   Current: ${config.merchId}`);
  console.log('   Expected: 856377\n');
}

if (config.product !== 'AWANT') {
  console.log('❌ Product is NOT AWANT');
  console.log(`   Current: ${config.product}`);
  console.log('   Expected: AWANT\n');
}

if (config.userId !== '856377') {
  console.log('⚠️  User ID is NOT 856377');
  console.log(`   Current: ${config.userId}`);
  console.log('   Expected: 856377\n');
}

if (!config.password || config.password === '') {
  console.log('❌ Password is empty or missing');
  console.log('   Expected: 856377_titan@123\n');
}

console.log('📧 NEXT STEPS:\n');
console.log('1. Verify merchant ID 856377 is registered for AWANT product');
console.log('2. Contact NTT Data: support@nttdata.com');
console.log('3. Ask them to verify:');
console.log('   - Merchant 856377 is active');
console.log('   - Product AWANT is linked to merchant 856377');
console.log('   - Account is in "live" mode (not test mode)\n');

console.log('📞 Reference Information:\n');
console.log('   Merchant ID: 856377');
console.log('   Product: AWANT');
console.log('   User ID: 856377');
console.log('   MCC Code: 5261');
console.log('   Environment: PRODUCTION\n');