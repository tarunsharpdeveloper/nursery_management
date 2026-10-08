-- Add NDPS payment integration columns to orders table
-- This migration adds all required columns for NDPS payment tracking and cron job

-- Add atom_txn_id column (Atom Transaction ID from NDPS)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS atom_txn_id VARCHAR(160) NULL DEFAULT NULL
COMMENT 'Atom Transaction ID from NDPS payment gateway';

-- Add merch_txn_id column (Merchant Transaction ID for NDPS)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS merch_txn_id VARCHAR(160) NULL DEFAULT NULL
COMMENT 'Merchant Transaction ID for NDPS payment gateway';

-- Add status_last_checked column if it doesn't exist (from previous migration)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS status_last_checked TIMESTAMP NULL DEFAULT NULL
COMMENT 'Last time payment status was checked via cron';

-- Add ndps_response column if it doesn't exist (from previous migration)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS ndps_response TEXT NULL DEFAULT NULL
COMMENT 'Raw NDPS API response for debugging and status tracking';

-- Add updated_at column if not exists (for tracking when order was last modified)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
COMMENT 'Timestamp when the order was last updated';

-- Create indexes for efficient cron queries
CREATE INDEX IF NOT EXISTS idx_orders_atom_txn_id ON orders (atom_txn_id);
CREATE INDEX IF NOT EXISTS idx_orders_merch_txn_id ON orders (merch_txn_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_check 
ON orders (payment_status, status_last_checked, atom_txn_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);

-- Update payment_status enum to include 'processing' if it doesn't exist
-- Check current enum values first
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'payment_status';

-- Note: If 'processing' is not in the enum, you may need to run this separately:
-- ALTER TABLE orders MODIFY COLUMN payment_status ENUM('pending','paid','failed','refunded','processing') NOT NULL DEFAULT 'pending';

-- Show updated table structure
DESCRIBE orders;

-- Show current status distribution for verification
SELECT 
    payment_status,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN atom_txn_id IS NOT NULL AND atom_txn_id != '' THEN 1 END) as with_atom_id,
    COUNT(CASE WHEN merch_txn_id IS NOT NULL AND merch_txn_id != '' THEN 1 END) as with_merch_id,
    COUNT(CASE WHEN status_last_checked IS NULL THEN 1 END) as never_checked,
    COUNT(CASE WHEN ndps_response IS NOT NULL THEN 1 END) as with_ndps_response
FROM orders 
GROUP BY payment_status
ORDER BY total_orders DESC;

-- Sample data check (if any orders exist)
SELECT 
    id, 
    order_number, 
    payment_status, 
    atom_txn_id, 
    merch_txn_id, 
    status_last_checked,
    created_at,
    updated_at
FROM orders 
ORDER BY id DESC 
LIMIT 5;