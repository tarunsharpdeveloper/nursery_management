const { pool } = require('./db');

async function runSimpleMigration() {
  try {
    console.log('🚀 Starting simple migration...');
    
    // Check current table structure
    console.log('\n📋 Current payments table structure:');
    const [currentStruct] = await pool.query('DESCRIBE payments');
    console.table(currentStruct);
    
    // Add first column
    try {
      console.log('\n🔄 Adding merchant_transaction_id column...');
      await pool.query('ALTER TABLE payments ADD COLUMN merchant_transaction_id VARCHAR(160) NULL AFTER gateway_payment_id');
      console.log('✅ merchant_transaction_id column added successfully');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  merchant_transaction_id column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // Add second column
    try {
      console.log('\n🔄 Adding atom_transaction_id column...');
      await pool.query('ALTER TABLE payments ADD COLUMN atom_transaction_id VARCHAR(160) NULL AFTER merchant_transaction_id');
      console.log('✅ atom_transaction_id column added successfully');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  atom_transaction_id column already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // Create indexes
    try {
      console.log('\n🔄 Creating merchant_transaction_id index...');
      await pool.query('CREATE INDEX idx_payments_merchant_txn_id ON payments(merchant_transaction_id)');
      console.log('✅ merchant_transaction_id index created successfully');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️  merchant_transaction_id index already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    try {
      console.log('\n🔄 Creating atom_transaction_id index...');
      await pool.query('CREATE INDEX idx_payments_atom_txn_id ON payments(atom_transaction_id)');
      console.log('✅ atom_transaction_id index created successfully');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️  atom_transaction_id index already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // Update existing records
    console.log('\n🔄 Updating existing NDPS payment records...');
    const [updateResult] = await pool.query(`
      UPDATE payments 
      SET 
        merchant_transaction_id = gateway_payment_id,
        atom_transaction_id = CASE 
          WHEN remarks LIKE '%Atom Txn:%' THEN 
            TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(remarks, 'Atom Txn: ', -1), '.', 1))
          ELSE NULL 
        END
      WHERE payment_gateway = 'ndps'
    `);
    console.log(`✅ Updated ${updateResult.affectedRows} existing payment records`);
    
    // Show updated structure
    console.log('\n📋 Updated payments table structure:');
    const [newStruct] = await pool.query('DESCRIBE payments');
    console.table(newStruct);
    
    // Show sample data
    console.log('\n📊 Sample NDPS payment records with new columns:');
    const [sampleData] = await pool.query(`
      SELECT id, order_id, gateway_payment_id, merchant_transaction_id, atom_transaction_id, 
             payment_status, LEFT(remarks, 50) as remarks_preview
      FROM payments 
      WHERE payment_gateway = 'ndps' 
      ORDER BY id DESC 
      LIMIT 3
    `);
    
    if (sampleData.length > 0) {
      console.table(sampleData);
    } else {
      console.log('No NDPS payment records found.');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runSimpleMigration();