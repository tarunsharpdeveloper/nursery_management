#!/usr/bin/env node

/**
 * Cron Job Runner for Nursery Management System
 * 
 * This script acts as a wrapper for all cron jobs and provides:
 * - Process management
 * - Error handling
 * - Logging
 * - Lock file management to prevent duplicate runs
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const LOCK_FILE = path.join(__dirname, '../logs/cron.lock');
const LOG_FILE = path.join(__dirname, '../logs/cron_runner.log');

// Ensure logs directory exists
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [CRON-RUNNER] [${level}] ${message}\n`;
    
    console.log(logEntry.trim());
    fs.appendFileSync(LOG_FILE, logEntry);
}

function checkLockFile() {
    if (fs.existsSync(LOCK_FILE)) {
        const lockContent = fs.readFileSync(LOCK_FILE, 'utf8');
        const lockData = JSON.parse(lockContent);
        const lockTime = new Date(lockData.timestamp);
        const now = new Date();
        const diffMinutes = (now - lockTime) / (1000 * 60);
        
        // If lock is older than 30 minutes, consider it stale and remove it
        if (diffMinutes > 30) {
            log('Removing stale lock file', 'WARN');
            fs.unlinkSync(LOCK_FILE);
            return false;
        } else {
            log(`Cron job already running (locked since ${lockTime.toISOString()})`, 'WARN');
            return true;
        }
    }
    return false;
}

function createLockFile() {
    const lockData = {
        pid: process.pid,
        timestamp: new Date().toISOString(),
        job: 'payment_status_updater'
    };
    fs.writeFileSync(LOCK_FILE, JSON.stringify(lockData));
}

function removeLockFile() {
    if (fs.existsSync(LOCK_FILE)) {
        fs.unlinkSync(LOCK_FILE);
    }
}

async function runPaymentStatusUpdater() {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, 'payment_status_updater.js');
        
        log('Starting payment status updater');
        
        const child = exec(`node "${scriptPath}"`, {
            cwd: __dirname,
            timeout: 300000 // 5 minute timeout
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
            stdout += data;
            // Real-time logging
            process.stdout.write(data);
        });
        
        child.stderr.on('data', (data) => {
            stderr += data;
            process.stderr.write(data);
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                log('Payment status updater completed successfully');
                resolve({ code, stdout, stderr });
            } else {
                log(`Payment status updater failed with code ${code}`, 'ERROR');
                reject(new Error(`Process exited with code ${code}\nSTDERR: ${stderr}`));
            }
        });
        
        child.on('error', (error) => {
            log(`Payment status updater process error: ${error.message}`, 'ERROR');
            reject(error);
        });
    });
}

async function main() {
    log('Cron runner started');
    
    try {
        // Check for existing lock
        if (checkLockFile()) {
            process.exit(0);
        }
        
        // Create lock file
        createLockFile();
        
        // Run the payment status updater
        await runPaymentStatusUpdater();
        
        log('All cron jobs completed successfully');
        
    } catch (error) {
        log(`Cron runner failed: ${error.message}`, 'ERROR');
        process.exit(1);
    } finally {
        // Always remove lock file
        removeLockFile();
    }
}

// Handle process termination
process.on('SIGINT', () => {
    log('Received SIGINT, cleaning up...', 'WARN');
    removeLockFile();
    process.exit(1);
});

process.on('SIGTERM', () => {
    log('Received SIGTERM, cleaning up...', 'WARN');
    removeLockFile();
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    log(`Uncaught exception: ${error.message}`, 'ERROR');
    removeLockFile();
    process.exit(1);
});

if (require.main === module) {
    main();
}