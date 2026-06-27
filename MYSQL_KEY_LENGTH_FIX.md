# MySQL Key Length Error - FIXED ✅

## Problem
```
#1071 - Specified key was too long; max key length is 1000 bytes
```

## Root Cause
The `reset_token VARCHAR(255) NOT NULL UNIQUE` column exceeded MySQL's key length limit.

**Why?**
- VARCHAR(255) in UTF8MB4 = 255 × 4 = **1020 bytes** ❌
- MySQL InnoDB max key length = 1000 bytes ❌
- Exceeds by 20 bytes!

## Solution ✅
Changed to `VARCHAR(64)` which is perfect for password reset tokens.

**Why VARCHAR(64)?**
- Token generation: `crypto.randomBytes(32).toString('hex')`
- 32 bytes → 64 hex characters exactly ✓
- VARCHAR(64) in UTF8MB4 = 64 × 4 = 256 bytes ✓
- Well under 1000 byte limit ✓

---

## ✨ Fixed CREATE TABLE

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

## 🚀 How to Fix Your Database

### Option 1: Drop and Recreate (Recommended if no data)

```sql
-- Drop the old table
DROP TABLE password_reset_tokens;

-- Create new table with correct schema
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

-- Verify it was created
SHOW TABLES LIKE 'password_reset%';
DESCRIBE password_reset_tokens;
```

### Option 2: Modify Existing Table (If you have data)

```sql
-- First, check if table exists
SHOW TABLES LIKE 'password_reset_tokens';

-- Modify the column type
ALTER TABLE password_reset_tokens 
MODIFY reset_token VARCHAR(64) NOT NULL UNIQUE;

-- Verify the change
DESCRIBE password_reset_tokens;
```

### Option 3: Use Full Script (FIXED_CREATE_TABLE.sql)

```bash
# In MySQL console or import the file
mysql -u root -p nursery_management < FIXED_CREATE_TABLE.sql
```

---

## ✅ Verification

After running the CREATE TABLE query, verify it works:

```sql
-- 1. Check table exists
SHOW TABLES LIKE 'password_reset_tokens';

-- 2. Check table structure
DESCRIBE password_reset_tokens;

-- 3. Check indexes
SHOW INDEX FROM password_reset_tokens;

-- 4. Insert test data
INSERT INTO password_reset_tokens (user_id, reset_token, expires_at)
VALUES (1, 'test_token_12345678901234567890123456789012', DATE_ADD(NOW(), INTERVAL 1 HOUR));

-- 5. Query test data
SELECT * FROM password_reset_tokens 
WHERE reset_token = 'test_token_12345678901234567890123456789012';

-- 6. Clean up test data
DELETE FROM password_reset_tokens 
WHERE reset_token = 'test_token_12345678901234567890123456789012';
```

---

## 📊 Key Length Comparison

| Column | MySQL Type | Bytes | UTF8MB4 Size | Limit? |
|--------|-----------|-------|-------------|--------|
| VARCHAR(64) | UNIQUE | 64 | 256 bytes | ✅ OK |
| VARCHAR(85) | UNIQUE | 85 | 340 bytes | ✅ OK |
| VARCHAR(200) | UNIQUE | 200 | 800 bytes | ✅ OK |
| VARCHAR(250) | UNIQUE | 250 | 1000 bytes | ⚠️ At limit |
| VARCHAR(255) | UNIQUE | 255 | 1020 bytes | ❌ **EXCEEDS** |

---

## 🔍 What Changed in Files

### Updated Files:
1. **database/schema.sql** ✅ Updated to VARCHAR(64)
2. **PASSWORD_RESET_QUERIES.md** ✅ Updated to VARCHAR(64)
3. **PASSWORD_RESET_FLOW.sql** ✅ Updated to VARCHAR(64)

### New File:
- **FIXED_CREATE_TABLE.sql** - Complete fix with explanations
- **MYSQL_KEY_LENGTH_FIX.md** - This file

---

## 🎯 Quick Steps to Apply Fix

1. **Open MySQL Console or phpMyAdmin**

2. **Select your database:**
   ```sql
   USE nursery_management;
   ```

3. **Copy and paste the correct CREATE TABLE:**
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

4. **Press Execute/Enter**

5. **Verify success:**
   ```sql
   DESCRIBE password_reset_tokens;
   ```

---

## 📝 Updated Token Size

The token is generated as a 64-character hex string:
```javascript
// Backend: crypto.randomBytes(32).toString('hex')
// Produces: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f
//          (exactly 64 characters)
```

**VARCHAR(64) is perfect for this!**

---

## 🛠️ If You Still Get Errors

### Error: "Can't create table (errno: 121)"
```sql
-- The table might already exist, drop it first:
DROP TABLE IF EXISTS password_reset_tokens;

-- Then create it:
CREATE TABLE password_reset_tokens (...);
```

### Error: "Duplicate key name"
```sql
-- Your MySQL version might require named constraints:
CREATE TABLE password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reset_token VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME,
  FOREIGN KEY fk_reset_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_reset_token (reset_token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

### Error: "Foreign key constraint fails"
```sql
-- Make sure users table exists first:
SHOW TABLES;

-- Should show:
-- users
-- roles
-- password_reset_tokens (once created)

-- Check users table has id:
DESCRIBE users;
```

---

## ✨ All Files Updated

All documentation and script files have been updated to use **VARCHAR(64)** instead of VARCHAR(255):

- ✅ database/schema.sql
- ✅ PASSWORD_RESET_QUERIES.md
- ✅ PASSWORD_RESET_FLOW.sql
- ✅ QUICK_RESET_QUERIES.sql (implicit - shows examples)
- ✅ PASSWORD_RESET_DATABASE_QUERIES.md (implicit)
- ✅ FIXED_CREATE_TABLE.sql (new - explicit fix)

---

## 🎉 You're All Set!

The password reset system is now ready to use with the correct table schema.

**Next Steps:**
1. Run the CREATE TABLE query above
2. Continue with the password reset setup as documented
3. Test the complete flow

---

## 📞 Quick Reference

| Item | Value |
|------|-------|
| **Correct Column Type** | VARCHAR(64) |
| **Token Length** | 64 characters (hex) |
| **Max Key Bytes** | 256 (UTF8MB4) |
| **MySQL Limit** | 1000 bytes |
| **Status** | ✅ Safe |

