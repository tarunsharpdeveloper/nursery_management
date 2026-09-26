/**
 * Get Recent Transaction IDs
 * Simple script to find merchant transaction IDs for status checking
 */

const mysql = require('mysql2/promise');

async function getRecentTransactions() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'nursery_management'
  });

  try {
    console.log('=== RECENT TRANSACTIONS ===\n');

    const [rows] = await pool.query(`
      SELECT 
        p.id,
        p.gateway_payment_id as merchant_txn_id,
        p.merchant_transaction_id,
        p.atom_transaction_id,
        p.payment_status,
        p.amount,
        o.order_number,
        p.created_at,
        DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') as merch_txn_date
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE p.payment_gateway = 'ndps'
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    if (rows.length === 0) {
      console.log('No NDPS payments found');
      return;
    }

    console.log('Recent NDPS transactions:\n');
    rows.forEach((row, index) => {
      const txnId = row.merchant_txn_id || row.merchant_transaction_id;
      const atomTxnId = row.atom_transaction_id || 'null';
      
      console.log(`${index + 1}. Payment ID: ${row.id}`);
      console.log(`   Order: ${row.order_number}`);
      console.log(`   Merchant Txn ID: ${txnId || 'NOT SET'}`);
      console.log(`   Atom Txn ID: ${atomTxnId}`);
      console.log(`   Status: ${row.payment_status}`);
      console.log(`   Amount: ₹${row.amount}`);
      console.log(`   Date: ${row.created_at}`);
      
      if (txnId) {
        const checkCommand = `node check_payment_status.js ${txnId} ${atomTxnId} ${row.amount} "${row.merch_txn_date}"`;
        console.log(`   \n   ✅ Check status:\n   ${checkCommand}\n`);
      } else {
        console.log(`   ⚠️  No transaction ID - payment not sent to NDPS yet\n`);
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

getRecentTransactions();
