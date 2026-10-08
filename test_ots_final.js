const https = require('https');
const crypto = require('crypto');
 
const NDPS_CONFIG = {
    MERCHANT_ID: "856377",
    PASSWORD: "76ce2af2",
    PRODUCT_ID: "AWANT",
    // Keys for Encryption (AES/PBKDF2)
    REQ_ENCRYPTION_KEY: "74ABEA4102D67FD3491F23AB9D4636AB",
    RES_ENCRYPTION_KEY: "9B130849756D796521AC4DBEC26D3B2B",
    // Keys for Hashing (HMAC-SHA512)
    REQ_HASH_KEY: "27786aad29c63b6a3a",
    RES_HASH_KEY: "9f9153a2a8671ae683",
    OTS_URL: "https://payment1.atomtech.in/ots/payment/status"
};
 
const TRANSACTION_DATA = {
    atomTxnId: "11000384313621",
    merchTxnId: "NURSERY_2_muf600gu",
    amount: 3300.00,
    merchTxnDate: "2026-09-24"
};
 
// ==========================================
// CORRECTED CRYPTOGRAPHY FUNCTIONS
// ==========================================
function generateSignature(data) {
    // JSON.stringify drops the .00 for integer amounts (e.g. 1000.00 becomes 1000).
    // NDPS requires the hash to match EXACTLY what is passed in the JSON body.
    const amountStr = data.amount.toString();
    const hashString = `${NDPS_CONFIG.MERCHANT_ID}${NDPS_CONFIG.PASSWORD}${data.merchTxnId}${amountStr}${data.txnCurrency}TXNVERIFICATION`;
   
    console.log('\n🔐 Signature Generation Debug:');
    console.log(' Merchant ID:', NDPS_CONFIG.MERCHANT_ID);
    console.log(' Merchant Txn ID:', data.merchTxnId);
    console.log(' Amount:', amountStr);
    console.log(' Currency:', data.txnCurrency);
    console.log(' Hash String:', hashString);
   
    // NDPS requires HMAC-SHA512 using the Request Hash Key
    const hmac = crypto.createHmac('sha512', NDPS_CONFIG.REQ_HASH_KEY);
    hmac.update(hashString, 'utf8');
    const hash = hmac.digest('hex').toLowerCase();
   
    console.log(' Generated Signature:', hash);
    return hash;
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
        console.error('❌ Encryption error:', error);
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
        return null; // Will return null on "bad decrypt"
    }
}
 
// ==========================================
 
function createEncryptedPayload(txnData) {
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
    const jsonData = JSON.stringify(verificationData);
    return encryptAES256(jsonData, NDPS_CONFIG.REQ_ENCRYPTION_KEY);
}
 
function createExactPayloadStructure(txnData) {
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
 
    const flatData = {
        merchTxnId: txnData.merchTxnId,
        amount: txnData.amount,
        txnCurrency: "INR"
    };
   
    payInstrument.payDetails.signature = generateSignature(flatData);
    const fullPayload = { payInstrument };
   
    console.log('\n📄 Your Exact Payload Structure:');
    console.log(JSON.stringify(fullPayload, null, 2));
   
    const jsonData = JSON.stringify(fullPayload);
    const encData = encryptAES256(jsonData, NDPS_CONFIG.REQ_ENCRYPTION_KEY);
   
    console.log('🔐 Exact Encrypted Data Length:', encData.length);
    console.log('🔐 Exact Encrypted Data Preview:', encData.substring(0, 50) + '...');
   
    return encData;
}
 
async function testOTSRequestGET(encData) {
    console.log('\n🧪 === Testing: GET Request with Query Parameters ===');
    return new Promise((resolve, reject) => {
        const queryParams = new URLSearchParams({
            merchId: NDPS_CONFIG.MERCHANT_ID,
            encData: encData
        });
       
        const url = new URL(NDPS_CONFIG.OTS_URL);
        url.search = queryParams;
       
        console.log('🔍 Debug - GET Request URL:');
        console.log(' Base URL:', NDPS_CONFIG.OTS_URL);
        console.log(' Merchant ID:', NDPS_CONFIG.MERCHANT_ID);
        console.log(' encData length:', encData.length);
        console.log(' Full URL (truncated):', url.toString().substring(0, 150) + '...');
       
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
                console.log(`📡 Response Status: ${res.statusCode}`);
                if (res.statusCode === 200) console.log('✅ Server accepted request! (200 OK)');
               
                try {
                    // Try parsing as URL Search Params first because atom often returns that
                    let responseEncData;
                    if (data.includes('encData=')) {
                        const params = new URLSearchParams(data);
                        responseEncData = params.get('encData');
                    } else {
                        const jsonResponse = JSON.parse(data);
                        responseEncData = jsonResponse.encData;
                    }
 
                    if (responseEncData) {
                        console.log('\n🔓 Attempting to decrypt response...');
                        const decryptedData = decryptAES256(responseEncData, NDPS_CONFIG.RES_ENCRYPTION_KEY);
                       
                        if (decryptedData) {
                            console.log('🎉 Decrypted Response:\n', decryptedData);
                        } else {
                            console.log('❌ Decryption failed! NDPS uses a DIFFERENT Response Encryption Key for Production.');
                            console.log('ℹ️ Update NDPS_CONFIG.RES_ENCRYPTION_KEY with your Response Key.');
                        }
                    } else {
                        console.log('No encrypted data in response:', data);
                    }
                    resolve({ status: res.statusCode });
                } catch (e) {
                    resolve({ status: res.statusCode, rawResponse: data });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}
 
async function testOTSRequest(encData, format) {
    console.log(`\n🧪 === Testing POST: ${format.name} ===`);
    return new Promise((resolve, reject) => {
        // If the format expects merchId explicitly, add it
        const postData = format.createPostData(encData);
       
        console.log('🔍 Debug - Actual Post Data:');
        console.log(' Length:', postData.length);
        console.log(' First 100 chars:', postData.substring(0, 100) + '...');
       
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
       
        console.log('📤 Content-Type:', format.contentType);
       
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`📡 Response Status: ${res.statusCode}`);
                console.log('📄 Raw Response Body:', data.substring(0, 300) + (data.length > 300 ? '...' : ''));
                if (res.statusCode === 200) console.log('✅ Server accepted request! (200 OK)');
                resolve({ status: res.statusCode });
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}
 
async function main() {
    console.log('🚀 OTS Transaction Verification - Running with Correct Crypto');
    console.log('=========================================================');
   
    const exactEncData = createExactPayloadStructure(TRANSACTION_DATA);
   
    const testCases = [
        {
            name: 'Your Exact JSON Structure',
            encData: exactEncData,
            description: 'Using the exact payInstrument structure from your JSON'
        }
    ];
 
    // TEST GET METHOD
    for (const testCase of testCases) {
        try {
            await testOTSRequestGET(testCase.encData);
        } catch (error) {
            console.error(`❌ GET test failed:`, error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
 
    // TEST POST METHOD (The officially supported method)
    console.log('\n📦 === FALLBACK: Trying POST Methods ===');
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
                await testOTSRequest(testCase.encData, formats[i]);
            } catch (error) {
                console.error(`❌ Test POST failed:`, error.message);
            }
        }
    }
}
 
main();