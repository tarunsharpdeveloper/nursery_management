# ⚡ EXECUTE FIX NOW - Copy & Paste

## 🚨 The Issue
```
#1071 - Specified key was too long; max key length is 1000 bytes
```

## ✅ The Fix - Copy & Paste Below

### Step 1: Open MySQL Console
- **phpMyAdmin**: Go to SQL tab
- **MySQL Workbench**: New query window
- **Command line**: `mysql -u root -p`

### Step 2: Select Database
```sql
USE nursery_management;
```

### Step 3: Delete Old Table (If Exists)
```sql
DROP TABLE IF EXISTS password_reset_tokens;
```

### Step 4: Create New Table - COPY THIS EXACTLY ✅
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

### Step 5: Verify It Worked
```sql
DESCRIBE password_reset_tokens;
```

**Expected output:**
```
| Field       | Type     | Null | Key |
|-------------|----------|------|-----|
| id          | int      | NO   | PRI |
| user_id     | int      | NO   | MUL |
| reset_token | varchar  | NO   | UNI |
| expires_at  | datetime | NO   |     |
| is_used     | tinyint  | NO   |     |
| created_at  | timestamp| NO   |     |
| used_at     | datetime | YES  |     |
```

---

## 🎉 Done!

Your table is now created with the correct schema. Continue with backend setup:

```bash
# 1. Install nodemailer
cd backend
npm install nodemailer

# 2. Configure .env with email settings

# 3. Start backend
npm start
```

---

## ❓ What Changed?

| Before (❌ Error) | After (✅ Works) |
|------------------|------------------|
| VARCHAR(255) | VARCHAR(64) |
| 1020 bytes | 256 bytes |
| Exceeds limit | Under limit |

**Why?** 64-character hex tokens fit perfectly in VARCHAR(64), no MySQL key length errors!

---

## 🆘 If You Get an Error

### "Can't create table"
```sql
-- Drop it first
DROP TABLE password_reset_tokens;
-- Then run CREATE TABLE above
```

### "Duplicate key"
```sql
-- Your MySQL version needs named constraints:
CREATE TABLE password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reset_token VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME,
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_reset_token (reset_token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

### "Foreign key constraint fails"
- Make sure `users` table exists
- Run: `SHOW TABLES;`
- Should show users, roles, customers, etc.

---

## ✨ Quick Test

After creating table, test it works:

```sql
-- Insert test token
INSERT INTO password_reset_tokens (user_id, reset_token, expires_at)
VALUES (1, 'test_token_abcdefghijklmnopqrstuvwxyz1234567890', DATE_ADD(NOW(), INTERVAL 1 HOUR));

-- Query it
SELECT * FROM password_reset_tokens WHERE reset_token = 'test_token_abcdefghijklmnopqrstuvwxyz1234567890';

-- Clean up
DELETE FROM password_reset_tokens WHERE reset_token = 'test_token_abcdefghijklmnopqrstuvwxyz1234567890';
```

If all 3 queries work ✅ - You're good to go!

---

**That's it! Your password reset system is ready.** 🚀
