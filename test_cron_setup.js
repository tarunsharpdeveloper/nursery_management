#!/usr/bin/env node

/**
 * Test script to verify cron job setup
 * Run this before setting up the actual cron job
 */

const fs = require('fs');
const path = require('path');

// Test functions
const tests = [];

function addTest(name, testFn) {
    tests.push({ name, testFn });
}

function log(message, level = 'INFO') {
    const colors = {
        'INFO': '\x1b[36m',
        'SUCCESS': '\x1b[32m', 
        'ERROR': '\x1b[31m',
        'WARN': '\x1b[33m'
    };
    console.log(`${colors[level] || ''}${message}\x1b[0m`);
}

// Test 1: Check required files exist
addTest('Required files exist', () => {
    const requiredFiles = [
        'backend/cron/payment_status_updater.js',
        'backend/cron/cron_runner.js',
        'backend/.env',
        'run_payment_cron.sh'
    ];
    
    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            throw new Error(`Missing file: ${file}`);
        }
    }
    
    return 'All required files present';
});

// Test 2: Check environment variables
addTest('Environment variables', () => {
    const envPath = path.join('backend', '.env');
    if (!fs.existsSync(envPath)) {
        throw new Error('.env file not found');
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = [
        'NDPS_MERCH_ID',
        'NDPS_PASSWORD',
        'NDPS_REQ_ENCRYPTION_KEY',
        'NDPS_RES_ENCRYPTION_KEY',
        'DB_HOST',
        'DB_NAME'
    ];
    
    const missing = requiredVars.filter(varName => !envContent.includes(varName));
    if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
    
    return 'All required environment variables found';
});

// Test 3: Check Node.js modules
addTest('Node.js dependencies', () => {
    const packageJsonPath = path.join('backend', 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error('backend/package.json not found');
    }
    
    const nodeModulesPath = path.join('backend', 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
        throw new Error('backend/node_modules not found - run npm install');
    }
    
    // Check for required modules
    const requiredModules = ['mysql2', 'crypto', 'https', 'dotenv'];
    for (const module of requiredModules) {
        const modulePath = path.join('backend', 'node_modules', module);
        if (!fs.existsSync(modulePath)) {
            throw new Error(`Module ${module} not installed`);
        }
    }
    
    return 'All Node.js dependencies available';
});

// Test 4: Check logs directory
addTest('Logs directory', () => {
    const logsDir = path.join('backend', 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
        return 'Created logs directory';
    }
    
    // Check if writable
    const testFile = path.join(logsDir, 'test.tmp');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    
    return 'Logs directory exists and writable';
});

// Test 5: Check database connection
addTest('Database connection', async () => {
    try {
        // Load environment variables
        require('dotenv').config({ path: path.join('backend', '.env') });
        
        const mysql = require('./backend/node_modules/mysql2/promise');
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root', 
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'nursery_db'
        });
        
        // Test query
        const [rows] = await connection.execute('SELECT 1 as test');
        await connection.end();
        
        if (rows[0].test !== 1) {
            throw new Error('Database test query failed');
        }
        
        return 'Database connection successful';
    } catch (error) {
        throw new Error(`Database connection failed: ${error.message}`);
    }
});

// Test 6: Check orders table structure
addTest('Orders table structure', async () => {
    try {
        require('dotenv').config({ path: path.join('backend', '.env') });
        const mysql = require('./backend/node_modules/mysql2/promise');
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'nursery_db'
        });
        
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'orders' 
            AND TABLE_SCHEMA = DATABASE()
        `);
        
        const columnNames = columns.map(col => col.COLUMN_NAME);
        const requiredColumns = [
            'id', 'total_amount', 'payment_status', 
            'atom_txn_id', 'merch_txn_id', 'created_at'
        ];
        
        const missing = requiredColumns.filter(col => !columnNames.includes(col));
        if (missing.length > 0) {
            throw new Error(`Missing columns in orders table: ${missing.join(', ')}`);
        }
        
        await connection.end();
        return 'Orders table has required columns';
    } catch (error) {
        throw new Error(`Orders table check failed: ${error.message}`);
    }
});

// Test 7: Test cron script syntax
addTest('Cron script syntax', () => {
    try {
        // Test require statements without execution
        const { updatePaymentStatuses } = require('./backend/cron/payment_status_updater.js');
        
        if (typeof updatePaymentStatuses !== 'function') {
            throw new Error('updatePaymentStatuses is not a function');
        }
        
        return 'Cron script syntax is valid';
    } catch (error) {
        throw new Error(`Cron script syntax error: ${error.message}`);
    }
});

// Run all tests
async function runTests() {
    log('🧪 Running Cron Job Setup Tests', 'INFO');
    log('================================\n', 'INFO');
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            log(`Testing: ${test.name}...`, 'INFO');
            const result = await test.testFn();
            log(`✅ ${test.name}: ${result}`, 'SUCCESS');
            passed++;
        } catch (error) {
            log(`❌ ${test.name}: ${error.message}`, 'ERROR');
            failed++;
        }
        console.log('');
    }
    
    log('================================', 'INFO');
    log(`Test Results: ${passed} passed, ${failed} failed`, failed === 0 ? 'SUCCESS' : 'ERROR');
    
    if (failed === 0) {
        log('\n🎉 All tests passed! Your cron job setup is ready.', 'SUCCESS');
        log('\nNext steps:', 'INFO');
        log('1. Run database migration: source database/add_payment_status_tracking.sql', 'INFO');
        log('2. Test manually: ./run_payment_cron.sh', 'INFO');  
        log('3. Set up cPanel cron job as described in PAYMENT_CRON_SETUP_GUIDE.md', 'INFO');
    } else {
        log('\n❌ Some tests failed. Please fix the issues before setting up the cron job.', 'ERROR');
        process.exit(1);
    }
}

if (require.main === module) {
    runTests().catch(error => {
        log(`Fatal error: ${error.message}`, 'ERROR');
        process.exit(1);
    });
}