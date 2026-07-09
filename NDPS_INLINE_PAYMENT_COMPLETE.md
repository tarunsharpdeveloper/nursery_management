# ✅ NDPS Inline Payment Integration - COMPLETE

## Executive Summary

The NDPS (NTT DATA Payment Services) inline payment flow has been **fully implemented and tested**. Users can now complete payments directly on the checkout page without being redirected to an external confirmation page.

**Key Achievement**: Payment processing happens inline, showing the NDPS popup on the same checkout page, and redirects to a success page only after payment is complete.

---

## 📋 Implementation Overview

### Architecture

```
User fills checkout form
    ↓
Selects NDPS payment method
    ↓
Clicks "Place Order" button
    ↓
Order created in database (returns orderId)
    ↓
Payment card appears INLINE on same page (showPayment state = true)
    ↓
User clicks "Pay Now" button
    ↓
NDPS popup opens (AtomPaynetz)
    ↓
User completes payment in popup
    ↓
NDPS sends encrypted POST to /Response endpoint
    ↓
Backend decrypts, updates payment status
    ↓
Browser redirects to /checkout?success=true&orderNumber=XXX
    ↓
Frontend shows success page with order confirmation
```

---

## ✨ Features Implemented

### 1. Inline Payment Component (Frontend)
- **File**: `frontend/src/components/NDPSPayment.tsx`
- **Features**:
  - Dynamically loads AtomPaynetz script from CDN
  - "Pay Now" button with payment icon
  - Shows order amount and payment description
  - Loading states during payment initiation
  - Error handling with user-friendly messages
  - Supported payment methods: Cards, Debit Card, Net Banking, UPI, Wallets

### 2. Checkout Flow Restructure (Frontend)
- **File**: `frontend/src/app/checkout/page.tsx`
- **Changes**:
  - Added `showPayment` state to toggle between form and payment card
  - Payment component shown inline when user selects NDPS and clicks "Place Order"
  - "Back to Checkout" button to return to form if needed
  - URL-based success/error detection
  - Success banner with payment confirmation
  - Error banner with dismissible × button

### 3. Form Data Parsing (Backend)
- **File**: `backend/http.js`
- **Function**: `readFormData(req)`
- **Purpose**: Parse NDPS popup POST data which is form-encoded, not JSON
- **Implementation**: Uses URLSearchParams to convert form data to object

### 4. Response Handler (Backend)
- **File**: `backend/routes/ndps-payments.js`
- **Function**: `handleNDPSPopupResponse(req, res, helpers)`
- **Features**:
  - Receives form-encoded POST data from NDPS popup
  - Decrypts encrypted response using AES-256-CBC
  - Handles both object and array formats for `payInstrument`
  - Verifies response signature
  - Updates payment and order status in database
  - Redirects to frontend with success/failure URL
  - Includes order number and payment status in redirect

### 5. Environment Configuration
- **File**: `backend/.env`
- **Key Variables**:
  - `CORS_ORIGIN`: Used for all redirect URLs (defaults to http://localhost:3000)
  - `NDPS_MERCH_ID`: Merchant ID (446442 for UAT)
  - `NDPS_RETURN_URL`: Popup response endpoint (http://localhost:4000/Response)
  - `NDPS_REQUEST_KEY` / `NDPS_RESPONSE_KEY`: Encryption keys
  - `NDPS_PASSWORD`: Test password (Test@123 for UAT)

### 6. Route Configuration
- **File**: `backend/app.js` - Line 139
- **Route**: `["POST", "/Response", null, handleNDPSPopupResponse]`
- **Purpose**: Handles NDPS popup POST response

---

## 🔄 Complete User Flow

### Step 1: Checkout Form
```
User enters:
- Name, Email, Phone
- Address, City, Zip
Selects payment method: NDPS (💳 Pay Online)
```

### Step 2: Place Order
```
User clicks "Place Order" button
- Validates phone number (10 digits)
- Creates order in database
- Returns orderId and orderNumber
- Cart is cleared
- Payment component shown inline
```

### Step 3: Payment Card Display
```
Order summary shows:
- Order ID/Number
- Payment amount (₹X.XX)
- Customer name
- "Pay Now" button

User can click "Back to Checkout" to:
- Return to form
- Change payment method
- Exit payment flow
```

### Step 4: Payment Processing
```
User clicks "Pay Now"
- AtomPaynetz popup opens
- User selects payment method (Card/UPI/NetBanking/etc)
- User enters payment details
- User confirms payment
```

### Step 5: NDPS Response
```
NDPS sends encrypted POST to http://localhost:4000/Response
Backend:
1. Receives form-encoded data
2. Decrypts encrypted response
3. Extracts transaction details
4. Updates payment status in DB (paid/failed)
5. Updates order status in DB
6. Sends 302 redirect to frontend
```

### Step 6: Success Page
```
Browser redirected to:
http://localhost:3000/checkout?success=true&orderNumber=149

Frontend:
1. Detects URL parameters
2. Shows success banner (Green with checkmark)
3. Displays order confirmation page
4. Shows "Track Order" and "Continue Shopping" buttons
5. Cleans URL using window.history.replaceState
```

---

## 🔐 Security Features

### Encryption
- **Algorithm**: AES-256-CBC
- **Key Derivation**: PBKDF2 (65536 iterations, sha512)
- **Implementation**: Handles both request and response encryption

### Signature Verification
- Verifies NDPS response signature using HMAC
- Ensures data integrity and authenticity
- Validates merchant credentials

### CORS Protection
- All URLs use CORS_ORIGIN environment variable
- Flexible for different environments (localhost, staging, production)
- No hardcoded domain dependencies

### Database Security
- Payment records created with unique merchant transaction ID
- Payment status tracked (pending → paid/failed)
- Transaction details logged for audit trail
- Order status synchronized with payment status

---

## 📊 Data Flow

### Request Payload (Frontend → Backend)
```json
{
  "orderId": 148,
  "amount": 1.00,
  "customerEmail": "user@example.com",
  "customerMobile": "1234567890"
}
```

### Response Payload (Backend → Frontend)
```json
{
  "success": true,
  "paymentId": 136,
  "atomTokenId": 15000000953883,
  "merchId": "446442",
  "merchTxnId": "NURSERY_148_mr4qoqx8",
  "customerEmail": "user@example.com",
  "customerMobile": "1234567890",
  "returnUrl": "http://localhost:4000/Response",
  "env": "uat"
}
```

### NDPS Popup Response (Decrypted)
```json
{
  "payInstrument": {
    "merchDetails": {
      "merchId": 446442,
      "merchTxnId": "NURSERY_148_mr4qoqx8",
      "merchTxnDate": "2026-07-03T15:07:07"
    },
    "payDetails": {
      "atomTxnId": 11000000769891,
      "amount": 1.00,
      "surchargeAmount": 0.06,
      "totalAmount": 1.06,
      "custAccNo": "148",
      "txnCurrency": "INR"
    },
    "responseDetails": {
      "statusCode": "OTS0000",
      "message": "SUCCESS",
      "description": "TRANSACTION IS SUCCESSFUL."
    }
  }
}
```

---

## 🧪 Testing & Verification

### Test Card Credentials (UAT)
- **Card Number**: `8881 8881 8881 8881`
- **CVV**: `123`
- **Expiry**: `12/25`
- **Environment**: https://pgtest.atomtech.in

### Test Scenario: Successful Payment
1. Fill checkout form with valid data
2. Select NDPS payment method
3. Click "Place Order"
4. Payment card appears inline
5. Click "Pay Now"
6. NDPS popup opens
7. Enter test card details
8. Complete payment
9. Browser redirects to success page
10. Success banner displays with order number

### Expected Logs (Backend)
```
=== NDPS Popup Response Handler ===
Received form-encoded data, encData length: 2048
Encrypted response received from popup
=== Decrypted Popup Response ===
{...transaction details...}
=== Parsed Response Data ===
{...full response...}
=== Transaction Details ===
{...extracted details...}
Extracted Details:
- Merchant Txn ID: NURSERY_148_mr4qoqx8
- Status Code: OTS0000
- Status Message: SUCCESS
- Atom Txn ID: 11000000769891
- Total Amount: 1.06
✅ Signature verified successfully
=== Payment Updated ===
Payment ID: 136
Order ID: 148
New Status: paid
Redirecting to: http://localhost:3000/checkout?orderNumber=149&success=true
```

---

## ⚙️ Configuration for Different Environments

### Development (Current)
```env
CORS_ORIGIN=http://localhost:3000
NDPS_RETURN_URL=http://localhost:4000/Response
NDPS_RESPONSE_URL=http://localhost:4000/api/ndps/response
NDPS_API_URL=https://caller.atomtech.in/ots/aipay/auth (UAT)
```

### Production
```env
CORS_ORIGIN=https://nursery.jyada.in
NDPS_RETURN_URL=https://nursery.jyada.in/payment/return
NDPS_RESPONSE_URL=https://nursery.jyada.in/api/ndps/response
NDPS_API_URL=https://paynetz.atomtech.in/ots/aipay/auth (Production)
NDPS_MERCH_ID=<production_merchant_id>
NDPS_PASSWORD=<production_password>
NDPS_REQUEST_KEY=<production_request_key>
NDPS_RESPONSE_KEY=<production_response_key>
```

### Staging
```env
CORS_ORIGIN=https://staging.nursery.jyada.in
NDPS_RETURN_URL=https://staging.nursery.jyada.in/payment/return
NDPS_RESPONSE_URL=https://staging.nursery.jyada.in/api/ndps/response
NDPS_API_URL=https://caller.atomtech.in/ots/aipay/auth (UAT)
```

---

## 📁 Files Modified/Created

### Frontend
- ✅ `frontend/src/app/checkout/page.tsx` - Inline payment flow
- ✅ `frontend/src/components/NDPSPayment.tsx` - Payment component
- ✅ `frontend/.env` - API configuration

### Backend
- ✅ `backend/routes/ndps-payments.js` - Payment handlers + CORS_ORIGIN usage
- ✅ `backend/http.js` - Form data parser
- ✅ `backend/app.js` - Route configuration
- ✅ `backend/.env` - NDPS and CORS configuration

---

## 🚀 Deployment Checklist

- [ ] Update `backend/.env` with production NDPS credentials
- [ ] Update `backend/.env` with production `CORS_ORIGIN`
- [ ] Update `NDPS_API_URL` to production endpoint (paynetz.atomtech.in)
- [ ] Update `NDPS_RETURN_URL` to production domain
- [ ] Update `NDPS_RESPONSE_URL` to production domain
- [ ] Update `frontend/.env` with production `NEXT_PUBLIC_API_BASE_URL`
- [ ] Verify SSL certificate (HTTPS required)
- [ ] Test end-to-end payment flow in production
- [ ] Monitor logs for any decryption/encoding errors
- [ ] Set up error monitoring and alerts
- [ ] Document production NDPS merchant credentials securely

---

## 🐛 Troubleshooting

### Issue: "Payment system is still loading"
- **Cause**: AtomPaynetz script not loaded from CDN
- **Solution**: Check network tab, ensure CDN is accessible
- **Fallback**: Use Cash on Delivery

### Issue: "Invalid response from payment gateway"
- **Cause**: Backend not returning proper token response
- **Solution**: Check backend logs for encryption errors
- **Debug**: Verify NDPS credentials in `.env`

### Issue: "Signature mismatch"
- **Cause**: Response keys or transaction data corrupted
- **Solution**: Verify `NDPS_RESPONSE_KEY` in `.env`
- **Debug**: Check decryption logs for data integrity

### Issue: "Payment record not found"
- **Cause**: Order/payment not created properly
- **Solution**: Check order creation endpoint
- **Debug**: Verify order ID matches merchant transaction ID

### Issue: Redirect loop after payment
- **Cause**: `CORS_ORIGIN` has trailing slash or wrong domain
- **Solution**: Check `.env` - should be `http://localhost:3000` (no trailing slash)
- **Debug**: Verify redirect URL in response handler logs

---

## 📝 Notes

### Why Inline Payment?
- **Better UX**: No redirect to external page
- **Order Visibility**: User sees order details before payment
- **Error Recovery**: Can go back and retry without page reload
- **Mobile-Friendly**: Smoother experience on mobile devices

### Why Form Encoding for NDPS Response?
- NDPS sends popup responses as form-encoded POST, not JSON
- This is different from server-to-server callbacks
- Frontend JavaScript redirect handles the response

### Encryption Details
- NDPS uses AES-256-CBC with PBKDF2 key derivation
- This is more secure than simple base64 encoding
- Keys are environment-specific (dev vs. prod)
- All sensitive data is encrypted in transit

---

## 🎯 Success Metrics

✅ Payment initiated successfully from inline form
✅ NDPS popup opens without page redirect
✅ Form-encoded POST data handled correctly
✅ Encrypted response decrypted successfully
✅ Payment status updated in database
✅ Order status synchronized with payment
✅ Browser redirected to success page
✅ Success banner displays with order number
✅ "Track Order" and "Continue Shopping" links work
✅ "Back to Checkout" button functional
✅ All environment variables configurable
✅ Production-ready with CORS_ORIGIN flexibility

---

## 📞 Support & References

### NDPS Documentation
- API Reference: Transaction API (Non-seamless) v2.2
- Environment: UAT (https://caller.atomtech.in) and Prod (https://paynetz.atomtech.in)
- Merchant ID: 446442 (UAT Test Account)

### Code References
- Encryption: AES-256-CBC with PBKDF2
- HTTP Framework: Node.js native http module
- Frontend: Next.js 14 with TypeScript
- Payment Gateway: NTT DATA Payment Services (Atom Paynetz)

---

**Last Updated**: July 3, 2026
**Status**: ✅ PRODUCTION READY
**Version**: 1.0 - Inline Payment Complete
