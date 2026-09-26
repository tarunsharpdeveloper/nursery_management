/**
 * Diagnostic Script: Check Failed Payment Details
 * 
 * This script helps diagnose why a payment was deducted but marked as failed
 * 
 * Usage: node diagnose_failed_payment.js
 */

require('dotenv').config({ path: './backend/.env' });
const mysql = require('mysql2/promise');

async function diagnoseFailedPayment() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'nursery_management'
  });

  try {
    console.log('=== DIAGNOSING FAILED PAYMENT ===\n');

    // Get the most recent payment
    const [payments] = await pool.query(`
      SELECT 
        p.*,
        o.order_number,
        o.customer_name,
        o.payment_status as order_payment_status
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    if (payments.length === 0) {
      console.log('❌ No payments found in database');
      return;
    }

    console.log(`Found ${payments.length} recent payment(s):\n`);

    payments.forEach((payment, index) => {
      console.log(`\n━━━ PAYMENT #${index + 1} ━━━`);
      console.log(`Payment ID: ${payment.id}`);
      console.log(`Order Number: ${payment.order_number}`);
      console.log(`Customer: ${payment.customer_name}`);
      console.log(`Amount: ₹${payment.amount}`);
      console.log(`Gateway: ${payment.payment_gateway}`);
      console.log(`Payment Status: ${payment.payment_status}`);
      console.log(`Order Payment Status: ${payment.order_payment_status}`);
      console.log(`Created: ${payment.created_at}`);
      console.log(`Paid At: ${payment.paid_at || 'NOT PAID'}`);
      console.log(`\nTransaction Details:`);
      console.log(`  Gateway Payment ID: ${payment.gateway_payment_id || 'NOT SET'}`);
      console.log(`  Merchant Txn ID: ${payment.merchant_transaction_id || 'NOT SET'}`);
      console.log(`  Atom Txn ID: ${payment.atom_transaction_id || 'NOT SET'}`);
      console.log(`  Remarks: ${payment.remarks || 'NONE'}`);

      // Analyze the issue
      console.log(`\n🔍 Analysis:`);
      if (payment.payment_status === 'failed' && payment.merchant_transaction_id) {
        console.log('⚠️  Payment marked as FAILED but has transaction ID');
        console.log('   This suggests backend received the callback but marked it as failed');
        console.log('   Check remarks for status code');
      } else if (payment.payment_status === 'pending' && !payment.merchant_transaction_id) {
        console.log('⚠️  Payment still PENDING with no transaction IDs');
        console.log('   This suggests backend never received the NDPS callback');
        console.log('   Possible causes:');
        console.log('   1. NDPS callback URL incorrect');
        console.log('   2. Backend route not configured');
        console.log('   3. NDPS couldn\'t reach your server');
      } else if (payment.payment_status === 'paid') {
        console.log('✅ Payment marked as PAID successfully');
      } else if (payment.payment_status === 'pending') {
        console.log('⏳ Payment still PENDING - waiting for callback');
      }
    });

    // Check configuration
    console.log(`\n\n=== BACKEND CONFIGURATION ===`);
    console.log(`NDPS Return URL: ${process.env.NDPS_RETURN_URL}`);
    console.log(`NDPS Response URL: ${process.env.NDPS_RESPONSE_URL}`);
    console.log(`Merchant ID: ${process.env.NDPS_MERCH_ID}`);

    console.log(`\n\n=== NEXT STEPS ===`);
    console.log(`1. Check PM2 logs: pm2 logs nursery-backend --lines 200`);
    console.log(`2. Look for "NDPS Popup Response Handler" in logs`);
    console.log(`3. Check if backend received the POST callback from NDPS`);
    console.log(`4. If no logs, NDPS couldn't reach your backend`);
    console.log(`5. Verify route: POST ${process.env.NDPS_RETURN_URL} is configured in backend/app.js`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

diagnoseFailedPayment();
