/**
 * Quick Transaction Check
 */

const mysql = require('mysql2/promise');

async function quickCheck() {
  const merchantTxnId = 'NURSERY_1_muf5omz1';
  const atomTxnId = '11000384309894';

  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'nursery_management'
  });

  try {
    console.log('Searching for transaction...\n');

    const [rows] = await pool.query(`
      SELECT 
        p.id,
        p.order_id,
        p.payment_status,
        p.amount,
        p.merchant_transaction_id,
        p.atom_transaction_id,
        p.gateway_payment_id,
        p.remarks,
        DATE_FORMAT(p.created_at, '%Y-%m-%d') as date,
        o.order_number
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE p.merchant_transaction_id = ? 
         OR p.atom_transaction_id = ?
         OR p.gateway_payment_id = ?
    `, [merchantTxnId, atomTxnId, merchantTxnId]);

    if (rows.length === 0) {
      console.log('❌ Transaction not found in database\n');
      return;
    }

    const p = rows[0];
    console.log('✅ FOUND IN DATABASE:\n');
    console.log(`Payment ID: ${p.id}`);
    console.log(`Order: ${p.order_number}`);
    console.log(`Status: ${p.payment_status}`);
    console.log(`Amount: ₹${p.amount}`);
    console.log(`Merchant ID: ${p.merchant_transaction_id || p.gateway_payment_id}`);
    console.log(`Atom ID: ${p.atom_transaction_id || 'NOT SET'}`);
    console.log(`Date: ${p.date}`);
    console.log(`Remarks: ${p.remarks || 'NONE'}\n`);

    const merchId = p.merchant_transaction_id || p.gateway_payment_id;
    const atomId = p.atom_transaction_id || atomTxnId;
    
    console.log('To check with NDPS, run:');
    console.log(`node check_payment_status.js ${merchId} ${atomId} ${p.amount} "${p.date}"`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

quickCheck();
