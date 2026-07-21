-- Fix: Make old product fields NULLABLE so new bookings can use advance_booking_items instead

-- Step 1: Remove the NOT NULL constraint from product_id
ALTER TABLE `advance_bookings` 
  MODIFY COLUMN `product_id` INT NULL DEFAULT NULL;

-- Step 2: Remove the NOT NULL constraint from quantity  
ALTER TABLE `advance_bookings`
  MODIFY COLUMN `quantity` INT NULL DEFAULT NULL;

-- Note: variant_id is already nullable, so no change needed

-- After this migration:
-- - Old bookings: Will have product_id, variant_id, quantity filled (backward compatible)
-- - New bookings: These fields will be NULL, data stored in advance_booking_items instead
