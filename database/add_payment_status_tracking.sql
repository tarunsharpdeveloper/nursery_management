-- Add payment status tracking columns to orders table
-- Run this SQL script in your database

-- Add status_last_checked column if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS status_last_checked TIMESTAMP NULL DEFAULT NULL
COMMENT 'Last time payment status was checked via cron';

-- Add ndps_response column if it doesn't exist  
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS ndps_response TEXT NULL DEFAULT NULL
COMMENT 'Raw NDPS API response for debugging';

-- Add index for efficient cron queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_check 
ON orders (payment_status, status_last_checked, atom_txn_id);

-- Add index for created_at if not exists
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON orders (created_at);

-- Update existing orders to allow cron checking
UPDATE orders 
SET status_last_checked = NULL 
WHERE payment_status IN ('pending', 'failed', 'processing') 
  AND status_last_checked IS NULL;

-- Show current status distribution
SELECT 
    payment_status,
    COUNT(*) as count,
    COUNT(CASE WHEN atom_txn_id IS NOT NULL AND atom_txn_id != '' THEN 1 END) as with_atom_id,
    COUNT(CASE WHEN status_last_checked IS NULL THEN 1 END) as never_checked
FROM orders 
GROUP BY payment_status
ORDER BY count DESC;