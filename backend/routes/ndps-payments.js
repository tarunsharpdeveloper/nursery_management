const crypto = require('crypto');
const { pool } = require('../db');
const { readJson, sendJson } = require('../http');

// NDPS Configuration (based on working implementation)
const NDPS_CONFIG = {
  UAT: {
    merchId: process.env.NDPS_MERCH_ID || "446442",
    userId: process.env.NDPS_USER_ID || "",
    password: process.env.NDPS_PASSWORD || "Test@123",
    apiUrl: process.env.NDPS_API_URL || "https://caller.atomtech.in/ots/aipay/auth",
    responseUrl: process.env.NDPS_RESPONSE_URL || "http://localhost:4000/api/ndps/response",
    returnUrl: process.env.NDPS_RETURN_URL || "http://localhost:3000/payment/return",
    version: "OTSv1.1",
    api: "AUTH",
    platform: "FLASH",
    product: process.env.NDPS_PRODUCT_ID || "NSE",
    // Encryption Keys (AES-256-CBC with PBKDF2)
    requestKey: process.env.NDPS_REQUEST_KEY || "A4476C2062FFA58980DC8F79EB6A799E",
    requestSalt: process.env.NDPS_REQUEST_KEY || "A4476C2062FFA58980DC8F79EB6A799E",
    responseKey: process.env.NDPS_RESPONSE_KEY || "75AEF0FA1B94B3C10D4F5B268F757F11",
    responseSalt: process.env.NDPS_RESPONSE_KEY || "75AEF0FA1B94B3C10D4F5B268F757F11",
    requestHashKey: process.env.NDPS_REQUEST_HASH_KEY || "KEY123657234",
    responseHashKey: process.env.NDPS_RESPONSE_HASH_KEY || "KEYRESP123657234"
  },
  PROD: {
    merchId: process.env.NDPS_MERCH_ID || "446442",
    userId: process.env.NDPS_USER_ID || "",
    password: process.env.NDPS_PASSWORD || "Test@123",
    apiUrl: process.env.NDPS_API_URL || "https://paynetz.atomtech.in/ots/aipay/auth",
    responseUrl: process.env.NDPS_RESPONSE_URL,
    returnUrl: process.env.NDPS_RETURN_URL,
    version: "OTSv1.1",
    api: "AUTH",
    platform: "FLASH",
    product: "NSE",
    requestKey: process.env.NDPS_REQUEST_KEY,
    requestSalt: process.env.NDPS_REQUEST_KEY,
    responseKey: process.env.NDPS_RESPONSE_KEY,
    responseSalt: process.env.NDPS_RESPONSE_KEY,
    requestHashKey: process.env.NDPS_REQUEST_HASH_KEY,
    responseHashKey: process.env.NDPS_RESPONSE_HASH_KEY
  }
};

const isProduction = process.env.NODE_ENV === 'production';
const config = isProduction ? NDPS_CONFIG.PROD : NDPS_CONFIG.UAT;

// AES-256-CBC Configuration (as per working implementation)
const algorithm = 'aes-256-cbc';
const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 'utf8');

// Log NDPS configuration on startup (for debugging)
console.log('=== NDPS Configuration Loaded ===');
console.log('Environment:', isProduction ? 'PRODUCTION' : 'UAT');
console.log('Merchant ID:', config.merchId);
console.log('User ID:', config.userId || '(empty)');
console.log('Password:', config.password ? '***' + config.password.slice(-3) : '(not set)');
console.log('Product:', config.product);
console.log('API URL:', config.apiUrl);
console.log('Response URL:', config.responseUrl);
console.log('Return URL:', config.returnUrl);
console.log('Request Key:', config.requestKey ? config.requestKey.substring(0, 8) + '...' : '(not set)');
console.log('Response Key:', config.responseKey ? config.responseKey.substring(0, 8) + '...' : '(not set)');
console.log('==================================');

/**
 * Encrypt data using AES-256-CBC with PBKDF2 (as per working NTT implementation)
 */
function encryptData(data) {
  try {
    const password = Buffer.from(config.requestKey, 'utf8');
    const salt = Buffer.from(config.requestSalt, 'utf8');
    
    console.log('=== ENCRYPTION (AES-256-CBC with PBKDF2) ===');
    console.log('Algorithm: aes-256-cbc');
    console.log('Key derivation: PBKDF2 (65536 iterations, sha512)');
    
    // Derive key using PBKDF2 (65536 iterations, 32 bytes, sha512)
    const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
    
    const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    console.log('Encrypted data length:', encrypted.length, 'characters');
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
    const salt = Buffer.from(config.responseSalt, 'utf8');
    
    // Derive key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
    
    const encryptedBuffer = Buffer.from(encryptedData, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
}

/**
 * Generate signature using HMAC-SHA-512 (for response verification)
 * Response format: [transaction_object]
 */
function generateSignature(transactionArray) {
  try {
    const transaction = Array.isArray(transactionArray) ? transactionArray[0] : transactionArray;
    
    const signatureString = 
      transaction.merchDetails.merchId.toString() +
      transaction.payDetails.atomTxnId.toString() +
      transaction.merchDetails.merchTxnId.toString() +
      transaction.payDetails.totalAmount.toFixed(2).toString() +
      transaction.responseDetails.statusCode.toString() +
      transaction.payModeSpecificData.subChannel.toString() +
      transaction.payModeSpecificData.bankDetails.bankTxnId.toString();
    
    const hmac = crypto.createHmac('sha512', config.responseHashKey);
    const signature = hmac.update(signatureString).digest('hex');
    
    console.log('Signature calculation:');
    console.log('- String:', signatureString);
    console.log('- Signature:', signature);
    
    return signature;
  } catch (error) {
    console.error('Signature generation error:', error);
    throw error;
  }
}

/**
 * Generate NDPS payment request and get token
 * Based on working NTT DATA Node.js implementation
 */
async function initiateNDPSPayment(req, res, helpers) {
  try {
    console.log('=== NDPS Payment Initiation ===');
    console.log('Using Merchant ID:', config.merchId);
    console.log('Environment:', isProduction ? 'PRODUCTION' : 'UAT');
    console.log('API URL:', config.apiUrl);
    
    const body = helpers ? await helpers.readJson(req) : await readJson(req);
    const { orderId, customerEmail, customerMobile, amount } = body;

    // Validate required fields
    if (!orderId || !customerEmail || !customerMobile || !amount) {
      const send = helpers ? helpers.sendJson : sendJson;
      return send(res, 400, { 
        error: 'Missing required fields: orderId, customerEmail, customerMobile, amount',
        received: { orderId, customerEmail, customerMobile, amount }
      });
    }

    const [orderRows] = await pool.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    if (orderRows.length === 0) {
      const send = helpers ? helpers.sendJson : sendJson;
      return send(res, 404, { error: 'Order not found' });
    }

    // Generate unique merchant transaction ID
    const merchTxnId = `NURSERY_${orderId}_${Date.now().toString(36)}`;
    const merchTxnDate = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Create NDPS payment payload (EXACT format from working implementation)
    const paymentRequest = {
      payInstrument: {
        headDetails: {
          version: config.version,
          api: config.api,
          platform: config.platform
        },
        merchDetails: {
          merchId: config.merchId,
          userId: config.userId,
          password: config.password,
          merchTxnId: merchTxnId,
          merchTxnDate: merchTxnDate
        },
        payDetails: {
          amount: parseFloat(amount).toFixed(2),
          product: config.product,
          custAccNo: orderId.toString(),
          txnCurrency: "INR"
        },
        custDetails: {
          custEmail: customerEmail,
          custMobile: customerMobile
        },
        extras: {
          udf1: `order_${orderId}`,
          udf2: "nursery_payment",
          udf3: config.returnUrl,
          udf4: "",
          udf5: ""
        }
      }
    };

    // Convert to JSON string
    const paymentData = JSON.stringify(paymentRequest);
    console.log('=== Payment JSON Before Encryption ===');
    console.log(paymentData);
    
    // Encrypt the payment data (using AES-256-CBC with PBKDF2)
    const encryptedData = encryptData(paymentData);
    console.log('=== Encryption Complete ===');
    console.log('Original length:', paymentData.length);
    console.log('Encrypted length:', encryptedData.length);

    console.log('=== Sending to NTT AUTH API ===');
    console.log('Merchant ID:', config.merchId);
    console.log('Merchant Txn ID:', merchTxnId);
    console.log('Amount:', amount);
    console.log('Request URL:', config.apiUrl);

    // Call NTT AUTH API (using form-urlencoded format like working implementation)
    const formBody = `encData=${encryptedData}&merchId=${config.merchId}`;
    
    const authResponse = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: formBody
    });

    const authResponseText = await authResponse.text();
    console.log('=== NTT AUTH API Response ===');
    console.log('Status:', authResponse.status);
    console.log('Status Text:', authResponse.statusText);
    console.log('Response Length:', authResponseText.length, 'characters');
    console.log('Response Content:', authResponseText);

    if (!authResponse.ok) {
      throw new Error(`NTT AUTH API returned ${authResponse.status}: ${authResponseText}`);
    }

    if (!authResponseText || authResponseText.length === 0) {
      throw new Error('Empty response from NTT AUTH API. Please contact NTT DATA support.');
    }

    // Parse the response (format: merchId=xxx&encData=yyy)
    let encryptedResponse;
    
    if (authResponseText.includes('encData=')) {
      const parts = authResponseText.split('&');
      for (const part of parts) {
        if (part.startsWith('encData=')) {
          encryptedResponse = part.substring(8); // Remove 'encData=' prefix
          break;
        }
      }
    } else if (authResponseText.length > 50 && !authResponseText.includes('<')) {
      // Direct encrypted string
      encryptedResponse = authResponseText.trim();
    }

    if (!encryptedResponse) {
      console.error('Could not extract encrypted data from response');
      throw new Error(`No encrypted response from NTT AUTH API. Response was: ${authResponseText.substring(0, 200)}`);
    }

    // Decrypt the response
    console.log('=== Decrypting Response ===');
    const decryptedResponse = decryptData(encryptedResponse);
    console.log('Decrypted response:', decryptedResponse);
    
    const responseData = JSON.parse(decryptedResponse);
    console.log('Parsed response data:', responseData);

    // Check for atomTokenId
    if (!responseData.atomTokenId) {
      const statusCode = responseData.responseDetails?.txnStatusCode || 'UNKNOWN';
      const message = responseData.responseDetails?.txnMessage || 'Unknown error';
      throw new Error(`Token generation failed (${statusCode}): ${message}`);
    }

    // Store payment initiation in database
    const [paymentResult] = await pool.query(
      `INSERT INTO payments 
       (order_id, payment_gateway, payment_method, payment_status, amount, gateway_payment_id, remarks, created_at) 
       VALUES (?, 'ndps', 'online', 'pending', ?, ?, ?, NOW())`,
      [orderId, amount, merchTxnId, `Token: ${responseData.atomTokenId}`]
    );

    const paymentId = paymentResult.insertId;

    console.log('=== Preparing Response ===');
    console.log('Payment ID:', paymentId);
    console.log('Atom Token ID:', responseData.atomTokenId);
    console.log('Atom Token ID type:', typeof responseData.atomTokenId);
    console.log('Merchant ID:', config.merchId);
    console.log('Return URL:', config.returnUrl);

    // Return token and config for frontend
    const send = helpers ? helpers.sendJson : sendJson;
    const responsePayload = {
      success: true,
      paymentId: paymentId,
      atomTokenId: responseData.atomTokenId,
      merchId: config.merchId,
      merchTxnId: merchTxnId,
      customerEmail: customerEmail,
      customerMobile: customerMobile,
      returnUrl: config.returnUrl,
      env: isProduction ? 'prod' : 'uat'
    };
    
    console.log('=== Sending Response to Frontend ===');
    console.log(JSON.stringify(responsePayload, null, 2));
    
    send(res, 200, responsePayload);

  } catch (error) {
    console.error('NDPS Payment initiation error:', error);
    const send = helpers ? helpers.sendJson : sendJson;
    send(res, 500, { error: 'Failed to initiate payment', details: error.message });
  }
}

/**
 * Handle NDPS payment response/callback (based on actual response format)
 */
async function handleNDPSResponse(req, res, helpers) {
  try {
    const readData = helpers ? helpers.readJson : readJson;
    const send = helpers ? helpers.sendJson : sendJson;
    
    // NDPS sends encrypted response
    const body = await readData(req);
    const encryptedResponse = body.encData;

    if (!encryptedResponse) {
      console.log('No encrypted data in NDPS response');
      return send(res, 400, { error: 'Invalid response: missing encrypted data' });
    }

    // Decrypt the response
    let responseData;
    try {
      const decryptedData = decryptData(encryptedResponse);
      console.log('=== Decrypted Response ===');
      console.log(decryptedData);
      
      responseData = JSON.parse(decryptedData);
      console.log('=== Parsed Response Data ===');
      console.log(JSON.stringify(responseData, null, 2));
    } catch (decryptError) {
      console.error('NDPS Response decryption failed:', decryptError);
      return send(res, 400, { error: 'Failed to decrypt response' });
    }

    // Response format: {"payInstrument": [array of transactions]}
    if (!responseData.payInstrument || !Array.isArray(responseData.payInstrument) || responseData.payInstrument.length === 0) {
      console.error('Invalid response format - expected payInstrument array');
      return send(res, 400, { error: 'Invalid response format' });
    }

    const transaction = responseData.payInstrument[0];
    console.log('=== Transaction Details ===');
    console.log(JSON.stringify(transaction, null, 2));
    
    // Extract transaction details from proper structure
    const merchTxnId = transaction.merchDetails?.merchTxnId;
    const statusCode = transaction.responseDetails?.statusCode;
    const statusMessage = transaction.responseDetails?.message;
    const atomTxnId = transaction.payDetails?.atomTxnId;
    const totalAmount = transaction.payDetails?.totalAmount;
    const bankTxnId = transaction.payModeSpecificData?.bankDetails?.bankTxnId;
    const subChannel = transaction.payModeSpecificData?.subChannel;

    console.log('Extracted Details:');
    console.log('- Merchant Txn ID:', merchTxnId);
    console.log('- Status Code:', statusCode);
    console.log('- Status Message:', statusMessage);
    console.log('- Atom Txn ID:', atomTxnId);
    console.log('- Total Amount:', totalAmount);

    if (!merchTxnId) {
      return send(res, 400, { error: 'Invalid response: missing merchTxnId' });
    }

    // Verify signature if present
    if (transaction.payDetails?.signature) {
      try {
        const signatureData = [transaction];
        const calculatedSignature = generateSignature(signatureData);
        const receivedSignature = transaction.payDetails.signature;
        
        if (receivedSignature !== calculatedSignature) {
          console.error('Signature mismatch!');
          console.error('Received:', receivedSignature);
          console.error('Calculated:', calculatedSignature);
          return send(res, 400, { error: 'Signature verification failed' });
        }
        console.log('✅ Signature verified successfully');
      } catch (sigError) {
        console.error('Signature verification error:', sigError);
        // Continue anyway - signature might not be present in all responses
      }
    }

    // Find the payment record
    const [paymentRows] = await pool.query(
      'SELECT * FROM payments WHERE gateway_payment_id = ?',
      [merchTxnId]
    );

    if (paymentRows.length === 0) {
      console.log('Payment record not found for:', merchTxnId);
      return send(res, 404, { error: 'Payment record not found' });
    }

    const payment = paymentRows[0];
    let newStatus = 'pending';

    // Map status code to payment status (OTS0000 = success)
    if (statusCode === 'OTS0000') {
      newStatus = 'paid';
      console.log('✅ Payment successful');
    } else {
      newStatus = 'failed';
      console.log('❌ Payment failed:', statusMessage);
    }

    // Update payment record with full details
    await pool.query(
      `UPDATE payments 
       SET payment_status = ?, 
           paid_at = CASE WHEN ? = 'paid' THEN NOW() ELSE paid_at END,
           remarks = ?
       WHERE id = ?`,
      [
        newStatus, 
        newStatus, 
        `Status: ${statusCode} - ${statusMessage}. Atom Txn: ${atomTxnId || 'N/A'}. Bank Txn: ${bankTxnId || 'N/A'}`,
        payment.id
      ]
    );

    // Update order status
    await pool.query(
      'UPDATE orders SET payment_status = ? WHERE id = ?',
      [newStatus, payment.order_id]
    );

    console.log('=== Payment Updated ===');
    console.log('Payment ID:', payment.id);
    console.log('Order ID:', payment.order_id);
    console.log('New Status:', newStatus);

    // Send response back to NDPS
    if (newStatus === 'paid') {
      send(res, 200, { message: 'Transaction successful', status: 'OK' });
    } else {
      send(res, 200, { message: 'Transaction failed', status: 'FAILED' });
    }

  } catch (error) {
    console.error('NDPS Response handling error:', error);
    const send = helpers ? helpers.sendJson : sendJson;
    send(res, 500, { error: 'Failed to process payment response' });
  }
}

/**
 * Check NDPS payment status (for frontend polling)
 */
async function checkPaymentStatus(req, res, helpers) {
  try {
    const send = helpers ? helpers.sendJson : sendJson;
    const paymentId = req.url.split('/').pop();

    const [paymentRows] = await pool.query(
      'SELECT p.*, o.order_number FROM payments p JOIN orders o ON p.order_id = o.id WHERE p.id = ?',
      [paymentId]
    );

    if (paymentRows.length === 0) {
      return send(res, 404, { error: 'Payment not found' });
    }

    const payment = paymentRows[0];

    send(res, 200, {
      paymentId: payment.id,
      orderId: payment.order_id,
      orderNumber: payment.order_number,
      status: payment.payment_status,
      amount: payment.amount,
      paidAt: payment.paid_at,
      gatewayPaymentId: payment.gateway_payment_id
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    const send = helpers ? helpers.sendJson : sendJson;
    send(res, 500, { error: 'Failed to check payment status' });
  }
}

module.exports = {
  initiateNDPSPayment,
  handleNDPSResponse,
  checkPaymentStatus,
  requeryTransactionStatus
};

/**
 * Requery transaction status from NTT DATA API
 * This calls NTT's status/requery API to get the latest transaction status
 */
async function requeryTransactionStatus(req, res, helpers) {
  try {
    console.log('=== NDPS Transaction Status Requery ===');
    
    const send = helpers ? helpers.sendJson : sendJson;
    const body = helpers ? await helpers.readJson(req) : await readJson(req);
    const { merchTxnId } = body;

    if (!merchTxnId) {
      return send(res, 400, { error: 'merchTxnId is required' });
    }

    console.log('Querying status for transaction:', merchTxnId);

    // Create requery payload
    const requeryPayload = {
      payInstrument: {
        headDetails: {
          version: config.version,
          api: "STATUS", // Changed to STATUS for requery
          platform: config.platform
        },
        merchDetails: {
          merchId: config.merchId,
          userId: config.userId,
          password: config.password,
          merchTxnId: merchTxnId
        }
      }
    };

    const payloadData = JSON.stringify(requeryPayload);
    console.log('Requery payload:', payloadData);

    // Encrypt the payload
    const encryptedData = encryptData(payloadData);

    // Call NTT STATUS API (usually same URL but different API in payload)
    const statusUrl = config.apiUrl.replace('/auth', '/status'); // or might be same URL
    const formBody = `encData=${encryptedData}&merchId=${config.merchId}`;

    console.log('Calling NTT STATUS API:', statusUrl);

    const statusResponse = await fetch(statusUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: formBody
    });

    const statusResponseText = await statusResponse.text();
    console.log('Status API response:', statusResponseText);

    if (!statusResponse.ok || !statusResponseText || statusResponseText.length === 0) {
      // If status API doesn't work, return database status
      console.log('Status API not available, returning database status');
      
      const [paymentRows] = await pool.query(
        'SELECT * FROM payments WHERE gateway_payment_id = ?',
        [merchTxnId]
      );

      if (paymentRows.length === 0) {
        return send(res, 404, { error: 'Transaction not found' });
      }

      return send(res, 200, {
        merchTxnId: merchTxnId,
        status: paymentRows[0].payment_status,
        amount: paymentRows[0].amount,
        source: 'database'
      });
    }

    // Parse response (format: merchId=xxx&encData=yyy)
    let encryptedResponse;
    if (statusResponseText.includes('encData=')) {
      const parts = statusResponseText.split('&');
      for (const part of parts) {
        if (part.startsWith('encData=')) {
          encryptedResponse = part.substring(8);
          break;
        }
      }
    }

    if (!encryptedResponse) {
      return send(res, 500, { error: 'Invalid status response from gateway' });
    }

    // Decrypt response
    const decryptedResponse = decryptData(encryptedResponse);
    console.log('=== Decrypted Status Response ===');
    console.log(decryptedResponse);
    
    const responseData = JSON.parse(decryptedResponse);

    // Response format: {"payInstrument": [array]}
    if (!responseData.payInstrument || !Array.isArray(responseData.payInstrument) || responseData.payInstrument.length === 0) {
      console.error('Invalid status response format');
      return send(res, 500, { error: 'Invalid status response format' });
    }

    const transaction = responseData.payInstrument[0];
    console.log('Transaction details:', JSON.stringify(transaction, null, 2));

    // Extract status information
    const statusCode = transaction.responseDetails?.statusCode;
    const statusMessage = transaction.responseDetails?.message;
    const atomTxnId = transaction.payDetails?.atomTxnId;
    const totalAmount = transaction.payDetails?.totalAmount;

    // Update database if needed
    const [paymentRows] = await pool.query(
      'SELECT * FROM payments WHERE gateway_payment_id = ?',
      [merchTxnId]
    );

    if (paymentRows.length > 0) {
      let newStatus = 'pending';
      if (statusCode === 'OTS0000') {
        newStatus = 'paid';
      } else if (statusCode && statusCode !== 'OTS0000') {
        newStatus = 'failed';
      }

      await pool.query(
        'UPDATE payments SET payment_status = ?, remarks = ? WHERE gateway_payment_id = ?',
        [newStatus, `Status: ${statusCode} - ${statusMessage}`, merchTxnId]
      );
      
      // Also update order
      await pool.query(
        'UPDATE orders SET payment_status = ? WHERE id = ?',
        [newStatus, paymentRows[0].order_id]
      );
    }

    send(res, 200, {
      merchTxnId: merchTxnId,
      statusCode: statusCode,
      statusMessage: statusMessage,
      atomTxnId: atomTxnId,
      totalAmount: totalAmount,
      transactionData: transaction,
      source: 'gateway'
    });

  } catch (error) {
    console.error('Transaction status requery error:', error);
    const send = helpers ? helpers.sendJson : sendJson;
    send(res, 500, { error: 'Failed to query transaction status', details: error.message });
  }
}