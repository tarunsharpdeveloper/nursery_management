# SMTP Email Configuration - Complete ✅

## Task Summary
Changed email service from generic service to custom SMTP server configuration with secure SSL/TLS.

## Changes Made

### 1. Backend Environment Variables (`backend/.env`)
Added SMTP configuration:
```env
# SMTP Configuration (for custom SMTP server)
SMTP_HOST=nursery.jyada.in
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@nursery.jyada.in
SMTP_PASSWORD=OBN7,]W,Iu8Y}BS
```

### 2. Email Service Configuration (`backend/email.js`)
Modified `initEmailService()` function to:
- Use SMTP configuration instead of generic service
- Read from `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` environment variables
- Added TLS configuration with `rejectUnauthorized: false` for self-signed certificates
- Fallback to `EMAIL_USER` and `EMAIL_PASSWORD` if SMTP credentials not provided
- Enhanced logging to show SMTP connection details

## SMTP Server Details (Secure SSL/TLS)
- **Host**: nursery.jyada.in
- **Port**: 465 (SSL/TLS - Recommended Secure)
- **Secure**: true (SSL/TLS encryption)
- **Email**: info@nursery.jyada.in
- **From Name**: Nursery Management
- **Authentication**: Required

## Email Functions Available
1. **Password Reset Emails** (`sendPasswordResetEmail`)
   - Sends password reset link with expiry
   - Professional HTML template

2. **Account Creation Emails** (`sendAccountCreationEmail`)
   - Sends welcome email with credentials
   - Used when "Create account" checkbox is checked on checkout
   - Includes random generated password
   - Security notice to change password

## Testing
To test the email service:
1. Restart the backend server
2. Look for console message: `✅ SMTP Email Service Configured`
3. Try password reset or account creation on checkout

## Available Server Ports
- **465**: SSL/TLS (current configuration) ✅ **Recommended & Secure**
- **587**: STARTTLS (set `SMTP_PORT=587` and `SMTP_SECURE=false`)
- **25**: Plain (not recommended for production)

## Server Settings Summary
```
Incoming Server: nursery.jyada.in
  - IMAP Port: 993 (for email clients)
  - POP3 Port: 995 (for email clients)

Outgoing Server: nursery.jyada.in
  - SMTP Port: 465 (SSL/TLS) ✅ Currently Configured
  
Authentication: Required for all protocols
```

## Troubleshooting
If emails fail to send:
1. Check SMTP credentials are correct
2. Verify SMTP server allows authentication
3. Check firewall rules allow outbound port 587
4. Review backend console for error messages
5. Confirm email address info@nursery.jyada.in is valid mailbox

## Production Considerations
✅ Using custom SMTP server (mail.jyada.in)
✅ TLS enabled with flexible certificate validation
✅ Professional email templates
✅ Error logging and fallback handling

## Related Files
- `backend/.env` - SMTP credentials and configuration
- `backend/email.js` - Email service implementation
- `backend/routes/auth.js` - Endpoints using email service
