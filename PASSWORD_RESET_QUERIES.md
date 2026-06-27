# Direct SQL Queries for Password Reset

## 1. CREATE PASSWORD RESET TOKENS TABLE

```sql
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
```

---

## 2. INSERT NEW RESET TOKEN

When user requests password reset:

```sql
INSERT INTO password_reset_tokens (user_id, reset_token, expires_at)
VALUES (
  :userId, 
  :resetToken, 
  DATE_ADD(NOW(), INTERVAL 1 HOUR)
);
```

**Example with hardcoded values:**
```sql
INSERT INTO password_reset_tokens (user_id, reset_token, expires_at)
VALUES (
  1, 
  'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f',
  DATE_ADD(NOW(), INTERVAL 1 HOUR)
);
```

---

## 3. VERIFY RESET TOKEN IS VALID

Check if token exists, is not used, and not expired:

```sql
SELECT id, user_id 
FROM password_reset_tokens 
WHERE reset_token = :resetToken 
  AND is_used = FALSE 
  AND expires_at > NOW()
LIMIT 1;
```

**Example:**
```sql
SELECT id, user_id 
FROM password_reset_tokens 
WHERE reset_token = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f'
  AND is_used = FALSE 
  AND expires_at > NOW()
LIMIT 1;
```

---

## 4. UPDATE USER PASSWORD

Reset user's password (after token validation):

```sql
UPDATE users 
SET password_hash = :newPasswordHash 
WHERE id = :userId;
```

**Example:**
```sql
UPDATE users 
SET password_hash = 'scrypt:salt123:hashedpassword' 
WHERE id = 1;
```

---

## 5. MARK TOKEN AS USED

After successful password reset:

```sql
UPDATE password_reset_tokens 
SET is_used = TRUE, used_at = NOW() 
WHERE id = :tokenId;
```

**Example:**
```sql
UPDATE password_reset_tokens 
SET is_used = TRUE, used_at = NOW() 
WHERE id = 5;
```

---

## 6. INVALIDATE ALL OTHER TOKENS FOR USER

Mark all other unused tokens as used for that user:

```sql
UPDATE password_reset_tokens 
SET is_used = TRUE 
WHERE user_id = :userId 
  AND id != :currentTokenId 
  AND is_used = FALSE;
```

**Example:**
```sql
UPDATE password_reset_tokens 
SET is_used = TRUE 
WHERE user_id = 1 
  AND id != 5 
  AND is_used = FALSE;
```

---

## 7. FIND USER BY EMAIL

When requesting password reset:

```sql
SELECT id, name, email 
FROM users 
WHERE email = :email 
  AND is_active = TRUE 
LIMIT 1;
```

**Example:**
```sql
SELECT id, name, email 
FROM users 
WHERE email = 'user@example.com' 
  AND is_active = TRUE 
LIMIT 1;
```

---

## 8. GET ALL RESET TOKENS FOR A USER

View all reset tokens created for a specific user:

```sql
SELECT id, reset_token, expires_at, is_used, created_at, used_at
FROM password_reset_tokens
WHERE user_id = :userId
ORDER BY created_at DESC;
```

**Example:**
```sql
SELECT id, reset_token, expires_at, is_used, created_at, used_at
FROM password_reset_tokens
WHERE user_id = 1
ORDER BY created_at DESC;
```

---

## 9. GET ACTIVE RESET TOKENS

Find all valid (not expired, not used) tokens:

```sql
SELECT id, user_id, reset_token, expires_at, created_at
FROM password_reset_tokens
WHERE is_used = FALSE 
  AND expires_at > NOW()
ORDER BY created_at DESC;
```

---

## 10. DELETE EXPIRED TOKENS (CLEANUP)

Remove old expired tokens to keep database clean:

```sql
DELETE FROM password_reset_tokens
WHERE expires_at < NOW() 
  OR (is_used = TRUE AND DATE_ADD(used_at, INTERVAL 7 DAYS) < NOW());
```

**Alternative - keep last 30 days:**
```sql
DELETE FROM password_reset_tokens
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

---

## 11. VIEW TOKEN STATISTICS

Get summary of password reset attempts:

```sql
SELECT 
  COUNT(*) as total_tokens,
  SUM(CASE WHEN is_used = TRUE THEN 1 ELSE 0 END) as used_tokens,
  SUM(CASE WHEN is_used = FALSE THEN 1 ELSE 0 END) as active_tokens,
  SUM(CASE WHEN expires_at < NOW() THEN 1 ELSE 0 END) as expired_tokens
FROM password_reset_tokens;
```

---

## 12. COMPLETE PASSWORD RESET TRANSACTION

Full transaction for password reset (what backend does):

```sql
-- Start transaction
START TRANSACTION;

-- 1. Get valid token
SELECT id, user_id FROM password_reset_tokens 
WHERE reset_token = 'abc123...' 
  AND is_used = FALSE 
  AND expires_at > NOW() 
LIMIT 1;
-- Result: id = 5, user_id = 1

-- 2. Update user password
UPDATE users 
SET password_hash = 'scrypt:salt:hash' 
WHERE id = 1;

-- 3. Mark token as used
UPDATE password_reset_tokens 
SET is_used = TRUE, used_at = NOW() 
WHERE id = 5;

-- 4. Invalidate other tokens
UPDATE password_reset_tokens 
SET is_used = TRUE 
WHERE user_id = 1 
  AND id != 5 
  AND is_used = FALSE;

-- Commit all changes
COMMIT;
```

---

## 13. QUICK TEST QUERIES

### Create test user and request reset:

```sql
-- Insert test user (if not exists)
INSERT INTO users (role_id, role, name, email, password_hash)
VALUES (1, 'super_admin', 'Test User', 'test@example.com', 'change-me')
ON DUPLICATE KEY UPDATE id=id;

-- Get user ID
SELECT id FROM users WHERE email = 'test@example.com';
-- Result: id = 1

-- Create reset token (valid for 1 hour)
INSERT INTO password_reset_tokens (user_id, reset_token, expires_at)
VALUES (1, 'test_token_abc123xyz', DATE_ADD(NOW(), INTERVAL 1 HOUR));

-- Check created token
SELECT * FROM password_reset_tokens 
WHERE user_id = 1 
ORDER BY id DESC LIMIT 1;
```

### Verify token:

```sql
SELECT * FROM password_reset_tokens 
WHERE reset_token = 'test_token_abc123xyz'
  AND is_used = FALSE 
  AND expires_at > NOW();
```

### Complete reset:

```sql
-- Update password
UPDATE users 
SET password_hash = 'scrypt:newsalt:newhash' 
WHERE id = 1;

-- Mark token used
UPDATE password_reset_tokens 
SET is_used = TRUE, used_at = NOW() 
WHERE reset_token = 'test_token_abc123xyz';
```

---

## 14. DEBUGGING QUERIES

### Find tokens for specific user:

```sql
SELECT 
  prt.id,
  prt.user_id,
  u.email,
  u.name,
  prt.reset_token,
  prt.expires_at,
  prt.is_used,
  prt.created_at,
  prt.used_at,
  CASE 
    WHEN prt.is_used = TRUE THEN 'USED'
    WHEN prt.expires_at < NOW() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END as token_status
FROM password_reset_tokens prt
JOIN users u ON u.id = prt.user_id
WHERE u.email = 'user@example.com'
ORDER BY prt.created_at DESC;
```

### Check recent reset attempts:

```sql
SELECT 
  prt.id,
  u.email,
  prt.created_at,
  prt.expires_at,
  prt.is_used,
  prt.used_at,
  TIMEDIFF(NOW(), prt.created_at) as time_since_created
FROM password_reset_tokens prt
JOIN users u ON u.id = prt.user_id
WHERE prt.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY prt.created_at DESC;
```

### Find users with multiple active tokens:

```sql
SELECT 
  u.id,
  u.email,
  u.name,
  COUNT(prt.id) as active_token_count
FROM users u
LEFT JOIN password_reset_tokens prt ON u.id = prt.user_id 
  AND prt.is_used = FALSE 
  AND prt.expires_at > NOW()
GROUP BY u.id
HAVING COUNT(prt.id) > 1
ORDER BY active_token_count DESC;
```

---

## 15. MAINTENANCE QUERIES

### Archive old used tokens (to separate table, optional):

```sql
-- Create archive table
CREATE TABLE password_reset_tokens_archive LIKE password_reset_tokens;

-- Move old used tokens
INSERT INTO password_reset_tokens_archive
SELECT * FROM password_reset_tokens
WHERE is_used = TRUE AND used_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Delete from main table
DELETE FROM password_reset_tokens
WHERE is_used = TRUE AND used_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### Check table size:

```sql
SELECT 
  TABLE_NAME,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'password_reset_tokens'
  AND TABLE_SCHEMA = 'nursery_management';
```

---

## QUERY EXECUTION EXAMPLES

### Using MySQL CLI:

```bash
mysql -u root -p nursery_management < password_reset_queries.sql
```

### Using MySQL Workbench:

1. Open MySQL Workbench
2. Connect to your database
3. Paste any query from above
4. Press Ctrl+Enter or click Execute

### Using phpMyAdmin:

1. Open phpMyAdmin
2. Select database: `nursery_management`
3. Go to SQL tab
4. Paste query
5. Click Go

---

## IMPORTANT NOTES

⚠️ **Password Hash Format**: Use `scrypt:salt:hash` format  
⚠️ **Token Format**: 64-character hex string (from `crypto.randomBytes(32).toString('hex')`)  
⚠️ **Expiration**: Typically 3600 seconds (1 hour)  
⚠️ **One-time Use**: Mark token as used after reset  
⚠️ **Security**: Never log actual passwords or tokens in production  

---

## QUICK REFERENCE

| Operation | Query | Used When |
|-----------|-------|-----------|
| Create Token | INSERT INTO password_reset_tokens | User requests password reset |
| Verify Token | SELECT ... WHERE reset_token=... | User clicks reset link |
| Update Password | UPDATE users SET password_hash | Token verified, password valid |
| Mark Used | UPDATE password_reset_tokens SET is_used | After successful reset |
| Cleanup | DELETE ... WHERE expires_at < NOW() | Maintenance task (weekly/monthly) |

