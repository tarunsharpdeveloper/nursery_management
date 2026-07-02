# NTT DATA Payment Gateway - Testing Guide

## What Was Fixed

### 1. Encryption Key Issue
- **Problem**: The encryption key was 34 characters, causing "Invalid key length" error
- **Solution**: Updated encryption/decryption functions to properly handle the key:
  - Detects if key is hex or ASCII format
  - Converts to exactly 32 bytes for AES-256-CBC
  - Pads or truncates as needed

### 2. Correct UAT Credentials
- **Updated Merchant ID**: 317159 (was 446442)
- **Updated API URL**: https://paynetzuat.atomtech.in/ots/aipay/auth
- All other credentials remain the same from the UAT documentation

### 3. Files Updated
- `backend/routes/ndps-payment.js` - Fixed encryption functions
- `backend/.env` - Updated with correct UAT credentials

## Current Configuration

```
Merchant ID: 317159
Password: Test@123
Product: NSE
API URL: https://paynetzuat.atomtech.in/ots/aipay/auth
Encryption Key: A4476C2062FFA58980DC8F79EB6A799E
Decryption Key: 75AEF0FA1B94B3C10D4F5B268F757F11
Request Hash Key: KEY123657234
Response Hash Key: KEYRESP123657234
```

## Testing Steps

### 1. Test Payment Flow
1. Navigate to: http://localhost:3000/products
2. Add any product to cart
3. Go to cart: http://localhost:3000/cart
4. Click "Proceed to Checkout"
5. Fill in customer details:
   - Name: Test User
   - Email: test@example.com
   - Mobile: 9876543210 (any valid 10-digit number starting with 6-9)
   - Address, City, State, Pincode
6. Click "Proceed to Payment"

### 2. Expected Behavior
- Backend will create an order and payment record
- Data will be encrypted using the fixed encryption function
- Form will auto-submit to NDPS gateway with:
  - MERCHID: 317159
  - ENCDATA: (encrypted payload)
- You'll be redirected to NTT DATA payment page
- Complete payment on their UAT page
- After payment, you'll be redirected back to callback URL

### 3. Callback Handling
- Success: http://localhost:3000/payment/success
- Failed: http://localhost:3000/payment/failed
- Backend will decrypt response and update order status

## Backend Endpoints

1. **POST** `/api/payments/ndps/initiate`
   - Creates order and returns encrypted payment data
   
2. **POST** `/api/payments/ndps/callback`
   - Handles payment gateway response
   
3. **GET** `/api/payments/ndps/status/:transactionId`
   - Query payment status

## Troubleshooting

### If encryption still fails:
- Check backend console for error details
- Verify .env file is loaded (restart backend after .env changes)

### If payment page doesn't load:
- Check Network tab in browser dev tools
- Verify the API URL is correct
- Check if ENCDATA is being generated

### If callback fails:
- Check backend logs for decryption errors
- Verify response format matches expected structure

## Database Tables Affected

- `orders` - Order records with payment status
- `order_items` - Line items for each order
- `payments` - Payment transaction records with gateway response

## Notes

- Cart is cleared after successful payment initiation
- Order status: `received` → `approved` (on successful payment)
- Payment status: `pending` → `paid` (on successful payment)
- UAT environment allows testing without real money
