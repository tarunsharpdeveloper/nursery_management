
const crypto = require('crypto');
const { pool } = require('../db');

// NDPS Configuration
const NDPS_CONFIG = {
  UAT: {
    merchId: process.env.NDPS_MERCH_ID || "446442",
    userId: process.env.NDPS_USER_ID || "",
    password: process.env.NDPS_PASSWORD || "Test@123",
    apiUrl: process.env.NDPS_API_URL || "https://caller.atomtech.in/ots/aipay/auth",
    responseKey: process.env.NDPS_RESPONSE_KEY || "75AEF0FA1B94B3C10D4F5B268F757F11",
    responseSalt: process.env.NDPS_RESPONSE_KEY || "75AEF0FA1B94B3C10D4F5B268F757F11",
    requestKey: process.env.NDPS_REQUEST_KEY || "A4476C2062FFA58980DC8F79EB6A799E",
    requestSalt: process.env.NDPS_REQUEST_KEY || "A4476C2062FFA58980DC8F79EB6A799E",
    version: "OTSv1.1",
    platform: "FLASH"
  },
  PROD: {
    merchId: process.env.NDPS_MERCH_ID || "856377",
    userId: process.env.NDPS_USER_ID || "856377",
    password: process.env.NDPS_PASSWORD || "856377_titan@123",
    apiUrl: process.env.NDPS_API_URL || "https://payment1.atomtech.in/ots/aipay/auth",
    responseKey: process.env.NDPS_RESPONSE_KEY || "9B130849756D796521AC4DBEC26D3B2B",
    responseSalt: process.env.NDPS_RESPONSE_KEY || "9B130849756D796521AC4DBEC26D3B2B",
    requestKey: process.env.NDPS_REQUEST_KEY || "74ABEA4102D67FD3491F23AB9D4636AB",
    requestSalt: process.env.NDPS_REQUEST_KEY || "74ABEA4102D67FD3491F23AB9D4636AB",
    version: "OTSv1.1",
    platform: "FLASH"
  }
};

const isProduction = process.env.NODE_ENV === 'production';
const config = isProduction ? NDPS_CONFIG.PROD : NDPS_CONFIG.UAT;

// AES-256-CBC Configuration
const algorithm = 'aes-256-cbc';
const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 'utf8');

/**
 * Encrypt data using AES-256-CBC with PBKDF2
 */
function encryptData(data) {
  try {
    const password = Buffer.from(config.requestKey, 'utf8');
    const salt = Buffer.from(config.requestSalt, 'utf8');
    const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
    const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
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
 * Query NDPS for transaction status
 */
async function queryNDPSStatus(merchTxnId) {
  try {
    const requeryPayload = {
      payInstrument: {
        headDetails: {
          version: config.version,
          api: "STATUS",
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
    const encryptedData = encryptData(payloadData);
    const formBody = `encData=${encryptedData}&merchId=${config.merchId}`;

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: formBody
    });

    const responseText = await response.text();

    // Check if UAT returns welcome message (API not available)
    if (responseText.includes('Welcome') || !responseText || responseText.length < 50) {
      return null; // API not available in UAT
    }

    // Parse encrypted response
    let encryptedResponse;
    if (responseText.includes('encData=')) {
      const parts = responseText.split('&');
      for (const part of parts) {
        if (part.startsWith('encData=')) {
          encryptedResponse = part.substring(8);
          break;
        }
      }
    } else if (responseText.length > 50 && !responseText.includes('<')) {
      encryptedResponse = responseText.trim();
    }

    if (!encryptedResponse) {
      return null;
    }

    // Decrypt and parse response
    const decryptedResponse = decryptData(encryptedResponse);
    const responseData = JSON.parse(decryptedResponse);

    if (!responseData.payInstrument || !Array.isArray(responseData.payInstrument) || responseData.payInstrument.length === 0) {
      return null;
    }

    const transaction = responseData.payInstrument[0];
    const statusCode = transaction.responseDetails?.statusCode;

    // Map status code to payment status
    let paymentStatus = 'pending';
    if (statusCode === 'OTS0000') {
      paymentStatus = 'paid';
    } else if (statusCode && statusCode !== 'OTS0000' && statusCode !== 'OTS0001') {
      paymentStatus = 'failed';
    }

    return {
      statusCode,
      statusMessage: transaction.responseDetails?.message,
      atomTxnId: transaction.payDetails?.atomTxnId,
      paymentStatus
    };
  } catch (error) {
    console.error(`Error querying NDPS for ${merchTxnId}:`, error.message);
    return null;
  }
}

/**
 * Check pending payments and update their status
 */
async function checkPendingPayments() {
  const startTime = Date.now();
  console.log('=== Payment Status Checker Started ===');
  console.log('Time:', new Date().toISOString());
  console.log('Environment:', isProduction ? 'PRODUCTION' : 'UAT');

  try {
    // Find all pending payments older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const [pendingPayments] = await pool.query(
      `SELECT p.*, o.order_number 
       FROM payments p
       LEFT JOIN orders o ON o.id = p.order_id
       WHERE p.payment_status = 'pending' 
         AND p.payment_gateway = 'ndps'
         AND p.gateway_payment_id IS NOT NULL
         AND p.created_at < ?
       ORDER BY p.created_at ASC
       LIMIT 50`,
      [fiveMinutesAgo]
    );

    console.log(`Found ${pendingPayments.length} pending payment(s) to check`);

    if (pendingPayments.length === 0) {
      console.log('✅ No pending payments to process');
      console.log('=== Payment Status Checker Completed ===\n');
      return {
        success: true,
        checked: 0,
        updated: 0,
        failed: 0,
        duration: Date.now() - startTime
      };
    }

    let updatedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const payment of pendingPayments) {
      const merchTxnId = payment.gateway_payment_id;
      const paymentId = payment.id;
      const orderId = payment.order_id;
      const orderNumber = payment.order_number || 'N/A';

      console.log(`\n--- Checking Payment #${paymentId} ---`);
      console.log(`Order: ${orderNumber} (ID: ${orderId})`);
      console.log(`Merchant Txn: ${merchTxnId}`);
      console.log(`Created: ${payment.created_at}`);

      try {
        // Query NDPS for status
        const ndpsStatus = await queryNDPSStatus(merchTxnId);

        if (!ndpsStatus) {
          console.log('⏭️  Skipped (NDPS API not available or transaction not found)');
          skippedCount++;
          continue;
        }

        console.log(`Status Code: ${ndpsStatus.statusCode}`);
        console.log(`Status: ${ndpsStatus.paymentStatus}`);
        console.log(`Message: ${ndpsStatus.statusMessage}`);

        // If status changed, update database
        if (ndpsStatus.paymentStatus !== 'pending') {
          await pool.query(
            `UPDATE payments 
             SET payment_status = ?,
                 paid_at = CASE WHEN ? = 'paid' THEN NOW() ELSE paid_at END,
                 atom_transaction_id = ?,
                 remarks = CONCAT(COALESCE(remarks, ''), ' | Cron update: ', ?)
             WHERE id = ?`,
            [
              ndpsStatus.paymentStatus,
              ndpsStatus.paymentStatus,
              ndpsStatus.atomTxnId || null,
              `${ndpsStatus.statusCode} - ${ndpsStatus.statusMessage}`,
              paymentId
            ]
          );

          // Update order status
          if (orderId) {
            await pool.query(
              'UPDATE orders SET payment_status = ? WHERE id = ?',
              [ndpsStatus.paymentStatus, orderId]
            );
          }

          updatedCount++;
          console.log(`✅ Updated to: ${ndpsStatus.paymentStatus}`);
        } else {
          console.log('⏳ Still pending');
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to check payment #${paymentId}:`, error.message);
        failedCount++;
      }

      // Rate limiting: wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const duration = Date.now() - startTime;
    console.log('\n=== Payment Status Checker Completed ===');
    console.log(`Total Checked: ${pendingPayments.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log(`Duration: ${duration}ms`);
    console.log('=======================================\n');

    return {
      success: true,
      checked: pendingPayments.length,
      updated: updatedCount,
      skipped: skippedCount,
      failed: failedCount,
      duration
    };
  } catch (error) {
    console.error('❌ Payment checker error:', error);
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

/**
 * Mark very old pending payments as expired
 */
async function markExpiredPayments() {
  try {
    // Mark payments older than 24 hours as failed
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [result] = await pool.query(
      `UPDATE payments 
       SET payment_status = 'failed',
           remarks = CONCAT(COALESCE(remarks, ''), ' | Auto-marked as failed: Payment expired after 24 hours')
       WHERE payment_status = 'pending'
         AND created_at < ?`,
      [oneDayAgo]
    );

    if (result.affectedRows > 0) {
      console.log(`⏰ Marked ${result.affectedRows} expired payment(s) as failed`);
      
      // Update corresponding orders
      await pool.query(
        `UPDATE orders o
         INNER JOIN payments p ON p.order_id = o.id
         SET o.payment_status = 'failed'
         WHERE p.payment_status = 'failed'
           AND p.remarks LIKE '%expired after 24 hours%'
           AND o.payment_status = 'pending'`
      );
    }
  } catch (error) {
    console.error('Error marking expired payments:', error);
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Check and update pending payments
    await checkPendingPayments();
    
    // Mark very old payments as expired
    await markExpiredPayments();
    
  } catch (error) {
    console.error('Fatal error in payment checker:', error);
  } finally {
    // Close database connection if running standalone
    if (require.main === module) {
      await pool.end();
      process.exit(0);
    }
  }
}

// Export for use in other modules or run standalone
if (require.main === module) {
  // Running as standalone script
  main();
} else {
  // Imported as module
  module.exports = {
    checkPendingPayments,
    markExpiredPayments,
    main
  };
}
