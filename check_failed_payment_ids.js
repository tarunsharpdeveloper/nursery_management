/**
 * Check Failed Payments - Verify Transaction IDs are Stored
 * 
 * This script checks if merchant_transaction_id and atom_transaction_id
 * are being stored even when payments fail.
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function checkFailedPayments() {
  console.log('=== Checking Failed Payment Transaction IDs ===\n');

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'nursery_management',
    port: process.env.MYSQL_PORT || 3306
  });

  try {
    // Query failed payments
    const [failedPayments] = await connection.query(`
      SELECT 
        p.id,
        p.order_id,
        o.order_number,
        p.payment_status,
        p.amount,
        p.merchant_transaction_id,
        p.atom_transaction_id,
        p.remarks,
        p.created_at
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE p.payment_status = 'failed'
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    if (failedPayments.length === 0) {
      console.log('✅ No failed payments found in database');
      console.log('   (This is good - no failures yet!)');
      return;
    }

    console.log(`Found ${failedPayments.length} failed payment(s):\n`);

    failedPayments.forEach((payment, index) => {
      console.log(`─────────────────────────────────────────────────────────────`);
      console.log(`Payment #${index + 1}:`);
      console.log(`  Database ID: ${payment.id}`);
      console.log(`  Order ID: ${payment.order_id}`);
      console.log(`  Order Number: ${payment.order_number || 'N/A'}`);
      console.log(`  Payment Status: ${payment.payment_status}`);
      console.log(`  Amount: ₹${payment.amount}`);
      console.log(`  Created At: ${payment.created_at}`);
      console.log();
      
      // Check Merchant Transaction ID
      if (payment.merchant_transaction_id) {
        console.log(`  ✅ Merchant Txn ID: ${payment.merchant_transaction_id}`);
      } else {
        console.log(`  ❌ Merchant Txn ID: NOT STORED (This is unusual!)`);
      }

      // Check Atom Transaction ID
      if (payment.atom_transaction_id) {
        console.log(`  ✅ Atom Txn ID: ${payment.atom_transaction_id}`);
        console.log(`     (Payment reached NDPS gateway)`);
      } else {
        console.log(`  ⚠️  Atom Txn ID: NULL`);
        console.log(`     (User likely cancelled before selecting payment method)`);
      }

      console.log();
      console.log(`  Remarks: ${payment.remarks}`);
      console.log();
    });

    console.log(`─────────────────────────────────────────────────────────────`);
    console.log();

    // Summary statistics
    const withAtomId = failedPayments.filter(p => p.atom_transaction_id).length;
    const withoutAtomId = failedPayments.filter(p => !p.atom_transaction_id).length;
    const allHaveMerchId = failedPayments.every(p => p.merchant_transaction_id);

    console.log('📊 Summary:');
    console.log(`   Total failed payments: ${failedPayments.length}`);
    console.log(`   With Atom Txn ID: ${withAtomId} (reached payment gateway)`);
    console.log(`   Without Atom Txn ID: ${withoutAtomId} (cancelled early)`);
    console.log(`   All have Merchant Txn ID: ${allHaveMerchId ? '✅ YES' : '❌ NO'}`);
    console.log();

    if (allHaveMerchId) {
      console.log('✅ Merchant Transaction IDs are being stored correctly!');
    } else {
      console.log('⚠️  Some payments missing Merchant Transaction ID - check your code');
    }

    if (withAtomId > 0) {
      console.log('✅ Atom Transaction IDs are being stored when available!');
    }

    if (withoutAtomId > 0) {
      console.log('✅ System correctly handles cases where Atom ID is not available');
    }

  } catch (error) {
    console.error('❌ Error checking failed payments:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

// Run the check
checkFailedPayments().catch(console.error);
