-- Add NDPS tracking columns to payments table (if they don't already exist)
-- This migration ensures the payments table has all columns needed for cron job

-- Check if transaction ID columns exist, add them if missing
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS merchant_transaction_id VARCHAR(160) NULL 
COMMENT 'Merchant Transaction ID for NDPS payment gateway';

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS atom_transaction_id VARCHAR(160) NULL 
COMMENT 'Atom Transaction ID from NDPS payment gateway';

-- Create indexes for efficient cron queries (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_payments_merchant_txn_id ON payments(merchant_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_atom_txn_id ON payments(atom_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_status ON payments(payment_gateway, payment_status);

-- Show updated table structure
DESCRIBE payments;

-- Show current payment status distribution for verification
SELECT 
    payment_gateway,
    payment_status,
    COUNT(*) as total_payments,
    COUNT(CASE WHEN merchant_transaction_id IS NOT NULL AND merchant_transaction_id != '' THEN 1 END) as with_merchant_id,
    COUNT(CASE WHEN atom_transaction_id IS NOT NULL AND atom_transaction_id != '' THEN 1 END) as with_atom_id
FROM payments 
GROUP BY payment_gateway, payment_status
ORDER BY payment_gateway, total_payments DESC;

-- Sample NDPS payments for verification
SELECT 
    id, 
    order_id,
    payment_gateway,
    payment_status, 
    merchant_transaction_id, 
    atom_transaction_id, 
    amount,
    created_at
FROM payments 
WHERE payment_gateway = 'ndps'
ORDER BY id DESC 
LIMIT 5;