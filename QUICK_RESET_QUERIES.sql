-- ============================================================================
-- QUICK COPY-PASTE QUERIES FOR PASSWORD RESET
-- ============================================================================

-- SELECT YOUR DATABASE
USE nursery_management;

-- ============================================================================
-- 1. CREATE TEST USER AND GENERATE RESET TOKEN
-- ============================================================================

-- Create test user (if not exists)
INSERT INTO users (role_id, role, name, email, password_hash)
VALUES (1, 'super_admin', 'Test User', 'test@test.com', 'change-me')
ON DUPLICATE KEY UPDATE id=id;

-- Insert reset token (valid for 1 hour)
INSERT INTO password_reset_tokens (user_id, reset_token, expires_at)
SELECT 
  u.id,
  'test_token_12345678901234567890123456789012',
  DATE_ADD(NOW(), INTERVAL 1 HOUR)
FROM users u
WHERE u.email = 'test@test.com'
LIMIT 1;

-- View generated token
SELECT * FROM password_reset_tokens 
WHERE user_id = (SELECT id FROM users WHERE email = 'test@test.com')
ORDER BY id DESC LIMIT 1;

-- ============================================================================
-- 2. VERIFY TOKEN (What frontend does)
-- ============================================================================

SELECT 
  prt.id,
  prt.user_id,
  prt.reset_token,
  prt.expires_at,
  CASE 
    WHEN prt.is_used = TRUE THEN 'USED'
    WHEN prt.expires_at < NOW() THEN 'EXPIRED'
    WHEN prt.is_used = FALSE AND prt.expires_at > NOW() THEN 'VALID'
  END as token_status
FROM password_reset_tokens prt
WHERE prt.reset_token = 'test_token_12345678901234567890123456789012'
LIMIT 1;

-- ============================================================================
-- 3. RESET PASSWORD (What backend does after verification)
-- ============================================================================

-- Transaction: Reset password and mark token as used
START TRANSACTION;

-- Update password
UPDATE users 
SET password_hash = 'scrypt:newsalt:newhash123456789' 
WHERE id = (SELECT user_id FROM password_reset_tokens 
            WHERE reset_token = 'test_token_12345678901234567890123456789012' 
            AND is_used = FALSE LIMIT 1);

-- Mark token as used
UPDATE password_reset_tokens 
SET is_used = TRUE, used_at = NOW() 
WHERE reset_token = 'test_token_12345678901234567890123456789012';

-- Commit changes
COMMIT;

-- ============================================================================
-- 4. VERIFY PASSWORD RESET COMPLETED
-- ============================================================================

SELECT 
  u.email,
  u.password_hash,
  prt.is_used,
  prt.used_at
FROM users u
LEFT JOIN password_reset_tokens prt ON u.id = prt.user_id
WHERE u.email = 'test@test.com'
ORDER BY prt.id DESC
LIMIT 1;

-- ============================================================================
-- 5. VIEW ALL TOKENS FOR A USER
-- ============================================================================

SELECT 
  prt.id,
  prt.reset_token,
  prt.expires_at,
  prt.is_used,
  prt.created_at,
  prt.used_at,
  CASE 
    WHEN prt.is_used = TRUE THEN 'USED'
    WHEN prt.expires_at < NOW() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END as status
FROM password_reset_tokens prt
WHERE prt.user_id = (SELECT id FROM users WHERE email = 'test@test.com')
ORDER BY prt.created_at DESC;

-- ============================================================================
-- 6. GET ACTIVE TOKENS (DEBUGGING)
-- ============================================================================

SELECT 
  prt.id,
  u.email,
  prt.reset_token,
  prt.expires_at,
  TIMEDIFF(prt.expires_at, NOW()) as time_remaining,
  prt.created_at
FROM password_reset_tokens prt
JOIN users u ON u.id = prt.user_id
WHERE prt.is_used = FALSE 
  AND prt.expires_at > NOW()
ORDER BY prt.created_at DESC;

-- ============================================================================
-- 7. FIND EXPIRED TOKENS
-- ============================================================================

SELECT 
  prt.id,
  u.email,
  prt.reset_token,
  prt.expires_at,
  prt.created_at
FROM password_reset_tokens prt
JOIN users u ON u.id = prt.user_id
WHERE prt.expires_at < NOW() 
  AND prt.is_used = FALSE
ORDER BY prt.expires_at DESC;

-- ============================================================================
-- 8. FIND USER BY EMAIL (For password reset request)
-- ============================================================================

SELECT 
  id,
  name,
  email,
  role,
  is_active
FROM users 
WHERE email = 'user@example.com' 
  AND is_active = TRUE;

-- ============================================================================
-- 9. DELETE EXPIRED TOKENS (CLEANUP)
-- ============================================================================

-- Delete tokens older than 30 days
DELETE FROM password_reset_tokens
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Delete used tokens older than 7 days
DELETE FROM password_reset_tokens
WHERE is_used = TRUE 
  AND used_at < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Delete all expired tokens
DELETE FROM password_reset_tokens
WHERE expires_at < NOW();

-- ============================================================================
-- 10. VIEW STATISTICS
-- ============================================================================

SELECT 
  COUNT(*) as total_tokens,
  SUM(CASE WHEN is_used = FALSE THEN 1 ELSE 0 END) as active_tokens,
  SUM(CASE WHEN is_used = TRUE THEN 1 ELSE 0 END) as used_tokens,
  SUM(CASE WHEN expires_at < NOW() THEN 1 ELSE 0 END) as expired_tokens,
  ROUND(AVG(CASE WHEN is_used = TRUE THEN UNIX_TIMESTAMP(used_at) - UNIX_TIMESTAMP(created_at) ELSE NULL END)) as avg_reset_time_seconds
FROM password_reset_tokens;

-- ============================================================================
-- 11. RECENT RESET ACTIVITY (Last 24 hours)
-- ============================================================================

SELECT 
  u.email,
  u.name,
  prt.reset_token,
  prt.created_at,
  prt.used_at,
  TIMEDIFF(prt.used_at, prt.created_at) as time_to_complete
FROM password_reset_tokens prt
JOIN users u ON u.id = prt.user_id
WHERE prt.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY prt.created_at DESC;

-- ============================================================================
-- 12. USERS WITH MULTIPLE RESET ATTEMPTS
-- ============================================================================

SELECT 
  u.email,
  u.name,
  COUNT(prt.id) as reset_attempt_count,
  MAX(prt.created_at) as last_attempt,
  SUM(CASE WHEN prt.is_used = TRUE THEN 1 ELSE 0 END) as successful_resets
FROM users u
LEFT JOIN password_reset_tokens prt ON u.id = prt.user_id
GROUP BY u.id
HAVING COUNT(prt.id) > 0
ORDER BY COUNT(prt.id) DESC;

-- ============================================================================
-- 13. INVALIDATE ALL TOKENS FOR A USER (Manual action)
-- ============================================================================

UPDATE password_reset_tokens 
SET is_used = TRUE 
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')
  AND is_used = FALSE;

-- ============================================================================
-- 14. CHECK IF TOKEN CAN BE USED (Full validation)
-- ============================================================================

SELECT 
  CASE 
    WHEN prt.id IS NULL THEN 'TOKEN_NOT_FOUND'
    WHEN prt.is_used = TRUE THEN 'TOKEN_ALREADY_USED'
    WHEN prt.expires_at < NOW() THEN 'TOKEN_EXPIRED'
    WHEN prt.is_used = FALSE AND prt.expires_at > NOW() THEN 'TOKEN_VALID'
  END as validation_result,
  prt.id,
  prt.user_id,
  prt.expires_at
FROM password_reset_tokens prt
WHERE prt.reset_token = 'test_token_12345678901234567890123456789012'
LIMIT 1;

-- ============================================================================
-- 15. MANUAL PASSWORD RESET (Admin action)
-- ============================================================================

-- Method 1: Update password directly (FOR ADMIN ONLY)
UPDATE users 
SET password_hash = 'scrypt:admin_salt:admin_hash_here' 
WHERE id = 1;

-- Method 2: Reset to default "change-me" (FOR TESTING ONLY)
UPDATE users 
SET password_hash = 'change-me' 
WHERE email = 'user@example.com';

-- ============================================================================
-- 16. RESET TOKENS TABLE INFO
-- ============================================================================

-- Show table structure
DESCRIBE password_reset_tokens;

-- Show table size
SELECT 
  TABLE_NAME,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb,
  TABLE_ROWS as row_count
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'password_reset_tokens'
  AND TABLE_SCHEMA = 'nursery_management';

-- Show indexes
SHOW INDEX FROM password_reset_tokens;

-- ============================================================================
-- 17. TROUBLESHOOTING: CHECK USER STATUS
-- ============================================================================

SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.is_active,
  u.password_hash,
  COUNT(prt.id) as total_tokens,
  SUM(CASE WHEN prt.is_used = FALSE AND prt.expires_at > NOW() THEN 1 ELSE 0 END) as active_reset_tokens
FROM users u
LEFT JOIN password_reset_tokens prt ON u.id = prt.user_id
WHERE u.email = 'test@test.com'
GROUP BY u.id;

-- ============================================================================
-- 18. CHECK EMAIL FOR DUPLICATES (Password reset request check)
-- ============================================================================

SELECT 
  email,
  COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- ============================================================================
-- 19. RESET PASSWORD STEP BY STEP (With variables)
-- ============================================================================

-- Set variables
SET @email = 'user@example.com';
SET @new_password_hash = 'scrypt:newsalt:newhash';
SET @token = 'token_value_here';

-- Get user ID
SELECT @user_id := id FROM users WHERE email = @email AND is_active = TRUE;

-- Get token ID
SELECT @token_id := id FROM password_reset_tokens 
WHERE reset_token = @token 
  AND is_used = FALSE 
  AND expires_at > NOW();

-- Start transaction
START TRANSACTION;

-- Update password
UPDATE users SET password_hash = @new_password_hash WHERE id = @user_id;

-- Mark token used
UPDATE password_reset_tokens SET is_used = TRUE, used_at = NOW() WHERE id = @token_id;

-- Commit
COMMIT;

-- Verify
SELECT u.email, u.password_hash, prt.is_used FROM users u 
LEFT JOIN password_reset_tokens prt ON u.id = prt.user_id 
WHERE u.id = @user_id ORDER BY prt.id DESC LIMIT 1;

-- ============================================================================
-- 20. EXPORT RESET TOKENS TO CSV (For auditing)
-- ============================================================================

SELECT 
  prt.id,
  u.email,
  u.name,
  prt.reset_token,
  prt.expires_at,
  prt.is_used,
  prt.created_at,
  prt.used_at
FROM password_reset_tokens prt
JOIN users u ON u.id = prt.user_id
WHERE prt.created_at > DATE_SUB(NOW(), INTERVAL 90 DAY)
ORDER BY prt.created_at DESC
INTO OUTFILE '/tmp/reset_tokens_export.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';

-- ============================================================================
