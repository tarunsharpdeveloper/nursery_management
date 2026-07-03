# NDPS Testing Guide - Now Ready ✅

## Quick Start

### 1. Restart Backend
```bash
cd backend
npm start
# Should show: Node backend running at http://localhost:4000
```

### 2. Check Frontend Still Running
```bash
cd frontend
npm run dev
# Should show: ready - started server on 0.0.0.0:3000
```

### 3. Test Payment Flow

Go to: `http://localhost:3000/checkout`

**Steps:**
1. Add product to cart
2. Fill in customer details
3. Click "Pay with NDPS" (or similar button)
4. NDPS popup opens
5. Complete with test card (8881 8881 8881 8881)
6. Click "Pay" button
7. **Popup closes** (no redirect page this time)
8. **Browser automatically redirects**
9. See success or failure page

## Expected Behavior

### Success Case ✅
```
1. Popup shows payment form
2. User enters: Card 8881 8881 8881 8881, CVV 123, Expiry 12/25
3. User clicks "Pay"
4. Payment processes
5. Popup closes
6. Browser shows: http://localhost:3000/checkout?success=true
7. Success message displays
```

### Failure Case ❌
```
1. Popup shows payment form
2. User enters invalid card
3. User clicks "Pay"
4. Payment fails
5. Popup closes
6. Browser shows: http://localhost:3000/checkout?payment=failed
7. Error message displays
```

### Timeout Case ⏳
```
1. Popup shows payment form
2. Network delay occurs
3. Popup closes anyway
4. Backend still processing
5. Browser redirects with current status
6. Page may show "pending" or "failed"
```

## What to Monitor

### Backend Console
Look for these logs:

```
=== NDPS Payment Initiation ===
Using Merchant ID: 446442
Environment: UAT
API URL: https://caller.atomtech.in/ots/aipay/auth

=== NDPS Popup Response Handler ===
Encrypted response received from popup
=== Decrypted Popup Response ===
{...transaction details...}

=== Transaction Details ===
- Merchant Txn ID: NURSERY_123_xyz
- Status Code: OTS0000
- Atom Txn ID: 12345
- Total Amount: 1000.00

=== Payment Updated ===
Payment ID: 5
Order ID: 123
New Status: paid
Redirecting to: http://localhost:3000/checkout?orderNumber=123&success=true

HTTP/1.1 302 Found
Location: http://localhost:3000/checkout?orderNumber=123&success=true
```

### Browser Console
Should see:
```
Initiating NDPS payment...
Order ID: 123
Amount: 1000
Customer: user@example.com, 9876543210

Opening Payment...
AtomPaynetz instance created
Popup should open automatically...
```

After redirect, no errors should appear.

### Database
```sql
SELECT id, order_id, payment_status, amount, paid_at 
FROM payments 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- Should show:
-- id=5, order_id=123, payment_status='paid', amount=1000, paid_at=2024-07-03 10:30:45
```

## Files to Check

### Backend Endpoint
- **File:** `backend/routes/ndps-payments.js`
- **Function:** `handleNDPSPopupResponse()` (around line 346)
- **Route:** `POST /Response`

### Backend Configuration
- **File:** `backend/.env`
- **Value:** `NDPS_RETURN_URL=http://localhost:4000/Response`

### Backend Routes
- **File:** `backend/app.js`
- **Line:** `["POST", "/Response", null, handleNDPSPopupResponse]`

### Frontend Component
- **File:** `frontend/src/components/NDPSPayment.tsx`
- **No localStorage code** (removed)
- **No returnUrl calculation** (uses config)

## Common Issues & Fixes

### Issue: "TypeError: Invalid URL" (Server-side)
**Status:** ✅ FIXED - Removed frontend Response page

**If still seeing it:**
1. Restart backend: `npm start`
2. Check backend logs for specific line
3. Report full error with line number

### Issue: Popup doesn't open
**Cause:** AtomPaynetz script not loaded
**Fix:**
1. Check browser console for script errors
2. Verify network tab loads atomcheckout.js
3. Try different browser

### Issue: Popup opens but doesn't close
**Cause:** Network issue with NDPS
**Fix:**
1. Check NDPS_MERCH_ID in backend .env
2. Verify test card format (8881 8881 8881 8881)
3. Check browser network tab for NDPS requests

### Issue: No database update after payment
**Cause:** One of the callbacks didn't work
**Fix:**
1. Check backend logs for decryption errors
2. Verify NDPS encryption keys
3. Check database manually

### Issue: Browser doesn't redirect after popup
**Cause:** Response endpoint failed silently
**Fix:**
1. Check backend console for errors
2. Add more logging to handleNDPSPopupResponse()
3. Check browser network tab for 302 response

## Test Cards (UAT)

| Card | Number | CVV | Expiry | Status |
|------|--------|-----|--------|--------|
| Visa | 8881 8881 8881 8881 | 123 | 12/25 | Success |
| Test Card | 4111 1111 1111 1111 | 123 | 12/25 | Try this |

## Debug Mode

Add this to backend logs for more details:

In `ndps-payments.js`, add before `const transaction = ...`:

```javascript
console.log('=== FULL ENCRYPTED RESPONSE ===');
console.log(encryptedResponse);
console.log('=== FULL DECRYPTED RESPONSE ===');
console.log(JSON.stringify(responseData, null, 2));
```

## Step-by-Step Verification

### 1. Verify Backend Ready
```bash
curl http://localhost:4000/api/health
# Should return: {"status":"ok","service":"nursery-node-backend"}
```

### 2. Verify Frontend Ready
```
Open: http://localhost:3000
Should load checkout page
```

### 3. Verify Database Connection
```bash
# Terminal in backend folder
node -e "const db = require('./db'); db.pool.query('SELECT 1').then(() => console.log('DB OK')).catch(e => console.error(e));"
# Should print: DB OK
```

### 4. Verify NDPS Config
```bash
# Check backend logs on startup
npm start
# Should show: NDPS Configuration Loaded
# Should show: Merchant ID: 446442
```

### 5. Test Payment
1. Go to checkout
2. Add product
3. Click Pay
4. Monitor all 3 places: Backend Console, Browser Console, Database

## Success Checklist

After completing payment:
- [ ] Backend shows decryption logs
- [ ] Backend shows "Payment Updated"
- [ ] Backend shows 302 redirect
- [ ] Browser redirects to checkout
- [ ] Database has updated payment status
- [ ] Frontend shows success message
- [ ] No errors in browser console

## Next Steps

1. ✅ Run the test above
2. ✅ Check all console logs
3. ✅ Verify database updates
4. ✅ Report results
5. ✅ Make any final adjustments

---

**Ready to test!** Let me know what you see in the logs.
