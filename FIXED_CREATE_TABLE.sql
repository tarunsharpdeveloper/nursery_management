-- ============================================================================
-- FIXED: Password Reset Tokens Table
-- Issue: VARCHAR(255) with UNIQUE index exceeded MySQL key length limit
-- Solution: Changed to VARCHAR(64) - still plenty for 256-bit hex tokens
-- ============================================================================

-- CORRECT VERSION - Use this!
CREATE TABLE password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reset_token VARCHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reset_token (reset_token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);

-- ============================================================================
-- EXPLANATION
-- ============================================================================
-- 
-- Why VARCHAR(64)?
-- ├─ Token generated: crypto.randomBytes(32).toString('hex')
-- ├─ 32 bytes × 2 (hex encoding) = 64 characters exactly
-- ├─ VARCHAR(64) is perfect for 256-bit tokens
-- └─ Leaves room for future expansion without index issues
-- 
-- MySQL Key Length Limit:
-- ├─ InnoDB (default): 1000 bytes per key
-- ├─ VARCHAR(255) with UTF8MB4: 255 × 4 = 1020 bytes (EXCEEDS LIMIT!)
-- ├─ VARCHAR(64) with UTF8MB4: 64 × 4 = 256 bytes (SAFE!)
-- └─ VARCHAR(64) with UTF8: 64 × 3 = 192 bytes (VERY SAFE!)
-- 
-- How to run this:
-- 1. Copy the CREATE TABLE statement above
-- 2. Paste into MySQL console or phpMyAdmin
-- 3. Execute - should work now!
-- 
-- If you already created the wrong table:
-- ├─ Method 1: Drop and recreate
-- │  DROP TABLE password_reset_tokens;
-- │  (then run the CREATE TABLE above)
-- │
-- └─ Method 2: Alter existing table (if no data)
--    ALTER TABLE password_reset_tokens 
--    DROP CONSTRAINT reset_token;
--    ALTER TABLE password_reset_tokens 
--    MODIFY reset_token VARCHAR(64) NOT NULL UNIQUE;
-- 
-- ============================================================================

-- ============================================================================
-- ALTERNATIVE: If you need the flexible 255 length without UNIQUE index
-- ============================================================================
-- 
-- CREATE TABLE password_reset_tokens (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   user_id INT NOT NULL,
--   reset_token VARCHAR(255) NOT NULL,
--   expires_at DATETIME NOT NULL,
--   is_used BOOLEAN NOT NULL DEFAULT FALSE,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   used_at DATETIME,
--   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
--   UNIQUE KEY idx_reset_token (reset_token(64)),  -- Only index first 64 chars
--   INDEX idx_user_id (user_id),
--   INDEX idx_expires_at (expires_at)
-- );
-- 
-- Note: This uses "prefix index" - only indexes first 64 characters
-- Trade-off: Less efficient for lookups, but handles arbitrary length tokens
-- Recommendation: Use the VARCHAR(64) version above instead
-- 
-- ============================================================================

-- ============================================================================
-- VERIFICATION - Run these after creating the table
-- ============================================================================

-- Check table was created
DESCRIBE password_reset_tokens;

-- Check indexes
SHOW INDEX FROM password_reset_tokens;

-- Insert test data to verify it works
INSERT INTO password_reset_tokens (user_id, reset_token, expires_at)
VALUES (1, 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d', NOW() + INTERVAL 1 HOUR);

-- Query test data
SELECT * FROM password_reset_tokens 
WHERE reset_token = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d';

-- Clean up test
DELETE FROM password_reset_tokens 
WHERE reset_token = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d';

-- ============================================================================
-- COMMON ERRORS & SOLUTIONS
-- ============================================================================
-- 
-- Error 1: #1071 - Specified key was too long
-- Cause: VARCHAR(255) UNIQUE exceeds 1000 byte limit
-- Fix: Use VARCHAR(64) instead (see above)
-- 
-- Error 2: #1005 - Can't create table (errno: 121)
-- Cause: Duplicate constraint name or key already exists
-- Fix: DROP TABLE first, then CREATE
-- 
-- Error 3: #1064 - Syntax error
-- Cause: Missing comma or typo in SQL
-- Fix: Check all commas between columns and constraints
-- 
-- Error 4: #1452 - Cannot add foreign key constraint
-- Cause: user_id references non-existent user or wrong type
-- Fix: Ensure users table exists and id is INT
-- 
-- Error 5: #1875 - Duplicate key name
-- Cause: Index name already exists
-- Fix: Drop indexes first or rename them
-- 
-- ============================================================================

-- ============================================================================
-- QUICK REFERENCE - Token Size by Encoding
-- ============================================================================
-- 
-- UTF8 (3 bytes per char):
--   VARCHAR(85):   85 × 3 = 255 bytes      (under 1000 limit ✓)
--   VARCHAR(255):  255 × 3 = 765 bytes     (under 1000 limit ✓)
-- 
-- UTF8MB4 (4 bytes per char):
--   VARCHAR(64):   64 × 4 = 256 bytes      (under 1000 limit ✓)
--   VARCHAR(85):   85 × 4 = 340 bytes      (under 1000 limit ✓)
--   VARCHAR(250):  250 × 4 = 1000 bytes    (at limit ⚠️)
--   VARCHAR(255):  255 × 4 = 1020 bytes    (EXCEEDS limit ✗)
-- 
-- RECOMMENDATION: Use VARCHAR(64) for tokens
-- It's exactly right for 256-bit hex tokens and safe for all encodings
-- 
-- ============================================================================
