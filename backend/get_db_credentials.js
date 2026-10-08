#!/usr/bin/env node

const mysql = require('mysql2/promise');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔍 Checking current database configuration...\n');

console.log('Environment variables loaded:');
console.log(`MYSQL_HOST: ${process.env.MYSQL_HOST}`);
console.log(`MYSQL_USER: ${process.env.MYSQL_USER}`);
console.log(`MYSQL_PASSWORD: ${process.env.MYSQL_PASSWORD ? '***hidden***' : '(empty)'}`);
console.log(`MYSQL_DATABASE: ${process.env.MYSQL_DATABASE}\n`);

async function testMainAppConnection() {
    console.log('🧪 Testing main application database connection...');
    
    try {
        // Use the same configuration as db.js
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST || "localhost",
            port: Number(process.env.MYSQL_PORT || 3306),
            database: process.env.MYSQL_DATABASE || "nursery_management",
            user: process.env.MYSQL_USER || "root",
            password: process.env.MYSQL_PASSWORD || ""
        });
        
        console.log('✅ Database connection successful!');
        
        // Check if orders table exists and get some basic info
        try {
            const [tables] = await connection.execute("SHOW TABLES LIKE 'orders'");
            if (tables.length > 0) {
                console.log('✅ Orders table found');
                
                const [orderCount] = await connection.execute('SELECT COUNT(*) as count FROM orders');
                console.log(`📊 Total orders in database: ${orderCount[0].count}`);
                
                const [pendingOrders] = await connection.execute(`
                    SELECT COUNT(*) as count 
                    FROM orders 
                    WHERE payment_status IN ('pending', 'failed', 'processing')
                      AND atom_txn_id IS NOT NULL 
                      AND atom_txn_id != ''
                `);
                console.log(`🟡 Pending/failed orders to check: ${pendingOrders[0].count}`);
                
                // Check if ndps_response column exists
                const [columns] = await connection.execute(`
                    SHOW COLUMNS FROM orders LIKE 'ndps_response'
                `);
                
                if (columns.length > 0) {
                    console.log('✅ ndps_response column exists');
                } else {
                    console.log('⚠️  ndps_response column NOT found - may need to add it');
                }
                
            } else {
                console.log('❌ Orders table not found');
            }
        } catch (queryError) {
            console.log(`⚠️  Error querying database: ${queryError.message}`);
        }
        
        await connection.end();
        return true;
        
    } catch (error) {
        console.log(`❌ Database connection failed: ${error.message}`);
        return false;
    }
}

async function main() {
    const success = await testMainAppConnection();
    
    if (success) {
        console.log('\n🎉 GOOD NEWS: Database credentials are correct!');
        console.log('📋 The cron script should now work with the updated configuration.');
        console.log('\n🚀 Next steps:');
        console.log('1. Upload the updated cron script to your server');
        console.log('2. Test it manually: /opt/cpanel/ea-nodejs22/bin/node cron/payment_status_updater.js');
        console.log('3. Check the cron logs: tail -f logs/payment_status_cron.log');
    } else {
        console.log('\n❌ Database connection failed');
        console.log('📋 You need to update the .env file with correct database credentials.');
        console.log('💡 Check cPanel → MySQL Databases for:');
        console.log('   - Database name (likely: awantikaseeds_nursery)');
        console.log('   - Database user (likely: awantikaseeds_dbuser)');
        console.log('   - Database password');
    }
}

main().catch(console.error);