#!/usr/bin/env node

/**
 * NDPS Database Migration Script for Payments Table
 * Adds required NDPS columns to payments table for payment status tracking
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Database configuration
const DB_CONFIG = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'nursery_management',
    multipleStatements: true // Allow multiple SQL statements
};

async function runMigration() {
    let connection;
    
    try {
        console.log('🔗 Connecting to database...');
        console.log(`Host: ${DB_CONFIG.host}`);
        console.log(`Database: ${DB_CONFIG.database}`);
        console.log(`User: ${DB_CONFIG.user}`);
        
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database successfully');
        
        // Read migration SQL file
        const migrationFile = path.join(__dirname, 'database', 'add_ndps_tracking_to_payments.sql');
        console.log(`📄 Reading migration file: ${migrationFile}`);
        
        if (!fs.existsSync(migrationFile)) {
            throw new Error(`Migration file not found: ${migrationFile}`);
        }
        
        const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
        console.log('📄 Migration file read successfully');
        
        // Execute migration
        console.log('🔄 Running NDPS payments table migration...');
        const [results] = await connection.execute(migrationSQL);
        console.log('✅ Migration completed successfully');
        
        // Verify the migration by checking table structure
        console.log('\n📋 Verifying migration - checking payments table structure...');
        const [columns] = await connection.execute('DESCRIBE payments');
        
        const requiredColumns = ['merchant_transaction_id', 'atom_transaction_id'];
        const existingColumns = columns.map(col => col.Field);
        
        console.log('\n🔍 Required NDPS columns check:');
        for (const col of requiredColumns) {
            const exists = existingColumns.includes(col);
            console.log(`  ${exists ? '✅' : '❌'} ${col}: ${exists ? 'EXISTS' : 'MISSING'}`);
        }
        
        // Show current payments status
        console.log('\n📊 Current payments status distribution:');
        const [statusResults] = await connection.execute(`
            SELECT 
                payment_gateway,
                payment_status,
                COUNT(*) as total_payments,
                COUNT(CASE WHEN merchant_transaction_id IS NOT NULL AND merchant_transaction_id != '' THEN 1 END) as with_merchant_id,
                COUNT(CASE WHEN atom_transaction_id IS NOT NULL AND atom_transaction_id != '' THEN 1 END) as with_atom_id
            FROM payments 
            GROUP BY payment_gateway, payment_status
            ORDER BY payment_gateway, total_payments DESC
        `);
        
        if (statusResults.length > 0) {
            console.table(statusResults);
        } else {
            console.log('  No payments found in database');
        }
        
        console.log('\n🎉 NDPS payments migration completed successfully!');
        console.log('🔄 The payment status cron job should now work correctly.');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Check your database credentials in .env file');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('💡 Check if MySQL server is running');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('💡 Check if database name is correct');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the migration
if (require.main === module) {
    console.log('🚀 Starting NDPS Payments Migration...\n');
    runMigration();
}

module.exports = { runMigration };