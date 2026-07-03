# NDPS Payment Response Handler Integration

## Overview
This document explains the payment response flow for NDPS (NTT DATA Payment Services) integration, including the popup redirect mechanism and response handling.

## Architecture

### Payment Flow

```
1. Checkout Page
   ↓
2. NDPSPayment Component
   ├─ Calls: POST /api/ndps/initiate (with returnUrl)
   ├─ Receives: atomTokenId, merchId, returnUrl
   └─ Opens: NDPS Popup (AtomPaynetz)
   ↓
3. NDPS Popup (External Payment Gateway)
   ├─ User completes payment
   └─ NDPS redirects to: returnUrl (http://localhost:3000/Response)
   ↓
4. Response Page (/Response)
   ├─ Checks payment status from backend
   └─ Shows success/failure message
   ↓
5. Backend (Server-to-Server)
   ├─ NDPS also sends encrypted response to: POST /api/ndps/response
   ├─ Decrypts and updates payment status in database
   └─ Updates order status
```

## Implementation Details

### 1. Frontend: Payment Initiation Component
**File:** `frontend/src/components/NDPSPayment.tsx`

- Dynamically loads AtomPaynetz script
- Calculates proper `returnUrl` based on client's host
- Sends returnUrl to backend when initiating payment
- Stores payment metadata in localStorage for response page

```javascript
const returnUrl = `${protocol}//${host}/Response`;
```

### 2. Backend: Payment Initiation Endpoint
**File:** `backend/routes/ndps-payments.js` → `initiateNDPSPayment()`

Changes made:
- Accepts optional `returnUrl` parameter from frontend
- Falls back to configured default if not provided
- Uses provided returnUrl in payment request extras
- Returns the final returnUrl to frontend

```javascript
const finalReturnUrl = returnUrl || config.returnUrl;
```

### 3. Frontend: Response Handler Page
**File:** `frontend/src/app/Response/page.tsx`

Key features:
- ✅ Receives redirect from NDPS popup after transaction
- ✅ Retrieves payment ID from localStorage
- ✅ Queries backend for payment status
- ✅ Displays appropriate success/failure UI
- ✅ Auto-redirects to checkout or confirmation page

**Status Flow:**
- **Pending:** Polls backend every 2 seconds (server-to-server callback may still be processing)
- **Paid:** Shows success message, redirects to order confirmation
- **Failed:** Shows error message, redirects back to checkout

### 4. Backend: Response Callback Handler
**File:** `backend/routes/ndps-payments.js` → `handleNDPSResponse()`

This endpoint handles server-to-server callbacks from NDPS:
- Configured as: POST `/api/ndps/response`
- Receives encrypted transaction data from NDPS servers
- Decrypts the response using AES-256-CBC with PBKDF2
- Updates payment and order status in database
- Verifies transaction signature (if provided)

**Response Configuration in backend/.env:**
```
NDPS_RESPONSE_URL=http://localhost:4000/api/ndps/response
```

## URL Configuration

### Environment Variables

**Backend (.env):**
```
# NDPS Endpoints
NDPS_API_URL=https://caller.atomtech.in/ots/aipay/auth          # For UAT
NDPS_RESPONSE_URL=http://localhost:4000/api/ndps/response        # Server-to-server callback
NDPS_RETURN_URL=http://localhost:3000/payment/return             # Fallback return URL

# For production, use:
NDPS_API_URL=https://paynetz.atomtech.in/ots/aipay/auth
```

### URL Meanings

| URL | Purpose | Direction | Receiver |
|-----|---------|-----------|----------|
| `http://localhost:3000/Response` | User redirect after popup | Client → Browser → Frontend | `/Response` page |
| `http://localhost:4000/api/ndps/response` | Server callback | NDPS → Backend API | `/api/ndps/response` endpoint |
| `http://localhost:3000/payment/return` | Fallback return URL | Fallback | Not directly used |

## Request-Response Cycle

### 1. Initiate Payment (Frontend → Backend)
```javascript
POST /api/ndps/initiate
{
  "orderId": 123,
  "amount": 1000,
  "customerEmail": "user@example.com",
  "customerMobile": "9876543210",
  "returnUrl": "http://localhost:3000/Response"  // NEW
}
```

**Response:**
```javascript
{
  "success": true,
  "paymentId": 5,
  "atomTokenId": 1234567890,
  "merchId": "446442",
  "merchTxnId": "NURSERY_123_xyz123",
  "customerEmail": "user@example.com",
  "customerMobile": "9876543210",
  "returnUrl": "http://localhost:3000/Response",
  "env": "uat"
}
```

### 2. NDPS Popup Opens
- Frontend creates AtomPaynetz instance with token
- Popup opens, user completes payment
- NDPS processes transaction

### 3. Popup Redirects (NDPS → Browser)
After transaction:
```
Browser redirect: http://localhost:3000/Response
```

### 4. Server-to-Server Callback (NDPS → Backend)
```javascript
POST /api/ndps/response
{
  "encData": "encrypted_response_data",
  "merchId": "446442"
}
```

The backend decrypts and updates payment status.

### 5. Response Page Checks Status (Frontend → Backend)
```javascript
GET /api/ndps/status/{paymentId}
```

**Response:**
```javascript
{
  "paymentId": 5,
  "orderId": 123,
  "orderNumber": "ORD-2024-123",
  "status": "paid",
  "amount": "1000.00",
  "paidAt": "2024-07-03T10:30:45Z",
  "gatewayPaymentId": "NURSERY_123_xyz123"
}
```

## Response Page Behavior

### Success Flow
1. Payment status returns: `paid`
2. Shows ✅ success message with order details
3. Auto-redirects to checkout confirmation after 2 seconds
4. URL: `/checkout?orderNumber=ORD-2024-123&success=true`

### Failure Flow
1. Payment status returns: `failed`
2. Shows ❌ error message
3. Auto-redirects to checkout after 3 seconds
4. URL: `/checkout?payment=failed`

### Pending Flow (Retry)
1. Payment status returns: `pending`
2. Shows ⏳ processing message
3. Auto-reloads page after 2 seconds
4. Rechecks status (in case server-to-server callback is still processing)

## Local Testing

### 1. Start Backend
```bash
cd backend
npm start
# Runs on http://localhost:4000
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### 3. Test Payment Flow
1. Go to Checkout
2. Enter product and customer details
3. Click "Pay Now"
4. Complete NDPS popup with test card (UAT)
5. You'll be redirected to `/Response` page
6. Wait for status check
7. See success/failure message

### 4. Monitor Logs

**Frontend Console:**
- Payment initiation logs
- Return URL calculation
- Status check requests

**Backend Console:**
- Payment initiation logs
- Encryption/decryption logs
- Database updates

## Troubleshooting

### Issue: Response page shows "Payment session not found"
**Solution:** Payment ID not saved to localStorage. Check:
1. NDPSPayment component saves payment ID before opening popup
2. Response page runs in same browser session

### Issue: Status check returns 404
**Solution:** Payment record not found in database. Check:
1. Payment was actually created in initiate endpoint
2. Payment ID from localStorage matches database

### Issue: Server-to-Server callback never arrives
**Solution:** NDPS can't reach your backend. Check:
1. `NDPS_RESPONSE_URL` is correct and publicly accessible
2. Backend is running and accepting POST requests
3. Firewall/proxy not blocking the callback

### Issue: Decryption fails on response page
**Solution:** Likely the server-to-server callback is still being processed. The response page automatically retries every 2 seconds during pending state.

## Security Considerations

1. **Encryption:** All NDPS payloads use AES-256-CBC with PBKDF2
2. **Signature Verification:** Backend verifies HMAC-SHA-512 signatures on responses
3. **localStorage:** Only stores payment ID, not sensitive data
4. **HTTPS:** Use HTTPS in production for all URLs
5. **Timeout:** Response page has built-in retry logic for network delays

## Integration with Reference Implementation

This implementation follows the pattern from `nttdatapay-nodejs-main`:

1. ✅ Same encryption methodology (AES-256-CBC with PBKDF2)
2. ✅ Same response structure parsing
3. ✅ Popup redirect pattern with dedicated response handler
4. ✅ Server-to-server callback for payment confirmation
5. ✅ Requery functionality for status checks

## Files Modified

1. **frontend/src/app/Response/page.tsx** (NEW)
   - Handles NDPS popup redirect
   - Checks payment status
   - Shows result to user

2. **frontend/src/components/NDPSPayment.tsx** (UPDATED)
   - Calculate and pass returnUrl to backend
   - Store payment metadata for response page

3. **backend/routes/ndps-payments.js** (UPDATED)
   - Accept returnUrl parameter
   - Use dynamic returnUrl in payment request
   - Return final returnUrl in response

4. **backend/app.js**
   - Route already configured: `POST /api/ndps/response`
   - Route already configured: `GET /api/ndps/status/:paymentId`

## Next Steps

1. ✅ Test with UAT credentials
2. ✅ Verify server-to-server callback works
3. ✅ Test all response scenarios (success, failure, timeout)
4. ✅ Update production URLs in environment
5. ✅ Deploy and test with production credentials
