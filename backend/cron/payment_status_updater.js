#!/usr/bin/env node

const https = require('https');
const crypto = require('crypto');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Log file path (define BEFORE using in functions)
const LOG_FILE = path.join(__dirname, '../logs/payment_status_cron.log');

// Ensure logs directory exists
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Logging function
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    
    console.log(logEntry.trim());
    fs.appendFileSync(LOG_FILE, logEntry);
}

// NDPS Configuration - Updated to match your actual .env variable names
const NDPS_CONFIG = {
    MERCHANT_ID: process.env.NDPS_MERCH_ID || "856377",
    PASSWORD: process.env.NDPS_PASSWORD || "76ce2af2",
    PRODUCT_ID: process.env.NDPS_PRODUCT_ID || "AWANT",
    // Keys for Encryption (AES/PBKDF2) - Use the correct encryption keys
    REQ_ENCRYPTION_KEY: "74ABEA4102D67FD3491F23AB9D4636AB", // Fixed: Use correct encryption key
    RES_ENCRYPTION_KEY: "9B130849756D796521AC4DBEC26D3B2B", // Fixed: Use correct encryption key
    // Keys for Hashing (HMAC-SHA512) - Use the hash keys from your .env
    REQ_HASH_KEY: process.env.NDPS_REQUEST_HASH_KEY || "27786aad29c63b6a3a",
    RES_HASH_KEY: process.env.NDPS_RESPONSE_HASH_KEY || "9f9153a2a8671ae683",
    OTS_URL: "https://payment1.atomtech.in/ots/payment/status"
};

// Database configuration
const DB_CONFIG = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'nursery_management'
};

// Debug: Log the actual keys being used (after LOG_FILE is defined)
log(`🔧 NDPS Configuration Debug:`);
log(`  Merchant ID: ${NDPS_CONFIG.MERCHANT_ID}`);
log(`  Password: ${NDPS_CONFIG.PASSWORD}`);
log(`  Request Encryption Key: ${NDPS_CONFIG.REQ_ENCRYPTION_KEY}`);
log(`  Response Encryption Key: ${NDPS_CONFIG.RES_ENCRYPTION_KEY}`);
log(`  Request Hash Key: ${NDPS_CONFIG.REQ_HASH_KEY}`);
log(`  Response Hash Key: ${NDPS_CONFIG.RES_HASH_KEY}`);

// ==========================================
// NDPS CRYPTOGRAPHY FUNCTIONS
// ==========================================

function generateSignature(data) {
    const amountStr = data.amount.toString();
    const hashString = `${NDPS_CONFIG.MERCHANT_ID}${NDPS_CONFIG.PASSWORD}${data.merchTxnId}${amountStr}${data.txnCurrency}TXNVERIFICATION`;
    
    log(`  🔐 Signature Generation Debug:`);
    log(`    Merchant ID: ${NDPS_CONFIG.MERCHANT_ID}`);
    log(`    Password: ${NDPS_CONFIG.PASSWORD}`);
    log(`    Merchant Txn ID: ${data.merchTxnId}`);
    log(`    Amount: ${amountStr}`);
    log(`    Currency: ${data.txnCurrency}`);
    log(`    Hash String: ${hashString}`);
    log(`    Hash Key: ${NDPS_CONFIG.REQ_HASH_KEY}`);
    
    const hmac = crypto.createHmac('sha512', NDPS_CONFIG.REQ_HASH_KEY);
    hmac.update(hashString, 'utf8');
    const signature = hmac.digest('hex').toLowerCase();
    
    log(`    Generated Signature: ${signature}`);
    return signature;
}

function encryptAES256(plainText, key) {
    try {
        const salt = Buffer.from(key, 'utf8');
        const derivedKey = crypto.pbkdf2Sync(key, salt, 65536, 32, 'sha512');
        const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
        
        const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
        let encrypted = cipher.update(plainText, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return encrypted.toUpperCase();
    } catch (error) {
        log(`Encryption error: ${error.message}`, 'ERROR');
        return null;
    }
}

function decryptAES256(encryptedHex, key) {
    try {
        const salt = Buffer.from(key, 'utf8');
        const derivedKey = crypto.pbkdf2Sync(key, salt, 65536, 32, 'sha512');
        const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
        
        const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        return null;
    }
}

// ==========================================
// NDPS API FUNCTIONS
// ==========================================

function createEncryptedPayload(txnData) {
    // First format - Simple flat structure (like in test_ots_final.js createEncryptedPayload)
    const verificationData = {
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
    verificationData.signature = generateSignature(verificationData);
    
    log(`🔐 Creating NDPS payload (Simple Format):`);
    log(`${JSON.stringify(verificationData, null, 2)}`);
    
    const jsonData = JSON.stringify(verificationData);
    return encryptAES256(jsonData, NDPS_CONFIG.REQ_ENCRYPTION_KEY);
}

function createExactPayloadStructure(txnData) {
    // Exact format from test_ots_final.js createExactPayloadStructure
    const payInstrument = {
        headDetails: {
            api: "TXNVERIFICATION",
            source: "OTS"
        },
        merchDetails: {
            merchId: parseInt(NDPS_CONFIG.MERCHANT_ID),
            password: NDPS_CONFIG.PASSWORD,
            merchTxnId: txnData.merchTxnId,
            merchTxnDate: txnData.merchTxnDate
        },
        payDetails: {
            atomTxnId: txnData.atomTxnId,
            amount: txnData.amount,
            txnCurrency: "INR"
        }
    };

    // Generate signature using flat data structure (as per working test)
    const flatData = {
        merchTxnId: txnData.merchTxnId,
        amount: txnData.amount,
        txnCurrency: "INR"
    };
    
    payInstrument.payDetails.signature = generateSignature(flatData);
    const fullPayload = { payInstrument };
    
    log(`🔐 Creating NDPS payload (Exact Structure):`);
    log(`${JSON.stringify(fullPayload, null, 2)}`);
    
    const jsonData = JSON.stringify(fullPayload);
    return encryptAES256(jsonData, NDPS_CONFIG.REQ_ENCRYPTION_KEY);
}

async function testOTSRequestGET(encData, txnData) {
    log(`🧪 === Testing: GET Request with Query Parameters ===`);
    return new Promise((resolve, reject) => {
        const queryParams = new URLSearchParams({
            merchId: NDPS_CONFIG.MERCHANT_ID,
            encData: encData
        });
        
        const url = new URL(NDPS_CONFIG.OTS_URL);
        url.search = queryParams;
        
        log(`🔍 Debug - GET Request URL:`);
        log(`  Base URL: ${NDPS_CONFIG.OTS_URL}`);
        log(`  Merchant ID: ${NDPS_CONFIG.MERCHANT_ID}`);
        log(`  encData length: ${encData.length}`);
        log(`  Full URL (truncated): ${url.toString().substring(0, 150)}...`);
        
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'User-Agent': 'NodeJS/1.0',
                'Accept': 'application/json'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                log(`📡 GET Response Status: ${res.statusCode}`);
                if (res.statusCode === 200) log('✅ Server accepted GET request! (200 OK)');
                
                try {
                    // Try parsing as URL Search Params first because atom often returns that
                    let responseEncData;
                    if (data.includes('encData=')) {
                        const params = new URLSearchParams(data);
                        responseEncData = params.get('encData');
                        log(`📄 GET Response Format: URL-encoded parameters`);
                    } else {
                        const jsonResponse = JSON.parse(data);
                        responseEncData = jsonResponse.encData;
                        log(`📄 GET Response Format: JSON`);
                    }

                    if (responseEncData) {
                        log(`🔓 Attempting to decrypt GET response...`);
                        log(`  🔐 Encrypted Data Length: ${responseEncData.length}`);
                        const decryptedData = decryptAES256(responseEncData, NDPS_CONFIG.RES_ENCRYPTION_KEY);
                        
                        if (decryptedData) {
                            log(`🎉 GET Decrypted Response:`);
                            log(`${decryptedData}`);
                            
                            try {
                                const responseData = JSON.parse(decryptedData);
                                log(`📄 Parsed Response Structure:`);
                                log(JSON.stringify(responseData, null, 2));
                                resolve({ success: true, data: responseData, method: 'GET' });
                            } catch (parseError) {
                                log(`❌ JSON parsing failed: ${parseError.message}`, 'ERROR');
                                resolve({ success: false, error: 'Response is not valid JSON', method: 'GET', rawDecrypted: decryptedData });
                            }
                        } else {
                            log(`❌ GET Decryption failed with environment key!`);
                            log(`🔄 Trying with hardcoded test key from working test_ots_final.js...`);
                            
                            // Try with the exact same hardcoded key as test_ots_final.js
                            const hardcodedKey = "9B130849756D796521AC4DBEC26D3B2B";
                            const decryptedWithHardcoded = decryptAES256(responseEncData, hardcodedKey);
                            
                            if (decryptedWithHardcoded) {
                                log(`🎉 GET Decrypted with hardcoded key:`);
                                log(`${decryptedWithHardcoded}`);
                                
                                try {
                                    const responseData = JSON.parse(decryptedWithHardcoded);
                                    log(`📄 Parsed Response Structure (hardcoded key):`);
                                    log(JSON.stringify(responseData, null, 2));
                                    resolve({ success: true, data: responseData, method: 'GET' });
                                } catch (parseError) {
                                    log(`❌ JSON parsing failed: ${parseError.message}`, 'ERROR');
                                    resolve({ success: false, error: 'Response is not valid JSON', method: 'GET', rawDecrypted: decryptedWithHardcoded });
                                }
                            } else {
                                log(`❌ GET Decryption still failed with hardcoded key - different issue`);
                                resolve({ success: false, error: 'Decryption failed with both keys', method: 'GET', rawData: data });
                            }
                        }
                    } else {
                        log(`No encrypted data in GET response: ${data}`);
                        resolve({ success: false, error: 'No encrypted data', method: 'GET', rawData: data });
                    }
                } catch (e) {
                    resolve({ success: false, error: e.message, method: 'GET', rawData: data });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function testOTSRequestPOST(encData, format) {
    log(`🧪 === Testing POST: ${format.name} ===`);
    return new Promise((resolve, reject) => {
        const postData = format.createPostData(encData);
        
        log(`🔍 Debug - Actual Post Data:`);
        log(`  Length: ${postData.length}`);
        log(`  First 100 chars: ${postData.substring(0, 100)}...`);
        
        const options = {
            hostname: 'payment1.atomtech.in',
            port: 443,
            path: '/ots/payment/status',
            method: 'POST',
            headers: {
                'Content-Type': format.contentType,
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'NodeJS/1.0',
                'Accept': 'application/json'
            }
        };
        
        log(`📤 Content-Type: ${format.contentType}`);
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                log(`📡 POST Response Status: ${res.statusCode}`);
                log(`📄 Raw POST Response Body: ${data.substring(0, 300)}${data.length > 300 ? '...' : ''}`);
                if (res.statusCode === 200) log('✅ Server accepted POST request! (200 OK)');
                
                try {
                    // Try parsing as URL Search Params first
                    let responseEncData;
                    if (data.includes('encData=')) {
                        const params = new URLSearchParams(data);
                        responseEncData = params.get('encData');
                        log(`📄 POST Response Format: URL-encoded parameters`);
                    } else {
                        const jsonResponse = JSON.parse(data);
                        responseEncData = jsonResponse.encData;
                        log(`📄 POST Response Format: JSON`);
                    }

                    if (responseEncData) {
                        log(`🔓 Attempting to decrypt POST response...`);
                        log(`  🔐 Encrypted Data Length: ${responseEncData.length}`);
                        const decryptedData = decryptAES256(responseEncData, NDPS_CONFIG.RES_ENCRYPTION_KEY);
                        
                        if (decryptedData) {
                            log(`🎉 POST Decrypted Response:`);
                            log(`${decryptedData}`);
                            
                            try {
                                const responseData = JSON.parse(decryptedData);
                                log(`📄 Parsed Response Structure:`);
                                log(JSON.stringify(responseData, null, 2));
                                resolve({ success: true, data: responseData, method: 'POST' });
                            } catch (parseError) {
                                log(`❌ JSON parsing failed: ${parseError.message}`, 'ERROR');
                                resolve({ success: false, error: 'Response is not valid JSON', method: 'POST', rawDecrypted: decryptedData });
                            }
                        } else {
                            log(`❌ POST Decryption failed with environment key!`);
                            log(`🔄 Trying with hardcoded test key from working test_ots_final.js...`);
                            
                            // Try with the exact same hardcoded key as test_ots_final.js
                            const hardcodedKey = "9B130849756D796521AC4DBEC26D3B2B";
                            const decryptedWithHardcoded = decryptAES256(responseEncData, hardcodedKey);
                            
                            if (decryptedWithHardcoded) {
                                log(`🎉 POST Decrypted with hardcoded key:`);
                                log(`${decryptedWithHardcoded}`);
                                
                                try {
                                    const responseData = JSON.parse(decryptedWithHardcoded);
                                    log(`📄 Parsed Response Structure (hardcoded key):`);
                                    log(JSON.stringify(responseData, null, 2));
                                    resolve({ success: true, data: responseData, method: 'POST' });
                                } catch (parseError) {
                                    log(`❌ JSON parsing failed: ${parseError.message}`, 'ERROR');
                                    resolve({ success: false, error: 'Response is not valid JSON', method: 'POST', rawDecrypted: decryptedWithHardcoded });
                                }
                            } else {
                                log(`❌ POST Decryption still failed with hardcoded key - different issue`);
                                resolve({ success: false, error: 'Decryption failed with both keys', method: 'POST', rawData: data });
                            }
                        }
                    } else {
                        log(`No encrypted data in POST response: ${data}`);
                        resolve({ success: false, error: 'No encrypted data', method: 'POST', rawData: data });
                    }
                } catch (e) {
                    resolve({ success: false, error: e.message, method: 'POST', rawData: data });
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function queryPaymentStatus(txnData) {
    log(`🚀 OTS Transaction Verification - Multiple Method Approach`);
    log(`=========================================================`);
    
    // Create both payload formats like test_ots_final.js
    const exactEncData = createExactPayloadStructure(txnData);
    const simpleEncData = createEncryptedPayload(txnData);
    
    const testCases = [
        {
            name: 'Exact JSON Structure',
            encData: exactEncData,
            description: 'Using the exact payInstrument structure from test file'
        },
        {
            name: 'Simple Structure',
            encData: simpleEncData,
            description: 'Using the simple flat structure from test file'
        }
    ];

    // TEST GET METHOD first (like test_ots_final.js)
    for (const testCase of testCases) {
        try {
            log(`\n🧪 Testing GET with ${testCase.name}`);
            const result = await testOTSRequestGET(testCase.encData, txnData);
            if (result.success) {
                log(`✅ GET method successful with ${testCase.name}!`);
                return result.data;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            log(`❌ GET test failed: ${error.message}`, 'ERROR');
        }
    }

    // TEST POST METHOD as fallback (like test_ots_final.js)
    log(`\n📦 === FALLBACK: Trying POST Methods ===`);
    const formats = [
        {
            name: 'Form URL Encoded',
            contentType: 'application/x-www-form-urlencoded',
            createPostData: (encData) => `merchId=${NDPS_CONFIG.MERCHANT_ID}&encData=${encodeURIComponent(encData)}`
        }
    ];

    for (const testCase of testCases) {
        for (let i = 0; i < formats.length; i++) {
            try {
                log(`\n🧪 Testing POST with ${testCase.name} - ${formats[i].name}`);
                const result = await testOTSRequestPOST(testCase.encData, formats[i]);
                if (result.success) {
                    log(`✅ POST method successful with ${testCase.name}!`);
                    return result.data;
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                log(`❌ POST test failed: ${error.message}`, 'ERROR');
            }
        }
    }
    
    // If we get here, all methods failed
    throw new Error('All NDPS API methods failed - check encryption keys or contact NDPS support');
}

// ==========================================
// DATABASE FUNCTIONS
// ==========================================

async function createDbConnection() {
    try {
        const connection = await mysql.createConnection(DB_CONFIG);
        return connection;
    } catch (error) {
        log(`Database connection error: ${error.message}`, 'ERROR');
        throw error;
    }
}

async function getPendingPayments() {
    const connection = await createDbConnection();
    try {
        // Get payments that are pending, failed, or haven't been checked in the last hour
        // Join with orders to get order information if needed
        const query = `
            SELECT 
                p.id,
                p.order_id,
                p.amount,
                p.payment_status,
                p.atom_transaction_id,
                p.merchant_transaction_id,
                p.created_at,
                p.paid_at,
                p.remarks,
                o.order_number,
                o.created_at as order_created_at
            FROM payments p
            LEFT JOIN orders o ON p.order_id = o.id
            WHERE p.payment_status IN ('pending', 'failed')
                AND p.payment_gateway = 'ndps'
                AND (
                    (p.atom_transaction_id IS NOT NULL AND p.atom_transaction_id != '') OR
                    (p.merchant_transaction_id IS NOT NULL AND p.merchant_transaction_id != '') OR
                    (p.gateway_payment_id IS NOT NULL AND p.gateway_payment_id != '')
                )
            ORDER BY p.created_at DESC
            LIMIT 50
        `;
        
        const [rows] = await connection.execute(query);
        
        // Debug: Show what we found
        log(`🔍 Database Query Results:`);
        log(`  Total rows found: ${rows.length}`);
        if (rows.length > 0) {
            log(`  Sample payment data:`);
            for (let i = 0; i < Math.min(3, rows.length); i++) {
                const row = rows[i];
                log(`    Payment ${row.id}: gateway=${row.payment_gateway || 'NULL'}, status=${row.payment_status}, merchant_id=${row.merchant_transaction_id || 'NULL'}, atom_id=${row.atom_transaction_id || 'NULL'}, gateway_id=${row.gateway_payment_id || 'NULL'}`);
            }
        }
        
        return rows;
    } finally {
        await connection.end();
    }
}

async function updatePaymentStatus(paymentId, orderId, newStatus, responseData, originalAtomTxnId = null) {
    const connection = await createDbConnection();
    try {
        // Extract atom transaction ID from NDPS response if available
        let atomTxnIdFromResponse = null;
        try {
            if (responseData && responseData.payInstrument && responseData.payInstrument[0]) {
                const payDetails = responseData.payInstrument[0].payDetails;
                if (payDetails && payDetails.atomTxnId) {
                    atomTxnIdFromResponse = payDetails.atomTxnId.toString();
                }
            }
        } catch (error) {
            log(`Error extracting atom transaction ID from response: ${error.message}`, 'WARN');
        }
        
        // Update payment status and add last checked timestamp to remarks
        const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
        const newRemarks = `NDPS Response: ${JSON.stringify(responseData)} | last_checked: ${timestamp}`;
        
        // Determine if we should update atom_transaction_id
        const shouldUpdateAtomTxnId = !originalAtomTxnId && atomTxnIdFromResponse;
        
        let updatePaymentQuery;
        let queryParams;
        
        if (shouldUpdateAtomTxnId) {
            // Update with atom transaction ID
            updatePaymentQuery = `
                UPDATE payments 
                SET 
                    payment_status = ?,
                    atom_transaction_id = ?,
                    remarks = ?,
                    paid_at = CASE WHEN ? = 'paid' THEN NOW() ELSE paid_at END
                WHERE id = ?
            `;
            queryParams = [newStatus, atomTxnIdFromResponse, newRemarks, newStatus, paymentId];
            log(`🔄 Updating atom_transaction_id for payment ${paymentId}: ${atomTxnIdFromResponse}`);
        } else {
            // Standard update without atom transaction ID
            updatePaymentQuery = `
                UPDATE payments 
                SET 
                    payment_status = ?,
                    remarks = ?,
                    paid_at = CASE WHEN ? = 'paid' THEN NOW() ELSE paid_at END
                WHERE id = ?
            `;
            queryParams = [newStatus, newRemarks, newStatus, paymentId];
        }
        
        await connection.execute(updatePaymentQuery, queryParams);
        
        // Also update the corresponding order's payment_status if it exists
        if (orderId) {
            const updateOrderQuery = `
                UPDATE orders 
                SET payment_status = ?
                WHERE id = ?
            `;
            
            await connection.execute(updateOrderQuery, [newStatus, orderId]);
        }
        
        if (shouldUpdateAtomTxnId) {
            log(`✅ Updated payment ${paymentId} status to: ${newStatus} and set atom_transaction_id: ${atomTxnIdFromResponse}`);
        } else {
            log(`✅ Updated payment ${paymentId} status to: ${newStatus}`);
        }
    } finally {
        await connection.end();
    }
}

// ==========================================
// STATUS MAPPING FUNCTION
// ==========================================

function mapNDPSStatus(responseData) {
    // Default status
    let status = 'failed';
    let message = 'Unknown status';

    try {
        if (responseData.payInstrument && responseData.payInstrument.length > 0) {
            const payDetails = responseData.payInstrument[0];
            const responseDetails = payDetails.responseDetails;
            
            if (responseDetails) {
                const statusCode = responseDetails.statusCode;
                const statusMessage = responseDetails.message;
                
                // Map NDPS status codes according to official NDPS documentation
                // Reference: Official NDPS status codes provided by client
                switch (statusCode) {
                    // ✅ SUCCESS CASES - Map to 'paid' 
                    case 'OTS0000':
                        status = 'paid';
                        message = 'SUCCESS - Challan generated successfully / Transaction is successful';
                        log(`✅ Payment successful (OTS0000) for order`);
                        break;
                    case 'OTS0002':
                        status = 'paid';
                        message = 'SUCCESS - Transaction is force success';
                        log(`✅ Transaction force success (OTS0002) for order`);
                        break;

                    // 🟠 PENDING CASES - Map to 'pending' (Note: OTS0201 is PENDING, not FAILED)
                    case 'OTS0201':
                        status = 'pending';
                        message = 'PENDING - Transaction is timeout (will be rechecked)';
                        log(`🟠 Transaction timeout but PENDING (OTS0201) - will retry`);
                        break;
                    case 'OTS0301':
                        status = 'pending';
                        message = 'PENDING - Transaction is initialized';
                        break;
                    case 'OTS0351':
                        status = 'pending';
                        message = 'PENDING - Transaction is initiated';
                        break;
                    case 'OTS0551':
                        status = 'pending';
                        message = 'PENDING - Transaction is pending from bank';
                        break;

                    // 🔴 FAILED CASES - Map to 'failed' (Terminal states)
                    case 'OTS0001':
                        status = 'failed';
                        message = 'FAILED - Transaction is auto reversal';
                        break;
                    case 'OTS0101':
                        status = 'failed';
                        message = 'FAILED - Transaction is cancelled by user on payment page';
                        break;
                    case 'OTS0401':
                        status = 'failed';
                        message = 'FAILED - Data not found';
                        break;
                    case 'OTS0503':
                        status = 'failed';
                        message = 'FAILED - API name should not exceed 20 characters';
                        break;
                    case 'OTS0504':
                        status = 'failed';
                        message = 'FAILED - Please provide valid api name';
                        break;
                    case 'OTS0506':
                        status = 'failed';
                        message = 'FAILED - Signature Mismatched';
                        break;
                    case 'OTS0507':
                        status = 'failed';
                        message = 'FAILED - merchTxnDate should be in yyyy-MM-dd format';
                        break;
                    case 'OTS0508':
                        status = 'failed';
                        message = 'FAILED - Invalid Transaction Currency';
                        break;
                    case 'OTS0509':
                        status = 'failed';
                        message = 'FAILED - Invalid Transaction Amount';
                        break;
                    case 'OTS0510':
                        status = 'failed';
                        message = 'FAILED - Invalid Transaction Date';
                        break;
                    case 'OTS0522':
                        status = 'failed';
                        message = 'FAILED - Invalid Password';
                        break;
                    case 'OTS0600':
                        status = 'failed';
                        message = 'ABORTED/FAILED - Transaction is aborted / Transaction is failed';
                        break;
                    case 'OTS0951':
                        status = 'failed';
                        message = 'FAILED - Something went wrong';
                        break;

                    // Default for unknown codes
                    default:
                        status = 'failed';
                        message = statusMessage || `Unknown status code: ${statusCode}`;
                        log(`⚠️ Unknown NDPS status code: ${statusCode} - treating as FAILED`, 'WARN');
                }

                log(`📋 Status mapped: ${statusCode} → ${status.toUpperCase()} (${message})`);
            }
        }
    } catch (error) {
        log(`Status mapping error: ${error.message}`, 'ERROR');
    }

    return { status, message };
}

// ==========================================
// TEST FUNCTION (for manual testing)
// ==========================================

async function testWithKnownTransaction() {
    log('🧪 Testing NDPS API with known transaction data (hardcoded test)');
    
    // Use your specific transaction data
    const testTxnData = {
        atomTxnId: "11000384313621",
        merchTxnId: "NURSERY_2_muf600gu",
        amount: 3300.00,
        merchTxnDate: "2026-09-24"
    };
    
    try {
        log(`🎯 Testing with hardcoded transaction data:`);
        log(`  Atom Txn ID: ${testTxnData.atomTxnId}`);
        log(`  Merchant Txn ID: ${testTxnData.merchTxnId}`);
        log(`  Amount: ${testTxnData.amount}`);
        log(`  Date: ${testTxnData.merchTxnDate}`);
        
        const responseData = await queryPaymentStatus(testTxnData);
        const { status, message } = mapNDPSStatus(responseData);
        
        log(`✅ Test completed successfully!`);
        log(`📋 Final Status: ${status}`);
        log(`📋 Status Message: ${message}`);
        
        return { success: true, status, message, responseData };
        
    } catch (error) {
        log(`❌ Test failed: ${error.message}`, 'ERROR');
        return { success: false, error: error.message };
    }
}

async function testWithDatabasePayments() {
    log('🗄️ Testing NDPS API with actual database payments');
    
    try {
        // First, let's see what NDPS payments we have in total
        const connection = await createDbConnection();
        const [allNdpsPayments] = await connection.execute(`
            SELECT 
                id, payment_gateway, payment_status, merchant_transaction_id, atom_transaction_id, gateway_payment_id, amount, created_at
            FROM payments 
            WHERE payment_gateway = 'ndps' 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        await connection.end();
        
        log(`🔍 All NDPS payments in database (last 10):`);
        if (allNdpsPayments.length === 0) {
            log(`  ❌ No payments with payment_gateway = 'ndps' found!`);
            log(`  💡 Check if your payment gateway field has correct value`);
            return { success: false, error: 'No NDPS payments found' };
        }
        
        allNdpsPayments.forEach((payment, index) => {
            log(`  ${index + 1}. ID=${payment.id}, Status=${payment.payment_status}, Gateway=${payment.payment_gateway}`);
            log(`     Merchant ID=${payment.merchant_transaction_id || 'NULL'}, Atom ID=${payment.atom_transaction_id || 'NULL'}, Gateway ID=${payment.gateway_payment_id || 'NULL'}`);
            log(`     Amount=${payment.amount}, Created=${payment.created_at}`);
        });
        
        const pendingPayments = await getPendingPayments();
        log(`📊 Found ${pendingPayments.length} payments that can be processed`);
        
        if (pendingPayments.length === 0) {
            log(`ℹ️ No NDPS payments with transaction IDs found to test`);
            log(`💡 Issue: Most payments have NULL transaction IDs`);
            log(`💡 Solution: Either:`);
            log(`   1. Update existing payments to populate transaction ID fields`);
            log(`   2. Make new payments to get fresh transaction IDs`);
            log(`   3. Check why transaction IDs aren't being saved during payment`);
            return { success: true, message: 'No payments with transaction IDs to test' };
        }
        
        let successCount = 0;
        let errorCount = 0;
        let updatedCount = 0;

        // Test with first few payments (limit to 3 for testing)
        const paymentsToTest = pendingPayments.slice(0, 3);
        
        for (const payment of paymentsToTest) {
            try {
                log(`\n🔍 Testing payment ID ${payment.id}:`);
                log(`  Order ID: ${payment.order_id}`);
                log(`  Atom Txn ID: ${payment.atom_transaction_id || 'NULL'}`);
                log(`  Merchant Txn ID: ${payment.merchant_transaction_id || 'NULL'}`);
                log(`  Gateway Payment ID: ${payment.gateway_payment_id || 'NULL'}`);
                log(`  Amount: ${payment.amount}`);
                log(`  Current Status: ${payment.payment_status}`);
                
                // Use available transaction IDs properly - NDPS can find by merchant ID even with NULL atom ID
                const txnData = {
                    atomTxnId: payment.atom_transaction_id || null, // Use null if not available, don't make up IDs
                    merchTxnId: payment.merchant_transaction_id || payment.gateway_payment_id || `NURSERY_${payment.order_id}_${payment.id}`,
                    amount: parseFloat(payment.amount),
                    merchTxnDate: payment.order_created_at ? 
                        payment.order_created_at.toISOString().split('T')[0] : 
                        payment.created_at.toISOString().split('T')[0]
                };
                
                log(`  Using for API call: AtomID=${txnData.atomTxnId || 'NULL'}, MerchID=${txnData.merchTxnId}`);

                const responseData = await queryPaymentStatus(txnData);
                const { status, message } = mapNDPSStatus(responseData);
                
                // Only update if status has changed
                if (status !== payment.payment_status) {
                    await updatePaymentStatus(payment.id, payment.order_id, status, responseData, payment.atom_transaction_id);
                    updatedCount++;
                    log(`✅ Payment ${payment.id} status changed: ${payment.payment_status} -> ${status}`);
                } else {
                    log(`ℹ️ Payment ${payment.id} status unchanged: ${status}`);
                }
                
                successCount++;
                
                // Add delay between requests
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                log(`❌ Error testing payment ${payment.id}: ${error.message}`, 'ERROR');
                errorCount++;
                continue;
            }
        }
        
        log(`\n📊 Database test completed:`);
        log(`  ✅ Successful: ${successCount}`);
        log(`  ❌ Errors: ${errorCount}`);
        log(`  🔄 Updated: ${updatedCount}`);
        
        return { 
            success: true, 
            tested: paymentsToTest.length,
            successful: successCount, 
            errors: errorCount, 
            updated: updatedCount 
        };
        
    } catch (error) {
        log(`❌ Database test failed: ${error.message}`, 'ERROR');
        return { success: false, error: error.message };
    }
}

// ==========================================
// MAIN CRON FUNCTION
// ==========================================

async function updatePaymentStatuses() {
    log('Starting payment status update cron job');
    
    try {
        const pendingPayments = await getPendingPayments();
        log(`Found ${pendingPayments.length} payments to check`);
        
        let successCount = 0;
        let errorCount = 0;
        let updatedCount = 0;

        for (const payment of pendingPayments) {
            try {
                log(`Checking payment ${payment.id} - AtomTxnId: ${payment.atom_transaction_id || 'NULL'}`);
                
                const txnData = {
                    atomTxnId: payment.atom_transaction_id || null, // Use null instead of making up IDs
                    merchTxnId: payment.merchant_transaction_id,
                    amount: parseFloat(payment.amount),
                    merchTxnDate: payment.order_created_at ? 
                        payment.order_created_at.toISOString().split('T')[0] : 
                        payment.created_at.toISOString().split('T')[0] // YYYY-MM-DD format
                };

                const responseData = await queryPaymentStatus(txnData);
                const { status, message } = mapNDPSStatus(responseData);
                
                // Only update if status has changed
                if (status !== payment.payment_status) {
                    await updatePaymentStatus(payment.id, payment.order_id, status, responseData, payment.atom_transaction_id);
                    updatedCount++;
                    log(`Payment ${payment.id} status changed: ${payment.payment_status} -> ${status}`);
                } else {
                    // Update last checked time even if status hasn't changed
                    await updatePaymentStatus(payment.id, payment.order_id, status, responseData, payment.atom_transaction_id);
                    log(`Payment ${payment.id} status unchanged: ${status}`);
                }
                
                successCount++;
                
                // Add delay between requests to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                log(`Error checking payment ${payment.id}: ${error.message}`, 'ERROR');
                errorCount++;
                
                // Continue with next payment instead of stopping
                continue;
            }
        }
        
        log(`Payment status update completed: ${successCount} successful, ${errorCount} errors, ${updatedCount} updated`);
        
    } catch (error) {
        log(`Fatal error in payment status update: ${error.message}`, 'ERROR');
        throw error;
    }
}

// ==========================================
// SCRIPT EXECUTION
// ==========================================

if (require.main === module) {
    // Check command line arguments
    const args = process.argv.slice(2);
    const isTestMode = args.includes('--test') || args.includes('-t');
    const isDatabaseTest = args.includes('--db') || args.includes('--database');
    
    if (isTestMode && !isDatabaseTest) {
        // Test mode: use known hardcoded transaction data
        log('🧪 Running in TEST mode with hardcoded transaction data');
        testWithKnownTransaction()
            .then((result) => {
                if (result.success) {
                    log(`🎉 Hardcoded test completed successfully: Status = ${result.status || 'N/A'}`);
                    process.exit(0);
                } else {
                    log(`❌ Hardcoded test failed: ${result.error}`, 'ERROR');
                    process.exit(1);
                }
            })
            .catch((error) => {
                log(`💥 Hardcoded test crashed: ${error.message}`, 'ERROR');
                process.exit(1);
            });
    } else if (isDatabaseTest) {
        // Database test mode: use actual database payments
        log('🗄️ Running in DATABASE TEST mode - checking real payments');
        testWithDatabasePayments()
            .then((result) => {
                if (result.success) {
                    log(`🎉 Database test completed successfully: ${result.tested || 0} payments tested`);
                    process.exit(0);
                } else {
                    log(`❌ Database test failed: ${result.error}`, 'ERROR');
                    process.exit(1);
                }
            })
            .catch((error) => {
                log(`💥 Database test crashed: ${error.message}`, 'ERROR');
                process.exit(1);
            });
    } else {
        // Normal mode: check actual database payments (production cron job)
        log('🔄 Running in NORMAL mode - checking database payments');
        updatePaymentStatuses()
            .then(() => {
                log('Payment status update cron job completed successfully');
                process.exit(0);
            })
            .catch((error) => {
                log(`Payment status update cron job failed: ${error.message}`, 'ERROR');
                process.exit(1);
            });
    }
}

module.exports = {
    updatePaymentStatuses,
    queryPaymentStatus,
    createDbConnection
};