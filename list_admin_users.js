/**
 * List All Admin Users Script
 * 
 * This script lists all admin/staff users in the system
 * 
 * Usage:
 *   node list_admin_users.js
 */

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

async function listAdminUsers() {
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

    console.log('✅ Connected to database\n');

    // Get all active users with their roles
    const [users] = await connection.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        r.name as role_name,
        u.is_active,
        u.created_at
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE u.is_deleted = 0
      ORDER BY u.role_id, u.id
    `);

    if (users.length === 0) {
      console.log('❌ No users found in the database');
      return;
    }

    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                           ALL USERS IN SYSTEM                              ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

    // Group users by role
    const usersByRole = {};
    users.forEach(user => {
      const role = user.role_name || 'No Role';
      if (!usersByRole[role]) {
        usersByRole[role] = [];
      }
      usersByRole[role].push(user);
    });

    // Display users grouped by role
    Object.keys(usersByRole).forEach(role => {
      console.log(`\n📋 ${role.toUpperCase()}`);
      console.log('─'.repeat(80));
      
      usersByRole[role].forEach(user => {
        const status = user.is_active ? '✅ Active' : '❌ Inactive';
        const created = new Date(user.created_at).toLocaleDateString();
        
        console.log(`
  ID: ${user.id}
  Name: ${user.name}
  Email: ${user.email}
  Status: ${status}
  Created: ${created}
        `);
      });
    });

    console.log('\n' + '═'.repeat(80));
    console.log(`Total Users: ${users.length}`);
    console.log('═'.repeat(80));

    console.log(`\n💡 To change a password, run:`);
    console.log(`   node change_admin_password.js <email> <new_password>\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed\n');
    }
  }
}

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                    List Admin Users Script                     ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Run the script
listAdminUsers();
