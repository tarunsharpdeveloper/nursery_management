# Password Reset - Visual Query Guide

## 🎯 Main Queries at a Glance

### Query 1: User Requests Password Reset
```
┌─────────────────────────────┐
│ User enters: user@test.com  │
└────────────┬────────────────┘
             │
             ▼
     SELECT id, name, email 
     FROM users 
     WHERE email = 'user@test.com' 
       AND is_active = TRUE;
```

### Query 2: Generate and Store Token
```
┌──────────────────────┐
│ Generate Token:      │
│ crypto.randomBytes   │
│ (32).toString('hex') │
└────────────┬─────────┘
             │
             ▼
     INSERT INTO password_reset_tokens 
     (user_id, reset_token, expires_at)
     VALUES (1, 'token123...', NOW() + 1 hour);
```

### Query 3: Send Reset Email
```
┌────────────────────────────────┐
│ Email contains reset link:     │
│ /reset-password?token=token123 │
└────────────────────────────────┘
```

### Query 4: Verify Token
```
┌─────────────────────────────┐
│ User clicks email link      │
│ Token from URL: token123... │
└────────────┬────────────────┘
             │
             ▼
     SELECT id, user_id 
     FROM password_reset_tokens 
     WHERE reset_token = 'token123...'
       AND is_used = FALSE 
       AND expires_at > NOW();
```

### Query 5: Reset Password (Transaction)
```
┌──────────────────────────────────┐
│ User enters new password         │
│ Confirms password matches        │
└────────────┬─────────────────────┘
             │
             ▼
     ┌─────────────────────────────────┐
     │ START TRANSACTION               │
     └─────────────────────────────────┘
             │
    ┌────────┴────────┬──────────┐
    │                 │          │
    ▼                 ▼          ▼
UPDATE users      UPDATE pass   UPDATE pass
SET password      word_reset    word_reset
_hash =           _tokens SET   _tokens SET
'scrypt:...'      is_used =     is_used =
WHERE id = 1      TRUE WHERE    TRUE WHERE
                  id = 5        user_id = 1
                                AND id != 5
    │                 │          │
    └────────┬────────┴──────────┘
             │
             ▼
     ┌─────────────────────────────────┐
     │ COMMIT                          │
     └─────────────────────────────────┘
```

---

## 📊 Database State Changes

### Before Reset Request
```
users table:
┌────┬──────────────────┬────────────────────┐
│ id │ email            │ password_hash      │
├────┼──────────────────┼────────────────────┤
│ 1  │ user@test.com    │ scrypt:old:hash... │
└────┴──────────────────┴────────────────────┘

password_reset_tokens table:
┌────┬─────────┬────────────┬──────────┐
│ id │ user_id │ is_used    │ expires  │
├────┼─────────┼────────────┼──────────┤
│ (empty)                              │
└────┴─────────┴────────────┴──────────┘
```

### After Reset Request
```
users table: (unchanged)

password_reset_tokens table:
┌────┬─────────┬─────────────────┬──────────┬────────┐
│ id │ user_id │ reset_token     │ is_used  │ expires│
├────┼─────────┼─────────────────┼──────────┼────────┤
│ 1  │ 1       │ abc123....xyz   │ FALSE    │ +1h   │
└────┴─────────┴─────────────────┴──────────┴────────┘
```

### After Password Reset
```
users table: (password changed)
┌────┬──────────────────┬────────────────────┐
│ id │ email            │ password_hash      │
├────┼──────────────────┼────────────────────┤
│ 1  │ user@test.com    │ scrypt:new:hash... │
└────┴──────────────────┴────────────────────┘

password_reset_tokens table: (token marked used)
┌────┬─────────┬─────────────────┬──────────┬─────────────┐
│ id │ user_id │ reset_token     │ is_used  │ used_at     │
├────┼─────────┼─────────────────┼──────────┼─────────────┤
│ 1  │ 1       │ abc123....xyz   │ TRUE     │ NOW()       │
└────┴─────────┴─────────────────┴──────────┴─────────────┘
```

---

## 🔄 Transaction Flow with SQL

```
START TRANSACTION;
│
├─ Query A: Find valid token
│  ┌─────────────────────────────────────────┐
│  │ SELECT id, user_id FROM               │
│  │ password_reset_tokens WHERE...         │
│  │ Result: token_id=5, user_id=1         │
│  └─────────────────────────────────────────┘
│
├─ Query B: Update user password
│  ┌─────────────────────────────────────────┐
│  │ UPDATE users SET password_hash=        │
│  │ 'scrypt:new:hash' WHERE id=1          │
│  │ Result: 1 row affected ✓              │
│  └─────────────────────────────────────────┘
│
├─ Query C: Mark token as used
│  ┌─────────────────────────────────────────┐
│  │ UPDATE password_reset_tokens SET       │
│  │ is_used=TRUE, used_at=NOW() WHERE id=5│
│  │ Result: 1 row affected ✓              │
│  └─────────────────────────────────────────┘
│
├─ Query D: Invalidate other tokens
│  ┌─────────────────────────────────────────┐
│  │ UPDATE password_reset_tokens SET       │
│  │ is_used=TRUE WHERE user_id=1 AND...   │
│  │ Result: 0 rows affected ✓             │
│  └─────────────────────────────────────────┘
│
└─ COMMIT; ✓
   All changes saved to database
```

---

## 🎨 Color-Coded Query Types

### 🟢 SELECT (Read) Queries
```sql
SELECT id FROM users WHERE email = 'user@test.com';
SELECT id FROM password_reset_tokens WHERE reset_token = 'abc123...';
```
✓ Safe, read-only  
✓ No data changes  

### 🟡 INSERT (Create) Queries
```sql
INSERT INTO password_reset_tokens (user_id, reset_token, expires_at)
VALUES (1, 'token123', DATE_ADD(NOW(), INTERVAL 1 HOUR));
```
✓ Creates new token  
✓ Runs once per reset request  

### 🔴 UPDATE (Modify) Queries
```sql
UPDATE users SET password_hash = 'scrypt:new:hash' WHERE id = 1;
UPDATE password_reset_tokens SET is_used = TRUE WHERE id = 5;
```
⚠️ Modifies existing data  
⚠️ Must be in transaction  

### ⚫ DELETE (Remove) Queries
```sql
DELETE FROM password_reset_tokens WHERE expires_at < NOW();
```
⚠️ Removes data permanently  
⚠️ Use only for cleanup  

---

## 📈 Timeline of Password Reset

```
T=0:00   User requests password reset
         │
         ├─ Query: Find user ✓
         ├─ Query: Insert token ✓
         └─ Email sent with link
             
T=0:05   User opens email and clicks link
         │
         └─ Frontend verifies token
            ├─ Query: Check token validity ✓
            └─ Shows password reset form
            
T=0:10   User enters new password
         │
         ├─ Frontend validates password
         └─ Submits password reset
            
T=0:11   Backend processes reset
         │
         ├─ START TRANSACTION
         ├─ Query: Verify token (again) ✓
         ├─ Query: Update password ✓
         ├─ Query: Mark token used ✓
         ├─ Query: Invalidate others ✓
         ├─ COMMIT
         └─ Return success message
            
T=0:12   User redirected to login
         │
         └─ Query: Login with new password ✓
            JWT token issued
            
T=1:00   Token expires (automatic)
         │
         └─ Expired tokens can't be used anymore
```

---

## 🔍 Query Decision Tree

```
User clicks "Forgot Password"?
│
├─ YES ─→ Query 1: SELECT (find user)
│         │
│         └─ User found?
│             ├─ YES ─→ Query 2: INSERT (create token)
│             │         └─ Email sent
│             │
│             └─ NO ──→ Message: "If email exists, link sent"
│                       (Security: don't reveal if email exists)
│
└─ NO ──→ User logs in normally
          Query: SELECT + verify password
```

---

## 🛡️ Security Checkpoints

```
Checkpoint 1: Email Exists?
├─ SELECT user WHERE email = 'input'
├─ If found → Continue
└─ If NOT → Return generic message (prevent email enumeration)

Checkpoint 2: Token Exists?
├─ SELECT token WHERE reset_token = 'input'
├─ If found → Continue
└─ If NOT → Error: "Invalid or expired token"

Checkpoint 3: Token Not Used?
├─ Check: is_used = FALSE
├─ If YES → Continue
└─ If NO → Error: "Invalid or expired token"

Checkpoint 4: Token Not Expired?
├─ Check: expires_at > NOW()
├─ If YES → Continue
└─ If NO → Error: "Invalid or expired token"

Checkpoint 5: Password Valid?
├─ Check: length >= 6
├─ Check: match confirmation
├─ If both OK → Continue
└─ If NOT → Error: "Password requirements not met"

Checkpoint 6: Transaction Success?
├─ Check: All 4 UPDATE queries succeed
├─ If ALL succeed → COMMIT
└─ If ANY fails → ROLLBACK (undo all changes)
```

---

## 📊 Query Performance

### Fast Queries (Use Indexes)
```sql
-- Uses idx_reset_token (< 1ms)
SELECT id FROM password_reset_tokens 
WHERE reset_token = 'abc123...';

-- Uses idx_user_id (< 1ms)
SELECT * FROM password_reset_tokens 
WHERE user_id = 1;
```

### Maintenance Queries (Scan Entire Table)
```sql
-- Scans all rows with expires_at < NOW()
DELETE FROM password_reset_tokens 
WHERE expires_at < NOW();
-- Time depends on table size, run during off-peak hours
```

---

## 🚨 Error Scenarios

### Error 1: Token Not Found
```
User sends: reset_token = 'invalid_token'

Query: SELECT id FROM password_reset_tokens 
       WHERE reset_token = 'invalid_token' ...

Result: ∅ (empty)

Response: "Invalid or expired reset token"
```

### Error 2: Token Expired
```
User sent token at: 14:00
Expiration set to: 15:00
User tries to use at: 15:30

Query: SELECT id FROM password_reset_tokens 
       WHERE expires_at > NOW() ...

Result: ∅ (expires_at = 15:00, NOW() = 15:30)

Response: "Invalid or expired reset token"
```

### Error 3: Token Already Used
```
User used token at: 14:15
User tries to use again: 14:20

Query: SELECT id FROM password_reset_tokens 
       WHERE is_used = FALSE ...

Result: ∅ (is_used = TRUE)

Response: "Invalid or expired reset token"
```

### Error 4: User Not Found
```
User enters email: nonexistent@test.com

Query: SELECT id FROM users 
       WHERE email = 'nonexistent@test.com' ...

Result: ∅ (user doesn't exist)

Response: "If email exists, reset link sent"
```

---

## 💾 Backup & Recovery

### Before Deploying to Production

```sql
-- Create backup table
CREATE TABLE password_reset_tokens_backup LIKE password_reset_tokens;

-- Backup existing data
INSERT INTO password_reset_tokens_backup 
SELECT * FROM password_reset_tokens;

-- Check backup
SELECT COUNT(*) FROM password_reset_tokens_backup;
```

### Disaster Recovery

```sql
-- If something goes wrong, restore from backup
TRUNCATE password_reset_tokens;

INSERT INTO password_reset_tokens 
SELECT * FROM password_reset_tokens_backup;
```

---

## 📋 Quick Reference Card

| Operation | Query | Result |
|-----------|-------|--------|
| Find user | `SELECT id FROM users WHERE email=...` | user_id |
| Create token | `INSERT INTO password_reset_tokens...` | token_id |
| Verify token | `SELECT id FROM password_reset_tokens WHERE...` | ✓/✗ |
| Update pwd | `UPDATE users SET password_hash=...` | 1 row |
| Mark used | `UPDATE password_reset_tokens SET is_used=TRUE...` | 1 row |
| Cleanup | `DELETE FROM password_reset_tokens WHERE...` | N rows |

---

## 🎓 Learning Path

1. **Understand**: Read the database schema and table structure
2. **Learn**: Study Query 1-5 in order
3. **Practice**: Run test queries from QUICK_RESET_QUERIES.sql
4. **Verify**: Check results at each step
5. **Deploy**: Use complete transaction in production
6. **Monitor**: Track stats and clean old data

---

## ✅ Checklist Before Production

- [ ] Table created with correct schema
- [ ] All indexes created (idx_reset_token, idx_user_id, idx_expires_at)
- [ ] Foreign key to users table created
- [ ] Email service configured in backend
- [ ] Environment variables set (.env)
- [ ] Test complete flow locally
- [ ] Database backup created
- [ ] Monitoring queries tested
- [ ] Cleanup schedule set
- [ ] Error handling verified

---

Happy password resetting! 🎉
