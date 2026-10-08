const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function checkNDPSResponseColumn() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nursery_db'
    });

    try {
        console.log('🔍 Checking NDPS Response Column Status...\n');
        
        // 1. Check if ndps_response column exists
        console.log('1. Checking if ndps_response column exists:');
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' 
            AND COLUMN_NAME IN ('ndps_response', 'status_last_checked')
            ORDER BY COLUMN_NAME
        `, [process.env.DB_NAME]);
        
        if (columns.length > 0) {
            console.log('✅ Found columns:');
            columns.forEach(col => {
                console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE}, Nullable: ${col.IS_NULLABLE}, Default: ${col.COLUMN_DEFAULT}`);
            });
        } else {
            console.log('❌ ndps_response and status_last_checked columns NOT found!');
            console.log('   Run the migration: node backend/run_simple_migration.js database/add_payment_status_tracking.sql\n');
        }

        // 2. Check sample data
        console.log('\n2. Checking sample orders with NDPS data:');
        const [orders] = await connection.execute(`
            SELECT id, order_number, payment_status, atom_txn_id, merch_txn_id, 
                   status_last_checked,
                   CASE 
                       WHEN ndps_response IS NULL THEN 'NULL'
                       WHEN ndps_response = '' THEN 'EMPTY'
                       WHEN LENGTH(ndps_response) > 100 THEN CONCAT(LEFT(ndps_response, 100), '...')
                       ELSE ndps_response
                   END as ndps_response_sample
            FROM orders 
            WHERE atom_txn_id IS NOT NULL AND atom_txn_id != ''
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        if (orders.length > 0) {
            console.log('📋 Recent orders with Atom Transaction IDs:');
            orders.forEach(order => {
                console.log(`   Order ${order.order_number}:`);
                console.log(`     - Payment Status: ${order.payment_status}`);
                console.log(`     - Atom ID: ${order.atom_txn_id}`);
                console.log(`     - NDPS Response: ${order.ndps_response_sample}`);
                console.log(`     - Last Checked: ${order.status_last_checked || 'Never'}`);
                console.log('');
            });
        } else {
            console.log('❌ No orders found with Atom Transaction IDs');
        }

        // 3. Check overall statistics
        console.log('3. NDPS Response Statistics:');
        const [stats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_orders,
                COUNT(CASE WHEN atom_txn_id IS NOT NULL AND atom_txn_id != '' THEN 1 END) as with_atom_id,
                COUNT(CASE WHEN ndps_response IS NOT NULL AND ndps_response != '' THEN 1 END) as with_ndps_response,
                COUNT(CASE WHEN status_last_checked IS NOT NULL THEN 1 END) as checked_orders
            FROM orders
        `);

        const stat = stats[0];
        console.log(`   - Total Orders: ${stat.total_orders}`);
        console.log(`   - With Atom ID: ${stat.with_atom_id}`);
        console.log(`   - With NDPS Response: ${stat.with_ndps_response}`);
        console.log(`   - Previously Checked: ${stat.checked_orders}`);

        // 4. Check payment status distribution
        console.log('\n4. Payment Status Distribution:');
        const [statusDist] = await connection.execute(`
            SELECT payment_status, COUNT(*) as count
            FROM orders
            WHERE atom_txn_id IS NOT NULL AND atom_txn_id != ''
            GROUP BY payment_status
            ORDER BY count DESC
        `);

        statusDist.forEach(status => {
            console.log(`   - ${status.payment_status}: ${status.count} orders`);
        });

        // 5. Test if admin-data query works
        console.log('\n5. Testing admin-data.js query:');
        try {
            const [testQuery] = await connection.execute(`
                SELECT o.id, o.order_number, c.name AS customer, o.status, o.payment_status, 
                       o.total_amount, o.created_at, p.merchant_transaction_id, p.atom_transaction_id, 
                       o.ndps_response, GROUP_CONCAT(prod.name SEPARATOR ', ') AS products 
                FROM orders o 
                JOIN customers c ON c.id = o.customer_id 
                LEFT JOIN payments p ON p.order_id = o.id AND p.payment_gateway = 'ndps' 
                LEFT JOIN order_items oi ON oi.order_id = o.id 
                LEFT JOIN products prod ON prod.id = oi.product_id 
                WHERE o.is_deleted = 0 AND o.atom_txn_id IS NOT NULL
                GROUP BY o.id 
                ORDER BY o.created_at DESC 
                LIMIT 3
            `);
            
            console.log('✅ Admin query works! Sample results:');
            testQuery.forEach(order => {
                console.log(`   - ${order.order_number}: ndps_response = ${order.ndps_response ? 'HAS DATA' : 'NULL'}`);
            });
        } catch (queryError) {
            console.log('❌ Admin query failed:', queryError.message);
        }

    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    } finally {
        await connection.end();
    }
}

checkNDPSResponseColumn().catch(console.error);