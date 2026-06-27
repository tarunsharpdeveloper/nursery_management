-- ============================================================================
-- PASSWORD RESET COMPLETE FLOW - DIRECT SQL QUERIES
-- ============================================================================
-- This file contains the exact SQL queries executed during password reset

-- ============================================================================
-- PART 1: TABLE CREATION (Run once to setup)
-- ============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
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
-- PART 2: STEP 1 - USER REQUESTS PASSWORD RESET
-- ============================================================================
-- Frontend: User submits email form on /forgot-password
-- Backend: POST /api/auth/forgot-password

-- Query 1: Find user by email
SELECT id, name, email 
FROM users 
WHERE email = 'user@example.com' 
  AND is_active = TRUE 
LIMIT 1;

-- Query 2: If user found, insert reset token
-- (Backend generates token: crypto.randomBytes(32).toString("hex"))
INSERT INTO password_reset_tokens (user_id, reset_token, expires_at)
VALUES (
  1,
  'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f',
  '2024-06-26 12:00:00'
);

-- ============================================================================
-- PART 3: STEP 2 - USER RECEIVES EMAIL AND CLICKS LINK
-- ============================================================================
-- Email sent from backend with link:
-- http://localhost:3000/reset-password?token=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f

-- Frontend: /reset-password page loads, verifies token
-- Backend: POST /api/auth/verify-reset-token

-- Query 3: Verify token is valid
SELECT id, user_id 
FROM password_reset_tokens 
WHERE reset_token = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f'
  AND is_used = FALSE 
  AND expires_at > NOW()
LIMIT 1;

-- ============================================================================
-- PART 4: STEP 3 - USER ENTERS NEW PASSWORD AND SUBMITS
-- ============================================================================
-- Frontend: User enters password and confirms password on /reset-password
-- Backend: POST /api/auth/reset-password

-- Query 4: Start transaction
START TRANSACTION;

-- Query 5: Verify token again (security check)
SELECT id, user_id 
FROM password_reset_tokens 
WHERE reset_token = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f'
  AND is_used = FALSE 
  AND expires_at > NOW()
LIMIT 1;

-- Query 6: Update user password
-- (Backend generates new hash: crypto.scryptSync(password, salt, 64))
UPDATE users 
SET password_hash = 'scrypt:newsalt123:newhashedpasswordhere' 
WHERE id = 1;

-- Query 7: Mark token as used
UPDATE password_reset_tokens 
SET is_used = TRUE, used_at = NOW() 
WHERE id = 1;

-- Query 8: Invalidate all other unused tokens for this user
UPDATE password_reset_tokens 
SET is_used = TRUE 
WHERE user_id = 1 
  AND id != 1 
  AND is_used = FALSE;

-- Query 9: Commit transaction
COMMIT;

-- ============================================================================
-- PART 5: SUCCESS - USER CAN NOW LOGIN WITH NEW PASSWORD
-- ============================================================================

-- Query 10: User login with new password
SELECT u.id, u.name, u.email, u.password_hash, COALESCE(u.role, r.name) AS role
FROM users u
JOIN roles r ON r.id = u.role_id
WHERE u.email = 'user@example.com' 
  AND u.is_active = TRUE
LIMIT 1;

-- Backend validates password_hash with the submitted password
-- If valid, returns JWT token and user info

-- ============================================================================
-- PART 6: MONITORING & DEBUGGING
-- ============================================================================

-- View all reset tokens for a user
SELECT id, reset_token, expires_at, is_used, created_at, used_at
FROM password_reset_tokens
WHERE user_id = 1
ORDER BY created_at DESC;

-- View active reset tokens (not used, not expired)
SELECT id, user_id, reset_token, expires_at, created_at
FROM password_reset_tokens
WHERE is_used = FALSE 
  AND expires_at > NOW()
ORDER BY created_at DESC;

-- View expired tokens
SELECT id, user_id, reset_token, expires_at, is_used
FROM password_reset_tokens
WHERE expires_at < NOW()
ORDER BY expires_at DESC;

-- View recently used tokens
SELECT id, user_id, reset_token, created_at, used_at
FROM password_reset_tokens
WHERE is_used = TRUE
ORDER BY used_at DESC
LIMIT 10;

-- ============================================================================
-- PART 7: MAINTENANCE QUERIES
-- ============================================================================

-- Delete expired tokens (clean up database)
DELETE FROM password_reset_tokens
WHERE expires_at < NOW() 
  AND is_used = TRUE 
  AND DATE_ADD(used_at, INTERVAL 7 DAYS) < NOW();

-- Get count of unused and active tokens
SELECT 
  COUNT(*) as total_tokens,
  SUM(CASE WHEN is_used = FALSE THEN 1 ELSE 0 END) as active_tokens,
  SUM(CASE WHEN is_used = TRUE THEN 1 ELSE 0 END) as used_tokens,
  SUM(CASE WHEN expires_at < NOW() THEN 1 ELSE 0 END) as expired_tokens
FROM password_reset_tokens;

-- ============================================================================
-- PART 8: TESTING COMPLETE FLOW (Copy-paste ready)
-- ============================================================================

-- Setup test data
USE nursery_management;

-- 1. Create/verify test user
INSERT INTO users (role_id, role, name, email, password_hash)
VALUES (1, 'super_admin', 'Test User', 'testuser@example.com', 'change-me')
ON DUPLICATE KEY UPDATE id=id;

-- 2. Get test user ID
SELECT @user_id := id FROM users WHERE email = 'testuser@example.com';

-- 3. Create reset token (valid for 1 hour)
INSERT INTO password_reset_tokens (user_id, reset_token, expires_at)
VALUES (@user_id, 'test_reset_token_1234567890abcdef', DATE_ADD(NOW(), INTERVAL 1 HOUR));

-- 4. Verify token
SELECT * FROM password_reset_tokens 
WHERE reset_token = 'test_reset_token_1234567890abcdef'
  AND is_used = FALSE 
  AND expires_at > NOW();

-- 5. Reset password (example hash - in real app use scrypt)
UPDATE users 
SET password_hash = 'scrypt:testsalt:testhash' 
WHERE id = @user_id;

-- 6. Mark token used
UPDATE password_reset_tokens 
SET is_used = TRUE, used_at = NOW() 
WHERE reset_token = 'test_reset_token_1234567890abcdef';

-- 7. Verify reset completed
SELECT 
  u.email,
  u.password_hash,
  prt.is_used,
  prt.used_at
FROM users u
JOIN password_reset_tokens prt ON u.id = prt.user_id
WHERE u.email = 'testuser@example.com'
ORDER BY prt.created_at DESC
LIMIT 1;

-- ============================================================================
-- PART 9: ERROR SCENARIOS
-- ============================================================================

-- Scenario 1: Invalid token (doesn't exist)
SELECT id FROM password_reset_tokens 
WHERE reset_token = 'invalid_token_xyz'
  AND is_used = FALSE 
  AND expires_at > NOW();
-- Result: Empty set → Error: "Invalid or expired reset token"

-- Scenario 2: Expired token
SELECT id FROM password_reset_tokens 
WHERE reset_token = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f'
  AND is_used = FALSE 
  AND expires_at > NOW();
-- If expires_at is in the past → Empty set → Error: "Invalid or expired reset token"

-- Scenario 3: Token already used
SELECT id FROM password_reset_tokens 
WHERE reset_token = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f'
  AND is_used = FALSE 
  AND expires_at > NOW();
-- If is_used = TRUE → Empty set → Error: "Invalid or expired reset token"

-- Scenario 4: Email not found
SELECT id FROM users 
WHERE email = 'nonexistent@example.com' 
  AND is_active = TRUE;
-- Result: Empty set → Message: "If the email exists, a password reset link has been sent."

-- ============================================================================
-- PART 10: COMPLETE TRANSACTION WITH ERROR HANDLING
-- ============================================================================

-- Example: What happens if something fails during reset

START TRANSACTION;

-- Check if token is valid
SELECT @token_id := id, @user_id := user_id 
FROM password_reset_tokens 
WHERE reset_token = 'abc123'
  AND is_used = FALSE 
  AND expires_at > NOW();

-- If no token found, rollback
-- (In backend: ROLLBACK and return error)

-- If token found, update password
-- (Assuming @token_id = 5, @user_id = 1)
UPDATE users 
SET password_hash = 'scrypt:salt:hash' 
WHERE id = @user_id;

-- If update failed (no rows affected), rollback
-- (In backend: check affectedRows > 0)

-- Mark token as used
UPDATE password_reset_tokens 
SET is_used = TRUE, used_at = NOW() 
WHERE id = @token_id;

-- Invalidate other tokens
UPDATE password_reset_tokens 
SET is_used = TRUE 
WHERE user_id = @user_id 
  AND id != @token_id 
  AND is_used = FALSE;

-- If all successful, commit
COMMIT;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- 1. Token Format: 64-character hexadecimal string
--    Generated by: crypto.randomBytes(32).toString("hex")
--
-- 2. Password Hash Format: scrypt:salt:hash
--    Generated by: crypto.scryptSync(password, salt, 64)
--
-- 3. Expiration: Default 3600 seconds (1 hour)
--    Can be changed in backend .env: RESET_TOKEN_EXPIRY=7200
--
-- 4. Security Features:
--    - Tokens are one-time use (marked as used after reset)
--    - All other tokens are invalidated when password reset
--    - Tokens expire automatically
--    - Email is not exposed in response (prevents email enumeration)
--
-- 5. Transaction Support:
--    - All password reset operations use database transactions
--    - If any step fails, entire transaction is rolled back
--    - Ensures data consistency
--
-- 6. Indexes:
--    - idx_reset_token: For fast token lookup during verification
--    - idx_user_id: For finding all tokens by user
--    - idx_expires_at: For cleanup queries
--
-- ============================================================================
