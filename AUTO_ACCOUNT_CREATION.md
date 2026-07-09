# Auto Account Creation Feature

## Overview
Implemented automatic account creation functionality in the checkout form. When users check the "Create an account for later use" checkbox, an account is automatically created with a randomly generated password sent via email.

## Changes Made

### 1. Backend - Email Service (`backend/email.js`)
- Added `sendAccountCreationEmail()` function
- Sends welcome email with login credentials
- Includes:
  - User's email and auto-generated password
  - Security notice to change password
  - Direct login link
  - Professional HTML email template

### 2. Backend - Auth Routes (`backend/routes/auth.js`)
- Added `generateRandomPassword()` function
  - Generates 12-character secure password
  - Includes uppercase, lowercase, numbers, and symbols
  - Randomized and shuffled
  
- Added `autoCreateAccount()` endpoint
  - Validates user input (name, email, phone)
  - Checks if account already exists
  - Creates user account with customer role
  - Creates/updates customer record
  - Sends email with credentials asynchronously
  - Handles duplicate accounts gracefully

### 3. Backend - API Route (`backend/app.js`)
- Added new endpoint: `POST /api/auth/auto-create-account`
- Public endpoint (no authentication required)

### 4. Frontend - Checkout Page (`frontend/src/app/checkout/page.tsx`)
- Added state variables:
  - `createAccount` - Checkbox state
  - `accountCreationMessage` - Feedback message
  
- Added `handleCreateAccountChange()` function:
  - Validates form fields (name, email, phone)
  - Validates phone number format (10 digits)
  - Calls `/api/auth/auto-create-account` API
  - Shows success/error messages
  - Prevents duplicate account creation
  
- Updated checkbox UI:
  - No redirect to login page
  - Shows inline feedback message
  - Green background for success
  - Red background for errors
  - Disabled when user is already logged in

## User Flow

### Before (Old Behavior):
1. User checks "Create an account for later use"
2. Redirected to `/login?redirect=/checkout&mode=signup`
3. User must manually fill registration form
4. User creates their own password
5. User redirected back to checkout

### After (New Behavior):
1. User fills in Name, Email, and Phone in checkout form
2. User checks "Create an account for later use"
3. Account created automatically in background
4. Random secure password generated
5. Email sent with login credentials
6. Success message shown inline
7. User continues with checkout (no redirect)

## Email Template

Subject: **Welcome! Your Account Has Been Created - Nursery Management**

Content includes:
- Welcome message
- Login credentials (email + password)
- Security notice to change password
- Login button with link
- Professional branding

## Security Features

1. **Random Password Generation**:
   - 12 characters minimum
   - Mix of uppercase, lowercase, numbers, symbols
   - Cryptographically randomized

2. **Password Hashing**:
   - Uses scrypt algorithm
   - Salt generated automatically
   - Secure storage in database

3. **Duplicate Prevention**:
   - Checks for existing accounts
   - Returns success without creating duplicate
   - Prevents email conflicts

4. **Validation**:
   - Email format validation
   - Phone number validation (10 digits)
   - Name minimum length (2 characters)

## API Endpoint

**POST** `/api/auth/auto-create-account`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210"
}
```

**Response (Success):**
```json
{
  "message": "Account created successfully. Login credentials have been sent to your email.",
  "accountCreated": true
}
```

**Response (Already Exists):**
```json
{
  "message": "Account already exists",
  "accountExists": true
}
```

**Response (Error):**
```json
{
  "message": "Error message here"
}
```

## Testing

### Test Scenarios:
1. ✅ Create account with valid data
2. ✅ Try to create duplicate account
3. ✅ Validate email format
4. ✅ Validate phone number (10 digits)
5. ✅ Check if email is sent
6. ✅ Verify password works for login
7. ✅ Check when user already logged in

### Manual Testing:
1. Go to checkout page
2. Fill in Name, Email, Phone
3. Check "Create an account for later use"
4. Verify success message appears
5. Check email inbox for credentials
6. Use credentials to log in
7. Verify account created in database

## Environment Variables Required

**For Email Service:**
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Nursery Management
CORS_ORIGIN=http://localhost:3000
```

## Database Tables Used

1. **users** - Main user account
   - Stores hashed password
   - Links to role
   
2. **customers** - Customer profile
   - Stores phone, address, etc.
   
3. **roles** - Customer role
   - Used for permissions

## Benefits

1. **Better UX**: No page redirect, seamless checkout
2. **Convenience**: No manual password creation
3. **Security**: Strong random passwords
4. **Conversion**: Reduces friction in checkout process
5. **Email Marketing**: Users provide email for future communication
