/**
 * Change Admin Password Script
 * 
 * This script allows you to change the password for any user (especially admin)
 * 
 * Usage:
 *   node change_admin_password.js <email> <new_password>
 * 
 * Example:
 *   node change_admin_password.js admin@nursery.com MyNewPassword123
 */

const crypto = require('crypto');
// Use mysql2 from backend folder
const mysql = require('./backend/node_modules/mysql2/promise');
const fs = require('fs');
const path = require('path');

// Manually load .env file
function loadEnv() {
  const envPath = path.join(__dirname, 'backend', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found at:', envPath);
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      if (key && value !== undefined) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

loadEnv();

// Password hashing function (same as in backend/auth.js)
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

async function changePassword(email, newPassword) {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'nursery_management'
    });

    console.log('✅ Connected to database');

    // Check if user exists
    const [users] = await connection.query(
      'SELECT id, name, email, role_id FROM users WHERE email = ? AND is_deleted = 0',
      [email]
    );

    if (users.length === 0) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    const user = users[0];
    console.log(`\n📋 User Found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role ID: ${user.role_id}`);

    // Hash the new password
    const passwordHash = hashPassword(newPassword);
    console.log(`\n🔐 New password hash generated`);

    // Update the password
    const [result] = await connection.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, user.id]
    );

    if (result.affectedRows > 0) {
      console.log(`\n✅ Password updated successfully!`);
      console.log(`\n🔑 Login Credentials:`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${newPassword}`);
      console.log(`\n⚠️  Keep this information secure!`);
    } else {
      console.error('❌ Failed to update password');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║              Change Admin Password Script                      ║
╚════════════════════════════════════════════════════════════════╝

Usage:
  node change_admin_password.js <email> <new_password>

Examples:
  node change_admin_password.js admin@nursery.com NewPassword123
  node change_admin_password.js user@example.com MySecurePass456

Notes:
  - Email must be an existing user in the database
  - Password should be strong and secure
  - The password will be hashed using scrypt algorithm
  `);
  process.exit(1);
}

const email = args[0];
const newPassword = args[1];

// Validate email format
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('❌ Invalid email format');
  process.exit(1);
}

// Validate password strength
if (newPassword.length < 6) {
  console.error('❌ Password must be at least 6 characters long');
  process.exit(1);
}

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║              Change Admin Password Script                      ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Run the password change
changePassword(email, newPassword);
