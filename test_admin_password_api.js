/**
 * Test Admin Password Change API
 * 
 * This script tests the admin password change API endpoint
 */

const BACKEND_URL = 'http://localhost:4000'; // Change to your backend URL
const SECRET_KEY = 'MySecureAdminKey2024!'; // Must match ADMIN_PASSWORD_CHANGE_SECRET in backend/.env

async function changeAdminPassword(email, newPassword) {
  try {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║         Testing Admin Password Change API                     ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`📧 Email: ${email}`);
    console.log(`🔑 New Password: ${newPassword}`);
    console.log(`🔐 Secret Key: ${SECRET_KEY.substring(0, 10)}...`);
    console.log(`🌐 Backend URL: ${BACKEND_URL}\n`);

    console.log('Sending request...\n');

    const response = await fetch(`${BACKEND_URL}/api/auth/admin-password-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        newPassword: newPassword,
        secretKey: SECRET_KEY
      })
    });

    const data = await response.json();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (response.ok) {
      console.log('✅ SUCCESS! Password changed successfully!\n');
      console.log('🔑 New Login Credentials:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${newPassword}\n`);
      console.log('⚠️  Keep these credentials secure!\n');
    } else {
      console.log('❌ FAILED! Password change unsuccessful.');
      console.log('Error:', data.message || 'Unknown error\n');
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         Test Admin Password Change API Script                  ║
╚════════════════════════════════════════════════════════════════╝

Usage:
  node test_admin_password_api.js <email> <new_password>

Examples:
  node test_admin_password_api.js owner@nursery.local NewPassword123
  node test_admin_password_api.js staff@nursery.local StaffPass456

Configuration:
  - Backend URL: ${BACKEND_URL}
  - Secret Key: Set in backend/.env as ADMIN_PASSWORD_CHANGE_SECRET

Notes:
  - The secret key in this script must match the one in backend/.env
  - The backend server must be running
  - This is for testing purposes - use carefully in production!
  `);
  process.exit(1);
}

const email = args[0];
const newPassword = args[1];

// Validate inputs
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('❌ Invalid email format');
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error('❌ Password must be at least 6 characters long');
  process.exit(1);
}

// Run the test
changeAdminPassword(email, newPassword);
