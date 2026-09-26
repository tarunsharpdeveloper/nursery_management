/**
 * Migration script to add merchant_transaction_id and atom_transaction_id columns to payments table
 */
const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🚀 Starting transaction ID columns migration...');

    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../database/add_transaction_id_columns.sql'), 
      'utf8'
    );

    // Split the SQL file into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('DESCRIBE') && !stmt.startsWith('SELECT'));

    console.log(`📄 Found ${statements.length} SQL statements to execute`);

    for (const [index, statement] of statements.entries()) {
      try {
        console.log(`\n🔄 Executing statement ${index + 1}:`);
        console.log(statement.substring(0, 80) + '...');
        
        const [result] = await pool.query(statement);
        console.log('✅ Statement executed successfully');
        
        // If it's a SELECT statement, show results
        if (statement.toUpperCase().startsWith('SELECT') || statement.toUpperCase().startsWith('DESCRIBE')) {
          console.log('📊 Result:', result);
        }
        
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('⚠️  Column already exists, skipping...');
        } else if (error.code === 'ER_DUP_KEYNAME') {
          console.log('⚠️  Index already exists, skipping...');
        } else {
          throw error;
        }
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Checking updated table structure...');
    
    // Show the updated table structure
    const [columns] = await pool.query('DESCRIBE payments');
    console.log('\n📊 Updated payments table structure:');
    console.table(columns);

    // Show sample data with new columns
    const [sampleData] = await pool.query(`
      SELECT id, order_id, gateway_payment_id, merchant_transaction_id, atom_transaction_id, 
             payment_status, LEFT(remarks, 50) as remarks_preview
      FROM payments 
      WHERE payment_gateway = 'ndps' 
      ORDER BY id DESC 
      LIMIT 3
    `);
    
    console.log('\n📊 Sample payment records with new columns:');
    console.table(sampleData);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run the migration
runMigration();