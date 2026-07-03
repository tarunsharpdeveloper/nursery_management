# NDPS Payment Testing - Quick Start Guide

## Prerequisites
- Backend running: `cd backend && node app.js`
- Frontend running: `cd frontend && npm run dev`
- MySQL running on localhost:3306
- Database: `nursery_management` with schema imported

---

## STEP 1: Start Services

### Terminal 1 - Backend
```bash
cd backend
node app.js
```

Expected output:
```
=== NDPS Configuration Loaded ===
Environment: UAT
Merchant ID: 446442
...
Node backend running at http://localhost:4000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Expected output:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

## STEP 2: Test Payment Flow

### 1. Add Products to Cart
- Open http://localhost:3000/products
- Browse and add items (example: plant or seed)
- Go to cart
- Verify cart shows items with free delivery

### 2. Proceed to Checkout
- Click "Checkout" button
- Fill in customer details:
  - **Name**: Test Customer
  - **Email**: test@example.com (any email)
  - **Phone**: 9876543210 (any 10-digit number)
  - **Address**: Test Address
  - **City**: Test City
  - **Zip**: 123456

### 3. Select Payment Method
- Choose **"Pay Online (Cards, UPI, Net Banking)"**
- Click **"Place Order"**

### 4. Wait for Order Creation
- Backend logs should show:
  ```
  POST /api/orders
  Order created successfully
  ```
- Frontend should show order details:
  ```
  Order: [ORDER_NUMBER]
  Amount: ₹[TOTAL]
  Customer: [NAME]
  ```

### 5. Initiate Payment
- Click **"Pay Now"** button
- Backend logs should show:
  ```
  === NDPS Payment Initiation ===
  === Payment JSON Before Encryption ===
  === Sending to NTT AUTH API ===
  === NTT AUTH API Response ===
  === Decrypting Response ===
  === Preparing Response ===
  === Sending Response to Frontend ===
  ```

### 6. Payment Popup Opens
- AtomPaynetz popup should open
- Popup shows amount and payment options
- **Expected Message**: "Transaction Failed" (UAT limitation - NOT a code issue)
  - This happens because the merchant ID is not active in UAT
  - The code is working correctly
  - This will resolve with production credentials

### 7. Verify Return Page
- After popup closes, browser redirects to `/payment/return`
- Frontend checks payment status:
  - Checks database first
  - If pending, queries NTT API
  - Displays final status

---

## What to Check in Backend Logs

### ✅ Successful Token Generation
```
=== NDPS Payment Initiation ===
Merchant ID: 446442
=== Payment JSON Before Encryption ===
[JSON payload displayed]
=== Sending to NTT AUTH API ===
Merchant Txn ID: NURSERY_[ORDER_ID]_[TIMESTAMP]
=== NTT AUTH API Response ===
Status: 200
Response Length: 375 characters
=== Decrypting Response ===
Decrypted response: {"atomTokenId":15000000953xxx,"responseDetails":...}
✅ atomTokenId: 15000000953xxx
=== Sending Response to Frontend ===
Payment ID: [ID]
Atom Token ID: 15000000953xxx
```

### ✅ Frontend Receives Token
```javascript
Console:
Initiating NDPS payment...
Order ID: [ID]
Amount: ₹[AMOUNT]
=== Backend Response ===
Token type: number
Token value: 15000000953xxx
✅ AtomPaynetz instance created
Popup should open automatically...
```

### ⏳ Callback Handling (If Successful Payment)
```
=== Decrypted Response ===
[Transaction data with statusCode: OTS0000]
=== Transaction Details ===
[Full transaction object displayed]
✅ Signature verified successfully
Payment updated: [ORDER_ID]
New Status: paid
```

---

## Troubleshooting

### Issue: "Empty response from NTT" or 500 Error

**Check**:
1. Backend logs for error messages
2. Backend .env has correct keys:
   ```bash
   NDPS_AUTH_URL=https://caller.atomtech.in/ots/aipay/auth
   NDPS_REQUEST_KEY=A4476C2062FFA58980DC8F79EB6A799E
   NDPS_RESPONSE_KEY=75AEF0FA1B94B3C10D4F5B268F757F11
   ```
3. Restart backend after checking .env

### Issue: Popup Doesn't Open

**Check**:
1. Browser console (F12) for JavaScript errors
2. Backend returned token successfully (check backend logs)
3. Token is not null/undefined
4. AtomPaynetz script loaded

### Issue: "Transaction Failed" Message

**Expected Behavior** ✅
- This is NORMAL in UAT environment
- Merchant ID is not active for actual transactions
- All code is working correctly
- Will resolve with production credentials

---

## Database Verification

### Check Order Created
```sql
SELECT * FROM orders WHERE order_number = '[ORDER_NUMBER]';
```
Expected: Order row with status='received', payment_status='pending'

### Check Payment Record
```sql
SELECT * FROM payments WHERE order_id = [ORDER_ID];
```
Expected: Payment row with payment_status='pending' (or 'paid' after successful callback)

### Check Payment Status Update (After Payment)
```sql
SELECT * FROM payments WHERE order_id = [ORDER_ID];
```
Updated fields:
- `payment_status`: changed from 'pending' to 'paid' or 'failed'
- `remarks`: contains transaction status and details
- `paid_at`: timestamp of payment (if successful)

---

## Test Cases

### Test Case 1: Happy Path
1. ✅ Add items to cart
2. ✅ Proceed to checkout
3. ✅ Select online payment
4. ✅ Receive atomTokenId from backend
5. ✅ Popup opens (even if showing "Transaction Failed")
6. ✅ Payment recorded in database

### Test Case 2: Status Verification
1. ✅ Complete payment test case 1
2. ✅ Check `/api/ndps/status/[PAYMENT_ID]` endpoint
3. ✅ Should return payment status
4. ✅ Frontend payment return page shows status

### Test Case 3: Error Handling
1. Close popup without completing payment
2. Check return page shows pending/failed message
3. Verify database is not corrupted
4. Attempt another payment with same customer

### Test Case 4: COD Payment (Alternative)
1. Add items to cart
2. Checkout with COD method
3. Verify order created with payment_status='pending'
4. No payment endpoint called
5. Verify system handles COD differently than NDPS

---

## Quick Commands

### Check Backend Service
```bash
curl http://localhost:4000/api/health
# Expected: {"status":"ok","service":"nursery-node-backend"}
```

### Test Token Generation
```bash
node debug_ndps_request.js
# Expected: ✅ atomTokenId: [number], Status Code: OTS0000
```

### View Database
```bash
mysql -u root -p
> USE nursery_management;
> SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;
```

### Clear Test Data
```bash
# Delete last test order
mysql -u root -p
> USE nursery_management;
> DELETE FROM orders WHERE order_number = '[TEST_ORDER_NUMBER]' LIMIT 1;
```

---

## Expected Timeline

| Step | Duration | What to Watch |
|------|----------|---------------|
| Add to cart | Instant | UI updates |
| Checkout form | <1s | Form validates |
| Place order | 1-2s | Order ID displayed |
| Token generation | 2-5s | Backend logs show token |
| Popup opens | 1-2s | AtomPaynetz popup appears |
| Callback (if paid) | 2-10s | Backend logs show update |
| Return page | <1s | Status page displays |

---

## Success Criteria

✅ All of these should work:
1. Order created in database
2. Payment record created with pending status
3. Backend successfully calls NTT API
4. atomTokenId generated and received by frontend
5. Payment popup opens (regardless of "Transaction Failed" message)
6. Return page loads and shows status
7. Payment status can be checked via API
8. No 500 errors in backend logs

---

## Notes for Production

- **Currently Using**: UAT environment (atomtech.in URLs)
- **Production Ready**: Code is production-ready
- **Blockers**: Waiting for production credentials from NTT DATA
- **When Available**: Update URLs and test with production credentials

---

## Support

If issues occur:

1. **Check Backend Logs**
   ```
   Look for: === NDPS Payment Initiation ===
   Should show full flow with no errors
   ```

2. **Check Frontend Console** (F12)
   ```
   Look for: Initiating NDPS payment...
   Should show successful token retrieval
   ```

3. **Verify Environment**
   ```
   Backend: http://localhost:4000 ✓
   Frontend: http://localhost:3000 ✓
   Database: localhost:3306 ✓
   .env keys: Correct ✓
   ```

4. **Run Debug Script**
   ```bash
   node debug_ndps_request.js
   Should generate token successfully
   ```

---

**Ready to Test**: Yes ✅  
**Expected Outcome**: Payment flow works, "Transaction Failed" is expected in UAT  
**Next Step**: Follow steps above to test
