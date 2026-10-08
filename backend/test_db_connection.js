#!/usr/bin/env node

const mysql = require('mysql2/promise');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Test different database configurations
const configs = [
    {
        name: "Current DB_ config",
        config: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        }
    },
    {
        name: "MYSQL_ config", 
        config: {
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        }
    },
    {
        name: "Likely cPanel config (awantikaseeds_nursery)",
        config: {
            host: 'localhost',
            user: 'awantikaseeds_nursery',
            password: '', // Will need to be filled in
            database: 'awantikaseeds_nursery'
        }
    }
];

async function testConnection(name, config) {
    console.log(`\n=== Testing: ${name} ===`);
    console.log('Config:', JSON.stringify({
        ...config,
        password: config.password ? '***hidden***' : '(empty)'
    }, null, 2));
    
    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ CONNECTION SUCCESSFUL!');
        
        // Test a simple query
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM orders');
        console.log(`✅ Query successful - Found ${rows[0].count} orders`);
        
        await connection.end();
        return true;
    } catch (error) {
        console.log(`❌ CONNECTION FAILED: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🔍 Testing database connections...\n');
    
    for (const { name, config } of configs) {
        const success = await testConnection(name, config);
        if (success) {
            console.log(`\n🎉 WORKING CONFIG FOUND: ${name}`);
            break;
        }
    }
    
    console.log('\n📋 INSTRUCTIONS:');
    console.log('1. Check cPanel → MySQL Databases for actual database credentials');
    console.log('2. Look for database name like: awantikaseeds_nursery or similar');
    console.log('3. Check database users - likely: awantikaseeds_dbuser or similar');
    console.log('4. Update .env file with correct DB_* variables');
    console.log('5. Re-run this test script to verify connection');
}

main().catch(console.error);