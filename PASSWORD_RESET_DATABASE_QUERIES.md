# Password Reset - Direct Database Queries Guide

## 📋 Documents Created

This password reset system includes these query reference documents:

1. **PASSWORD_RESET_QUERIES.md** - Comprehensive query documentation with explanations
2. **PASSWORD_RESET_FLOW.sql** - Complete transaction flow with all steps
3. **QUICK_RESET_QUERIES.sql** - Copy-paste ready queries for common operations

---

## 🚀 QUICK START - Copy & Paste

### 1. Create Table
```sql
CREATE TABLE password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reset_token VARCHAR(255) NOT NULL UNIQUE,
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

### 2. Request Password Reset
```sql
-- When user submits forgot password form with email: user@example.com

-- Step 1: Find user
SELECT id, name, email FROM users 
WHERE email = 'user@example.com' AND is_active = TRUE LIMIT 1;

-- Step 2: Insert reset token (valid for 1 hour)
INSERT INTO password_reset_tokens (user_id, reset_token, expires_at)
VALUES (
  1,
  'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f',
  DATE_ADD(NOW(), INTERVAL 1 HOUR)
);
```

### 3. Verify Token
```sql
-- When user clicks reset link with token

SELECT id, user_id FROM password_reset_tokens 
WHERE reset_token = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f'
  AND is_used = FALSE 
  AND expires_at > NOW()
LIMIT 1;
```

### 4. Reset Password
```sql
-- When user submits new password

START TRANSACTION;

-- Update password
UPDATE users 
SET password_hash = 'scrypt:newsalt:newhash' 
WHERE id = 1;

-- Mark token as used
UPDATE password_reset_tokens 
SET is_used = TRUE, used_at = NOW() 
WHERE id = 1;

-- Invalidate other tokens
UPDATE password_reset_tokens 
SET is_used = TRUE 
WHERE user_id = 1 AND id != 1 AND is_used = FALSE;

COMMIT;
```

---

## 📊 Query Breakdown by Operation

### 🔍 LOOKUP QUERIES

**Find user by email:**
```sql
SELECT id, name, email FROM users 
WHERE email = 'user@example.com' AND is_active = TRUE;
```

**Get all tokens for user:**
```sql
SELECT * FROM password_reset_tokens 
WHERE user_id = 1 ORDER BY created_at DESC;
```

**Check token validity:**
```sql
SELECT id FROM password_reset_tokens 
WHERE reset_token = 'abc123...' 
  AND is_used = FALSE 
  AND expires_at > NOW();
```

---

### ➕ INSERT QUERIES

**Insert new token:**
```sql
INSERT INTO password_reset_tokens (user_id, reset_token, expires_at)
VALUES (1, 'token_string', DATE_ADD(NOW(), INTERVAL 1 HOUR));
```

---

### ✏️ UPDATE QUERIES

**Update user password:**
```sql
UPDATE users 
SET password_hash = 'scrypt:salt:hash' 
WHERE id = 1;
```

**Mark token as used:**
```sql
UPDATE password_reset_tokens 
SET is_used = TRUE, used_at = NOW() 
WHERE id = 1;
```

**Invalidate all tokens for user:**
```sql
UPDATE password_reset_tokens 
SET is_used = TRUE 
WHERE user_id = 1 AND is_used = FALSE;
```

---

### 🗑️ DELETE QUERIES

**Delete expired tokens:**
```sql
DELETE FROM password_reset_tokens
WHERE expires_at < NOW();
```

**Delete old used tokens:**
```sql
DELETE FROM password_reset_tokens
WHERE is_used = TRUE AND used_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

---

## 🔐 Complete Password Reset Flow

```
┌─────────────────────────────────────────────────────────────┐
│ USER REQUESTS PASSWORD RESET                                 │
│ Enters email: user@example.com                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │ Query 1: Find user by email    │
        │ SELECT id FROM users WHERE...  │
        │ Result: user_id = 1            │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │ Query 2: Insert reset token            │
        │ INSERT INTO password_reset_tokens...   │
        │ Result: token_id = 5                   │
        └────────────┬───────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │ EMAIL SENT with reset link             │
        │ /reset-password?token=abc123...        │
        └────────────┬───────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ USER CLICKS LINK AND ENTERS NEW PASSWORD                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │ Query 3: Verify token              │
        │ SELECT id FROM password_...WHERE.. │
        │ Result: token valid ✓              │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │ TRANSACTION START                      │
        └────────────┬───────────────────────────┘
                     │
        ┌────────────┴────────────────────┐
        │                                 │
        ▼                                 ▼
   ┌─────────────┐              ┌──────────────────┐
   │Query 4:     │              │Query 5:          │
   │Update pwd   │              │Mark token used   │
   │UPDATE users │              │UPDATE password_..│
   └──────┬──────┘              └────────┬─────────┘
          │                              │
          └──────────────┬───────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────┐
        │ Query 6: Invalidate other tokens       │
        │ UPDATE password_reset_tokens...        │
        └────────────┬───────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │ TRANSACTION COMMIT                     │
        └────────────┬───────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │ ✓ SUCCESS - PASSWORD RESET COMPLETE    │
        │ User can now login with new password   │
        └────────────────────────────────────────┘
```

---

## 🎯 Query Usage by Scenario

### Scenario 1: User Forgot Password
```sql
-- 1. Find user
SELECT id FROM users WHERE email = 'user@example.com' AND is_active = TRUE;

-- 2. Create token
INSERT INTO password_reset_tokens (user_id, reset_token, expires_at)
VALUES (1, 'generated_token', DATE_ADD(NOW(), INTERVAL 1 HOUR));
```

### Scenario 2: User Clicks Reset Link
```sql
-- Verify token
SELECT id FROM password_reset_tokens 
WHERE reset_token = 'token_from_url' 
  AND is_used = FALSE 
  AND expires_at > NOW();
```

### Scenario 3: Complete Password Reset
```sql
-- Transaction
START TRANSACTION;
UPDATE users SET password_hash = 'new_hash' WHERE id = 1;
UPDATE password_reset_tokens SET is_used = TRUE WHERE id = 5;
UPDATE password_reset_tokens SET is_used = TRUE WHERE user_id = 1 AND id != 5;
COMMIT;
```

### Scenario 4: Admin Reset User Password
```sql
-- Direct password reset (for admin)
UPDATE users 
SET password_hash = 'scrypt:salt:hash' 
WHERE id = 1;
```

### Scenario 5: Cleanup Old Tokens
```sql
-- Delete expired tokens
DELETE FROM password_reset_tokens
WHERE expires_at < NOW() OR created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

---

## 📈 Monitoring & Statistics

### Check Active Tokens
```sql
SELECT COUNT(*) FROM password_reset_tokens 
WHERE is_used = FALSE AND expires_at > NOW();
```

### View Reset Activity (Last 24h)
```sql
SELECT u.email, prt.created_at, prt.used_at
FROM password_reset_tokens prt
JOIN users u ON u.id = prt.user_id
WHERE prt.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY prt.created_at DESC;
```

### Find Problem Tokens
```sql
SELECT u.email, COUNT(*) as attempts
FROM password_reset_tokens prt
JOIN users u ON u.id = prt.user_id
WHERE prt.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY u.id
HAVING COUNT(*) > 5
ORDER BY attempts DESC;
```

---

## 🛡️ Security Queries

### Verify Token Hasn't Been Used
```sql
SELECT id FROM password_reset_tokens 
WHERE reset_token = 'token' AND is_used = FALSE;
```

### Check Token Expiration
```sql
SELECT id FROM password_reset_tokens 
WHERE reset_token = 'token' AND expires_at > NOW();
```

### Audit: Who Reset Password Recently
```sql
SELECT 
  u.email,
  prt.created_at as reset_requested,
  prt.used_at as password_reset_at
FROM password_reset_tokens prt
JOIN users u ON u.id = prt.user_id
WHERE prt.is_used = TRUE 
  AND prt.used_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY prt.used_at DESC;
```

---

## 🔧 Maintenance Queries

### Weekly Cleanup
```sql
-- Delete tokens older than 30 days
DELETE FROM password_reset_tokens
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### Monthly Report
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as reset_requests,
  SUM(CASE WHEN is_used = TRUE THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN is_used = FALSE THEN 1 ELSE 0 END) as incomplete
FROM password_reset_tokens
WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 📝 Database Schema Reference

| Column | Type | Purpose |
|--------|------|---------|
| id | INT | Primary key |
| user_id | INT | Foreign key to users |
| reset_token | VARCHAR(255) | Unique token string |
| expires_at | DATETIME | Token expiration time |
| is_used | BOOLEAN | Has token been used? |
| created_at | TIMESTAMP | When token was created |
| used_at | DATETIME | When token was used |

**Indexes:**
- `idx_reset_token`: Fast lookup by token
- `idx_user_id`: Find all tokens by user
- `idx_expires_at`: Cleanup queries

---

## ⚡ Performance Tips

1. **Use indexes**: Queries use `idx_reset_token` for fast token lookup
2. **Clean old data**: Run DELETE query monthly to keep table small
3. **Batch operations**: Use transactions to ensure consistency
4. **Monitor table size**: Check `password_reset_tokens` table size monthly

```sql
-- Check table size
SELECT 
  ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'password_reset_tokens'
  AND TABLE_SCHEMA = 'nursery_management';
```

---

## 🧪 Testing Queries

### Test Complete Flow
```sql
-- 1. Create test user
INSERT INTO users (role_id, role, name, email, password_hash)
VALUES (1, 'super_admin', 'Test', 'test@test.com', 'change-me')
ON DUPLICATE KEY UPDATE id=id;

-- 2. Create reset token
INSERT INTO password_reset_tokens (user_id, reset_token, expires_at)
SELECT id, 'test_token', DATE_ADD(NOW(), INTERVAL 1 HOUR)
FROM users WHERE email = 'test@test.com';

-- 3. Verify token
SELECT * FROM password_reset_tokens 
WHERE reset_token = 'test_token' AND is_used = FALSE AND expires_at > NOW();

-- 4. Reset password
UPDATE users SET password_hash = 'scrypt:test:test' 
WHERE email = 'test@test.com';

-- 5. Mark used
UPDATE password_reset_tokens SET is_used = TRUE, used_at = NOW() 
WHERE reset_token = 'test_token';

-- 6. Verify completion
SELECT u.email, u.password_hash, prt.is_used FROM users u
LEFT JOIN password_reset_tokens prt ON u.id = prt.user_id
WHERE u.email = 'test@test.com' ORDER BY prt.id DESC LIMIT 1;
```

---

## 📞 Support Resources

- **PASSWORD_RESET_QUERIES.md** - Detailed explanations of each query
- **PASSWORD_RESET_FLOW.sql** - Complete transaction flow with comments
- **QUICK_RESET_QUERIES.sql** - Copy-paste ready queries
- **FORGOT_PASSWORD_SETUP.md** - Complete setup and configuration guide

---

## ✨ Key Points

✅ Token expires after 1 hour (configurable)  
✅ Tokens are one-time use only  
✅ All other tokens invalidated on reset  
✅ Uses database transactions for consistency  
✅ Indexes for fast token lookup  
✅ Supports cleanup and maintenance  
✅ Easy to monitor and audit  

Ready to implement? Start with the **Quick Start** section! 🚀
