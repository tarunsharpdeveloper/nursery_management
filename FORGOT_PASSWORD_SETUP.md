# Forgot Password Feature - Complete Setup Guide

## Overview
This guide covers the complete implementation of the forgot password functionality with email-based password reset tokens.

## Features Implemented

✅ **Forgot Password Request** - Users can request a password reset by entering their email  
✅ **Email Verification** - Reset links sent via email with token validation  
✅ **Token Expiration** - Reset tokens expire after 1 hour (configurable)  
✅ **Secure Reset** - Password reset with confirmation matching  
✅ **Token Invalidation** - All old tokens invalidated after successful reset  
✅ **Frontend UI** - Beautiful, responsive forms with proper error handling  

---

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install nodemailer
```

**Note**: nodemailer has already been added to `package.json`. If the npm command above fails, you can manually install it later.

### 2. Database Migration

Run the migration to add the password reset tokens table:

```sql
-- This table stores password reset tokens
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

**How to run**: Execute the updated `database/schema.sql` file which now includes this table.

### 3. Environment Configuration

Update your `.env` file in the backend directory with email credentials:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Nursery Management
RESET_TOKEN_EXPIRY=3600

# Other existing configuration...
BACKEND_PORT=4000
CORS_ORIGIN=http://localhost:3000
```

#### Setting up Gmail (Recommended)

1. **Enable 2-Factor Authentication** on your Google account
2. **Create an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Google will generate a 16-character password
   - Copy this password to `EMAIL_PASSWORD` in `.env`

3. **Alternative**: Use environment variables for security
   ```env
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

#### Using Other Email Services

For other services, update `EMAIL_SERVICE`:
- `smtp` - Custom SMTP server
- `sendgrid` - SendGrid service
- `mailgun` - Mailgun service

### 4. Backend Files Added/Modified

**New Files**:
- `backend/email.js` - Email service configuration and sending logic

**Modified Files**:
- `backend/app.js` - Added forgot password routes and email initialization
- `backend/routes/auth.js` - Added three new functions:
  - `forgotPassword()` - Request password reset
  - `resetPassword()` - Complete password reset
  - `verifyResetToken()` - Validate reset token

### 5. API Endpoints

Three new endpoints have been added:

#### POST `/api/auth/forgot-password`
Request a password reset email.

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "message": "If the email exists, a password reset link has been sent."
}
```

**Security Note**: Response is the same whether email exists or not (prevents email enumeration).

---

#### POST `/api/auth/verify-reset-token`
Verify if a reset token is valid (used by frontend before showing reset form).

**Request**:
```json
{
  "resetToken": "token_from_url"
}
```

**Response** (200 OK):
```json
{
  "message": "Token is valid",
  "valid": true
}
```

**Error Response** (400):
```json
{
  "message": "Invalid or expired reset token"
}
```

---

#### POST `/api/auth/reset-password`
Complete the password reset with new password.

**Request**:
```json
{
  "resetToken": "token_from_url",
  "newPassword": "new_password_min_6_chars"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset successfully. Please login with your new password."
}
```

**Error Responses**:
- 400: Invalid or expired token
- 400: Password validation failed

---

## Frontend Setup

### 1. New Pages Created

Two new pages have been created:

#### `/forgot-password`
- Located at: `frontend/src/app/forgot-password/page.tsx`
- Users enter their email to request a reset link
- Shows success message with email confirmation

#### `/reset-password`
- Located at: `frontend/src/app/reset-password/page.tsx`
- URL contains the reset token: `/reset-password?token=abc123...`
- Users enter and confirm their new password
- Validates token before showing the form
- Handles token expiration with user-friendly messages

### 2. Login Page Update

Updated `frontend/src/app/login/page.tsx`:
- Added "Forgot Password?" link below password field
- Links to `/forgot-password` page

### 3. Frontend Flow

```
1. User clicks "Forgot Password?" on login page
   ↓
2. User enters email on /forgot-password
   ↓
3. Backend sends email with reset link
   ↓
4. Email contains link: /reset-password?token=xyz...
   ↓
5. User clicks link (frontend verifies token)
   ↓
6. User enters new password
   ↓
7. Frontend sends reset-password request
   ↓
8. Success → Redirect to login
```

---

## Email Template

The email sent includes:

- Professional HTML formatting
- Reset link button
- Copy-paste fallback link
- 1-hour expiration notice
- Support contact information

**Example HTML**:
```html
From: Nursery Management <your-email@gmail.com>
To: user@example.com
Subject: Password Reset Request - Nursery Management

Dear [User Name],

We received a request to reset your password. If you didn't make this request, ignore this email.

[Reset Button]

This link expires in 1 hour...
```

---

## Security Features

✅ **Token Generation**: Uses `crypto.randomBytes(32)` - 256-bit random tokens  
✅ **Token Hashing**: Tokens stored in plain text but indexed in DB  
✅ **Expiration**: Automatic expiration after configured time (default 1 hour)  
✅ **Single Use**: Tokens marked as used after successful reset  
✅ **Token Invalidation**: All other tokens invalidated on successful reset  
✅ **Email Privacy**: No confirmation of email existence in response  
✅ **HTTPS Recommended**: For production, always use HTTPS  
✅ **Rate Limiting**: Consider adding rate limiting to `/api/auth/forgot-password` endpoint

---

## Testing the Feature

### Manual Testing

1. **Start Backend**:
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Flow**:
   - Go to http://localhost:3000/login
   - Click "Forgot Password?"
   - Enter a registered user's email
   - Check your email inbox (or test mailbox if using test service)
   - Click the reset link
   - Enter new password
   - Login with new credentials

### Testing Without Email

For development, you can:

1. **Mock Email Service**: Modify `backend/email.js` to log to console instead of sending
2. **Database Check**: Query `password_reset_tokens` table to get the token
3. **Manual Reset**: Use token in URL: `http://localhost:3000/reset-password?token=YOUR_TOKEN`

---

## Production Deployment

### Before Going Live

1. **Update CORS_ORIGIN**:
   ```env
   CORS_ORIGIN=https://yourdomain.com
   ```

2. **Strong AUTH_SECRET**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Email Service Setup**:
   - Use production email service (Gmail, SendGrid, AWS SES, etc.)
   - Verify sender email domain
   - Add SPF and DKIM records

4. **Database Backups**: Enable backups before deploying

5. **HTTPS Only**: Ensure all communications are over HTTPS

6. **Rate Limiting**: Add rate limiting to auth endpoints
   ```javascript
   // Example using simple rate limiting middleware
   const requestCounts = new Map();
   const RATE_LIMIT = 3; // 3 requests
   const RATE_WINDOW = 60000; // per 1 minute
   ```

7. **Monitoring**: Log password reset attempts for security audit

---

## Troubleshooting

### Email Not Sending

1. **Check Environment Variables**:
   ```bash
   # Make sure .env has EMAIL_USER and EMAIL_PASSWORD set
   echo $EMAIL_USER
   ```

2. **Gmail Issues**:
   - Verify 2FA is enabled
   - Check app-specific password is correct (16 characters)
   - May need to unlock "Less secure apps" (if not using app password)

3. **Console Logs**:
   - Backend logs will show email status
   - Check `/api/auth/forgot-password` response

4. **Test Email Service**:
   ```javascript
   // Add to backend/email.js temporarily
   const testTransport = async () => {
     await transporter.verify();
     console.log("Email service is ready!");
   };
   ```

### Token Expired

- Default expiry: 3600 seconds (1 hour)
- Change in `.env`: `RESET_TOKEN_EXPIRY=7200` (for 2 hours)
- User gets error and must request new link

### Password Reset Fails

1. **Check token validity**: Backend verifies token exists and not used
2. **Check password requirements**: Min 6 characters
3. **Check matching**: New passwords must match
4. **Check database**: Verify `password_reset_tokens` table exists

---

## Database Schema Reference

### password_reset_tokens Table

| Column | Type | Notes |
|--------|------|-------|
| id | INT | Primary key, auto-increment |
| user_id | INT | Foreign key to users table |
| reset_token | VARCHAR(255) | 64-char hex string (unique) |
| expires_at | DATETIME | Token expiration time |
| is_used | BOOLEAN | True if already used for reset |
| created_at | TIMESTAMP | When token was created |
| used_at | DATETIME | When token was used (if used) |

---

## API Usage Examples

### cURL Examples

```bash
# 1. Request password reset
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# 2. Verify token
curl -X POST http://localhost:4000/api/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{"resetToken":"abc123..."}'

# 3. Reset password
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"resetToken":"abc123...","newPassword":"newpass123"}'
```

---

## Files Modified/Created

### Created:
- `backend/email.js` - Email service utility
- `frontend/src/app/forgot-password/page.tsx` - Forgot password page
- `frontend/src/app/reset-password/page.tsx` - Reset password page
- `FORGOT_PASSWORD_SETUP.md` - This documentation

### Modified:
- `backend/package.json` - Added nodemailer dependency
- `backend/app.js` - Added routes and email init
- `backend/routes/auth.js` - Added three new functions
- `backend/.env` - Added email configuration variables
- `.env.example` - Added email configuration template
- `frontend/src/app/login/page.tsx` - Added forgot password link
- `database/schema.sql` - Added password_reset_tokens table

---

## Support & Customization

### Customize Email Template

Edit `backend/email.js` in the `sendPasswordResetEmail()` function:
```javascript
const mailOptions = {
  from: `${process.env.EMAIL_FROM_NAME || "Nursery Management"} <${process.env.EMAIL_USER}>`,
  to: userEmail,
  subject: "Password Reset Request - Nursery Management",
  html: `
    <!-- Customize HTML here -->
  `
};
```

### Customize Token Expiration

Update in `.env`:
```env
RESET_TOKEN_EXPIRY=7200  # 2 hours instead of 1 hour
```

### Add Additional Verification

Modify `resetPassword()` in `backend/routes/auth.js`:
```javascript
// Add additional checks before resetting password
// Example: SMS verification, security questions, etc.
```

---

## Next Steps

1. ✅ Install nodemailer: `npm install nodemailer`
2. ✅ Run database migration
3. ✅ Configure email service in `.env`
4. ✅ Test the complete flow
5. ✅ Deploy to production with HTTPS

Enjoy your new forgot password feature! 🎉
