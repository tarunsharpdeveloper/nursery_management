-- Add dedicated columns for Merchant Transaction ID and Atom Transaction ID
-- Migration script to add transaction ID columns to payments table

ALTER TABLE payments 
ADD COLUMN merchant_transaction_id VARCHAR(160) NULL AFTER gateway_payment_id;

ALTER TABLE payments 
ADD COLUMN atom_transaction_id VARCHAR(160) NULL AFTER merchant_transaction_id;

-- Create indexes for faster lookups
CREATE INDEX idx_payments_merchant_txn_id ON payments(merchant_transaction_id);
CREATE INDEX idx_payments_atom_txn_id ON payments(atom_transaction_id);

-- Update existing records to populate the new columns from existing data
UPDATE payments 
SET 
  merchant_transaction_id = gateway_payment_id,
  atom_transaction_id = CASE 
    WHEN remarks LIKE '%Atom Txn:%' THEN 
      TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(remarks, 'Atom Txn: ', -1), '.', 1))
    ELSE NULL 
  END
WHERE payment_gateway = 'ndps' AND payment_status = 'paid';

-- Display updated table structure
DESCRIBE payments;

-- Show sample data
SELECT id, order_id, gateway_payment_id, merchant_transaction_id, atom_transaction_id, payment_status, remarks 
FROM payments 
WHERE payment_gateway = 'ndps' 
ORDER BY id DESC 
LIMIT 5;