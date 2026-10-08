const https = require('https');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nursery_management'
};

// NDPS Configuration
const NDPS_CONFIG = {
  MERCHANT_ID: "446442",
  PASSWORD: "Test@123",
  ENCRYPTION_KEY: "90e7e2cea33a436f8ad8a588dffecf37",
  VERIFICATION_URL: "https://paynetzuat.atomtech.in/paynetz/epi/fts"
};

// Target transaction
const TARGET_ATOM_TXN_ID = "NURSERY_10_muntf7a511000385102440";

async function findTransactionInDB() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('🔍 Searching for transaction in database...');
    
    const [rows] = await connection.execute(
      `SELECT 
        id, payment_id, status, amount, atom_transaction_id, 
        merchant_transaction_id, created_at, updated_at,
        customer_id, order_id
      FROM payments 
      WHERE atom_transaction_id = ? OR payment_id = ? OR merchant_transaction_id LIKE ?`,
      [TARGET_ATOM_TXN_ID, TARGET_ATOM_TXN_ID, `%${TARGET_ATOM_TXN_ID}%`]
    );
    
    if (rows.length > 0) {
      console.log('✅ Found transaction in database:');
      rows.forEach(row => {
        console.log('📋 Transaction Details:', {
          id: row.id,
          payment_id: row.payment_id,
          status: row.status,
          amount: row.amount,
          atom_transaction_id: row.atom_transaction_id,
          merchant_transaction_id: row.merchant_transaction_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
          customer_id: row.customer_id,
          order_id: row.order_id
        });
      });
      return rows[0];
    } else {
      console.log('❌ Transaction not found in database');
      return null;
    }
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    return null;
  } finally {
    if (connection) await connection.end();
  }
}

function generateSignature(data) {
  const hashString = `${NDPS_CONFIG.MERCHANT_ID}${data.merchTxnId}${data.amount.toFixed(2)}${data.txnCurrency}${NDPS_CONFIG.PASSWORD}`;
  console.log('🔐 Hash String:', hashString);
  
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');
  console.log('🔑 Generated Signature:', hash);
  return hash;
}

function createVerificationRequest(txnData) {
  const requestData = {
    api: "TXNVERIFICATION",
    source: "OTS",
    merchId: NDPS_CONFIG.MERCHANT_ID,
    password: NDPS_CONFIG.PASSWORD,
    merchTxnId: txnData.merchTxnId,
    merchTxnDate: txnData.merchTxnDate,
    atomTxnId: txnData.atomTxnId,
    amount: txnData.amount,
    txnCurrency: "INR"
  };

  // Generate signature
  requestData.signature = generateSignature(requestData);

  // Create the payInstrument structure (matching your format exactly)
  const payInstrument = {
    payInstrument: {
      headDetails: {
        api: requestData.api,
        source: requestData.source
      },
      merchDetails: {
        merchId: parseInt(requestData.merchId),
        password: requestData.password,
        merchTxnId: requestData.merchTxnId,
        merchTxnDate: requestData.merchTxnDate
      },
      payDetails: {
        atomTxnId: requestData.atomTxnId,
        amount: requestData.amount,
        txnCurrency: requestData.txnCurrency,
        signature: requestData.signature
      }
    }
  };

  return payInstrument;
}

async function verifyTransactionWithNDPS(txnData) {
  console.log('\n🧪 === NDPS Transaction Verification ===');
  console.log('📋 Transaction Data:', txnData);
  
  const requestPayload = createVerificationRequest(txnData);
  console.log('\n📤 Request Payload:');
  console.log(JSON.stringify(requestPayload, null, 2));

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(requestPayload);

    const options = {
      hostname: 'paynetzuat.atomtech.in',
      port: 443,
      path: '/paynetz/epi/fts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
        'User-Agent': 'Nursery-Management-System/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n📡 Response Status: ${res.statusCode}`);
        console.log('📄 Response Body:', data);
        
        try {
          const jsonResponse = JSON.parse(data);
          console.log('\n✅ Parsed JSON Response:');
          console.log(JSON.stringify(jsonResponse, null, 2));
          resolve(jsonResponse);
        } catch (e) {
          console.log('\n⚠️  Response is not JSON:', data);
          resolve({ rawResponse: data, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🚀 NDPS Transaction Verification Test');
  console.log('====================================');
  console.log(`🎯 Target Transaction: ${TARGET_ATOM_TXN_ID}`);
  
  // Step 1: Find transaction in database
  const dbTransaction = await findTransactionInDB();
  
  // Step 2: Prepare transaction data for verification
  let txnData;
  
  if (dbTransaction) {
    // Use database data
    const createdDate = new Date(dbTransaction.created_at);
    const formattedDate = createdDate.toISOString().split('T')[0];
    
    txnData = {
      atomTxnId: TARGET_ATOM_TXN_ID,
      merchTxnId: dbTransaction.merchant_transaction_id || dbTransaction.payment_id || 'NURSERY_TXN_001',
      amount: parseFloat(dbTransaction.amount || 100),
      merchTxnDate: formattedDate
    };
  } else {
    // Use the actual transaction data you provided
    txnData = {
      atomTxnId: TARGET_ATOM_TXN_ID,
      merchTxnId: 'NURSERY_TXN_001', // We'll need the actual merchant txn ID
      amount: 1000.00, // Amount you provided
      merchTxnDate: '2026-09-30' // Date you provided (30-Sep-2026)
    };
  }
  
  // Step 3: Verify with NDPS
  try {
    const result = await verifyTransactionWithNDPS(txnData);
    console.log('\n🎉 Verification completed!');
    
    if (result.statusCode === 200 || (result.payInstrument && result.payInstrument.payDetails)) {
      console.log('✅ Transaction verification successful!');
    } else if (result.statusCode === 500) {
      console.log('❌ NDPS server returned 500 error - transaction may not exist or be invalid');
    } else {
      console.log('⚠️  Unexpected response format');
    }
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Run the test
main();