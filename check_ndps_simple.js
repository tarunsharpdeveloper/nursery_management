/**
 * Simple NDPS Status Check - Shows Raw Response
 */

const crypto = require('crypto');

const config = {
  merchId: '856377',
  password: '76ce2af2',
  statusApiUrl: 'https://payment1.atomtech.in/ots/payment/status',
  requestKey: '74ABEA4102D67FD3491F23AB9D4636AB',
  responseKey: '9B130849756D796521AC4DBEC26D3B2B',
  requestHashKey: '27786aad29c63b6a3a'
};

const transaction = {
  atomTxnId: '11000383853212',
  merchantTxnId: 'NURSERY_3_muaxr3ek',
  amount: 51.00,
  txnDateShort: '2026-09-21'
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

async function checkStatus() {
  console.log('Checking transaction:', transaction.merchantTxnId);
  console.log('');

  // Generate signature
  const signatureData = [
    { merchId: config.merchId },
    { merchTxnId: transaction.merchantTxnId },
    { atomTxnId: transaction.atomTxnId },
    { amount: transaction.amount }
  ];
  
  const signature = crypto.createHmac('sha512', config.requestHashKey)
    .update(JSON.stringify(signatureData))
    .digest('hex');

  // Create request
  const statusRequest = {
    payInstrument: {
      headDetails: {
        api: 'TXNVERIFICATION',
        source: 'OTS'
      },
      merchDetails: {
        merchId: config.merchId,
        password: config.password,
        merchTxnId: transaction.merchantTxnId,
        merchTxnDate: transaction.txnDateShort
      },
      payDetails: {
        atomTxnId: transaction.atomTxnId,
        amount: transaction.amount,
        txnCurrency: 'INR',
        signature: signature
      }
    }
  };

  const requestJson = JSON.stringify(statusRequest);
  const encryptedRequest = encryptData(requestJson);
  const formBody = `encData=${encodeURIComponent(encryptedRequest)}&merchId=${config.merchId}`;
  
  console.log('Sending request to NDPS...');
  const response = await fetch(config.statusApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formBody
  });

  console.log(`Response: ${response.status} ${response.statusText}`);
  console.log('');

  const responseText = await response.text();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  RAW RESPONSE FROM NDPS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(responseText);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Length: ${responseText.length} characters`);
  console.log('');
  
  // Try to identify response type
  if (responseText.includes('ERROR') || responseText.includes('INVALID')) {
    console.log('⚠️  Response appears to be an ERROR message');
  } else if (responseText.includes('encData=')) {
    console.log('✅ Response contains encrypted data');
  } else if (responseText.length < 100) {
    console.log('⚠️  Response is very short - likely an error');
  } else {
    console.log('ℹ️  Response format unclear - check above');
  }
}

checkStatus().catch(console.error);
