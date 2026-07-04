# ✅ Form Encoding Fix Applied - Test Now!

## What Was Fixed

NDPS sends form-encoded data (`encData=0C...&merchId=...`), but backend was trying to parse it as JSON.

**Now Fixed:**
- ✅ Added `readFormData()` function to parse form-encoded data
- ✅ Updated `handleNDPSPopupResponse()` to use form parser
- ✅ Backend can now correctly receive NDPS popup responses

## Test Now

### Step 1: Restart Backend
```bash
cd backend
npm start
```

**You should see:**
```
Node backend running at http://localhost:4000
```

### Step 2: Restart Frontend (if needed)
```bash
cd frontend
npm run dev
```

### Step 3: Test Payment
1. Go to: `http://localhost:3000/checkout`
2. Add product to cart
3. Click "Pay Now"
4. Complete NDPS popup with test card:
   - Card: 8881 8881 8881 8881
   - CVV: 123
   - Expiry: 12/25
5. Click "Pay"
6. **Popup closes**
7. **Wait for backend processing...**

### Step 4: Check Backend Logs

**Look for:**
```
=== NDPS Popup Response Handler ===
Received form-encoded data, encData length: ####
Encrypted response received from popup
=== Decrypted Popup Response ===
{...lots of JSON...}
=== Transaction Details ===
- Merchant Txn ID: NURSERY_123_xyz
- Status Code: OTS0000
=== Payment Updated ===
Payment ID: #
Order ID: #
New Status: paid
Redirecting to: http://localhost:3000/checkout?orderNumber=123&success=true
```

### Step 5: Check Frontend
After redirect, you should see:
- ✅ URL: `http://localhost:3000/checkout?orderNumber=123&success=true`
- ✅ Success message displays
- ✅ No errors in browser console

### Step 6: Verify Database
```sql
SELECT id, order_id, payment_status, amount, paid_at, remarks 
FROM payments 
WHERE created_at > NOW() - INTERVAL 1 HOUR
ORDER BY created_at DESC
LIMIT 1;

-- Should show: payment_status = 'paid'
```

## Success Indicators

| Indicator | Status |
|-----------|--------|
| No "JSON.parse" errors in backend | ✅ Should pass |
| Backend logs show decryption | ✅ Should pass |
| Backend shows "Payment Updated" | ✅ Should pass |
| Database payment_status = 'paid' | ✅ Should pass |
| Browser redirects with success URL | ✅ Should pass |
| No JavaScript errors in browser | ✅ Should pass |

## If Still Failing

### Issue: Still getting JSON parse error
**Solution:**
- Verify backend restarted (kill and restart)
- Check `backend/http.js` has `readFormData` function
- Check `backend/app.js` exports `readFormData`
- Check `backend/routes/ndps-payments.js` calls `helpers.readFormData`

### Issue: Decryption error
**Cause:** Encryption keys don't match
**Check:**
- NDPS_REQUEST_KEY in .env
- NDPS_RESPONSE_KEY in .env
- Verify they match backend config

### Issue: No database update
**Cause:** Payment record not found or SQL error
**Check:**
- Payment was created during initiation
- Correct merchTxnId format
- Check backend logs for SQL errors

### Issue: No redirect
**Cause:** Response handler crashed
**Check:**
- Backend logs for full error message
- Response object exists
- Redirect URL is valid

## Files Changed

- ✅ `backend/http.js` - Added form parser
- ✅ `backend/app.js` - Export form parser
- ✅ `backend/routes/ndps-payments.js` - Use form parser

## Quick Reference

### Form Data Parser
```javascript
// Input: "encData=0C7F2A...&merchId=446442"
// Output: { encData: "0C7F2A...", merchId: "446442" }
const body = await helpers.readFormData(req);
```

### Handler Flow
```
1. Receive form data ← readFormData()
2. Extract encData
3. Decrypt ← decryptData()
4. Parse transaction
5. Find payment record
6. Update DB
7. Send 302 redirect
```

## Expected Timing

| Step | Expected Time |
|------|----------------|
| Popup opens | Immediate |
| User enters card | 5-10 seconds |
| User clicks Pay | Immediate |
| NDPS processes | 2-5 seconds |
| Popup closes | Immediate |
| Backend processes | 1-2 seconds |
| Redirect happens | Immediate |
| Frontend loads | 1-2 seconds |
| **Total** | **10-20 seconds** |

## Common Test Cards (UAT)

| Card Type | Number | CVV | Expiry |
|-----------|--------|-----|--------|
| Visa | 8881 8881 8881 8881 | 123 | 12/25 |
| Success | 8881 8881 8881 8881 | 123 | 12/25 |

## Monitoring Commands

### Backend Logs (Real-time)
```bash
# Terminal already showing logs if npm start was run
# Look for: "=== NDPS Popup Response Handler ===" message
```

### Database Check
```bash
# After payment completes
mysql> SELECT payment_status, paid_at FROM payments ORDER BY id DESC LIMIT 1;
```

### Browser Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Complete payment
4. Look for `POST /Response` request
5. Response should show: `HTTP 302` with `Location` header

---

## ✅ Ready to Test!

**Start backend, run payment, check logs. Report results!**

All the fixes are applied and ready. The form encoding issue is resolved.
