# 🧪 Inline NDPS Payment - Test Guide

## ✅ Quick Start Testing

### Prerequisites
1. Backend running on `http://localhost:4000`
2. Frontend running on `http://localhost:3000`
3. MySQL database connected
4. Test products available in catalog
5. NDPS credentials configured in `backend/.env`

---

## 🎯 Test Scenario 1: Complete Successful Payment

### Step-by-Step Test

#### 1️⃣ Add Products to Cart
- Navigate to `/products`
- Select a product (e.g., "Rose Plant")
- Click "Add to Cart"
- Quantity: 1
- Click "Add to Cart" button
- See success notification

#### 2️⃣ Go to Checkout
- Click cart icon or navigate to `/checkout`
- See cart items in summary
- See cart totals (Subtotal, Delivery, Total)

#### 3️⃣ Fill Checkout Form
```
Name:           John Doe
Email:          john@example.com
Phone:          1234567890
Country:        India (IN)
City:           Mumbai
Address:        123 Main Street
Zip Code:       400001
```
- All fields are required
- Phone must be exactly 10 digits

#### 4️⃣ Select NDPS Payment
- Look at "Payment Method" section
- Select radio button: **💳 Pay Online (Cards, UPI, Net Banking)**
- Sub-text shows: "Secure payment via NTT DATA Payment Services"

#### 5️⃣ Click "Place Order"
- Button shows: "Place Order"
- Loading state: "Placing Order..."
- Wait for response

#### Expected Result After Click:
- ✅ Form disappears
- ✅ Payment card appears inline on same page
- ✅ Shows order summary:
  - Order: [Order Number]
  - Amount: ₹[Total].00
  - Customer: John Doe
- ✅ "Pay Now" button visible
- ✅ "Back to Checkout" button visible

#### 6️⃣ Click "Pay Now"
- Button shows: "Pay Now" with credit card icon
- Loading state: "Opening Payment..." with spinner
- Wait for NDPS popup to open

#### Expected Result:
- ✅ NDPS AtomPaynetz popup window opens
- ✅ Popup shows payment options
- ✅ Checkout page still visible in background

#### 7️⃣ Complete Payment in Popup
1. Select payment method:
   - **Card** (for testing with: 8881 8881 8881 8881)
   - UPI (if available)
   - Net Banking (if available)

2. Enter test card details:
   ```
   Card Number:  8881 8881 8881 8881
   Expiry:       12/25
   CVV:          123
   ```

3. Click "Pay" or "Submit"

4. Complete OTP/verification (if prompted)

#### Expected Result After Payment:
- ✅ NDPS popup closes automatically
- ✅ Browser redirected to:
  ```
  http://localhost:3000/checkout?success=true&orderNumber=149
  ```
- ✅ Page shows success confirmation with:
  - Green success banner with checkmark ✅
  - Message: "Payment Received Successfully!"
  - Order ID displayed
  - "Thank you for your order!" message
  - "Continue Shopping" button
  - "Track Order" button

#### Expected Backend Logs:
```
=== NDPS Popup Response Handler ===
Received form-encoded data, encData length: 2048
Encrypted response received from popup
=== Decrypted Popup Response ===
{...transaction details...}
=== Parsed Response Data ===
{...full response...}
✅ Signature verified successfully
=== Payment Updated ===
Payment ID: 136
Order ID: 148
New Status: paid
Redirecting to: http://localhost:3000/checkout?orderNumber=149&success=true
```

---

## 🎯 Test Scenario 2: Return to Checkout and Change Method

### Step-by-Step Test

#### 1️⃣ - 5️⃣ Same as above (through Place Order)

#### 6️⃣ Click "Back to Checkout" Button
- Button location: Below payment card
- Expected: Page returns to checkout form

#### Expected Result:
- ✅ Payment card disappears
- ✅ Checkout form reappears
- ✅ Form data still filled in (if browser preserved it)
- ✅ Can see error banner (if previous payment failed)

#### 7️⃣ Change Payment Method
- Select: **💰 Cash on Delivery**
- Sub-text shows: "Pay when you receive your order"

#### 8️⃣ Click "Place Order" Again
- Expected: Bypass payment, go straight to confirmation page

#### Expected Result After Click:
- ✅ Redirected to order confirmation page
- ✅ Shows "Order Confirmed" heading
- ✅ Shows order number and success message

---

## 🎯 Test Scenario 3: Payment Failure Handling

### Step-by-Step Test

#### 1️⃣ - 5️⃣ Same as above

#### 6️⃣ Complete Payment with Failed Card
- NDPS will decline the test card with failure code
- Popup redirects to failure page

#### Expected Result:
- ✅ Browser redirected to:
  ```
  http://localhost:3000/checkout?payment=failed
  ```
- ✅ Page shows error banner:
  - Red background
  - Exclamation icon ❌
  - Message: "Payment Failed"
  - Dismissible × button
  - Option to try again

#### 7️⃣ Dismiss Error and Retry
- Click × button on error banner
- Error banner disappears
- Checkout form reappears with data preserved
- Select different payment method or retry
- Click "Place Order" again

#### Expected Result:
- ✅ Can attempt payment again
- ✅ Error state is cleared
- ✅ New payment flow starts

---

## 🎯 Test Scenario 4: Cart to Order Flow (Complete Journey)

This test verifies the entire journey from cart to confirmation.

```
Products Page
    ↓ (Add "Rose Plant" x2)
    ↓ (Add "Lily Plant" x1)
Cart Page (3 items, ₹299 total)
    ↓ (Click Checkout)
Checkout Page
    ↓ (Fill form)
    ↓ (Select NDPS)
    ↓ (Click Place Order)
Payment Card (Inline)
    ↓ (Click Pay Now)
NDPS Popup
    ↓ (Enter card details)
    ↓ (Complete payment)
Success Page
    ↓ (Show order confirmation)
    ↓ (Click Track Order)
My Orders Page
    ↓ (See order with paid status)
```

---

## 📊 Verification Checklist

### Frontend Verification

- [ ] Checkout form loads correctly
- [ ] Payment method options visible (NDPS, COD, Bank)
- [ ] Form validation works (phone 10 digits required)
- [ ] "Place Order" button is enabled
- [ ] After placing order, payment card appears
- [ ] Payment card shows correct order summary
- [ ] "Pay Now" button is clickable
- [ ] "Back to Checkout" button works
- [ ] NDPS popup opens successfully
- [ ] Success page displays correctly
- [ ] Order number shown in success page
- [ ] "Track Order" button navigates to orders
- [ ] "Continue Shopping" button goes to products
- [ ] URL parameters detected and cleaned

### Backend Verification

- [ ] Order created successfully (check database)
- [ ] Payment record created (check payments table)
- [ ] Form-encoded data parsed correctly (no JSON errors)
- [ ] Encrypted response decrypted correctly
- [ ] Payment status updated to "paid"
- [ ] Order status updated to "paid"
- [ ] Redirect URL correct (with orderNumber)
- [ ] Signature verification passes
- [ ] Transaction details logged correctly

### Database Verification

```sql
-- Check order created
SELECT * FROM orders WHERE id = 148;

-- Check payment created
SELECT * FROM payments WHERE order_id = 148;

-- Check payment status updated
SELECT id, payment_status, paid_at, remarks FROM payments WHERE id = 136;

-- Check order payment status updated
SELECT id, payment_status FROM orders WHERE id = 148;
```

---

## 🐛 Debugging Tips

### Enable Detailed Logs

**Backend**: Check console for these patterns:
```
=== NDPS Popup Response Handler ===
Received form-encoded data
Encrypted response received
=== Decrypted Popup Response ===
=== Parsed Response Data ===
✅ Signature verified successfully
=== Payment Updated ===
Redirecting to:
```

### Check Network Tab (Browser DevTools)

1. Open DevTools (F12)
2. Go to Network tab
3. Perform payment flow
4. Look for:
   - `POST /api/ndps/initiate` - Should return atomTokenId
   - `POST /Response` - NDPS popup response (may not show in Network)
5. Check response payloads match expected formats

### Test Form Data Parsing

**Command** (in backend directory):
```bash
# Create a test form-encoded request
curl -X POST http://localhost:4000/Response \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "encData=TEST_ENCRYPTED_DATA"
```

### Test Encryption/Decryption

Run test file if available:
```bash
node backend/test_decryption_fix.js
```

Look for:
- Encryption length (should be ~2x original)
- Decryption successful message
- No JSON parse errors

---

## ✅ Test Result Documentation

### Test 1: Successful Payment ✅
- **Date**: [Your Date]
- **Time**: [Your Time]
- **Card Used**: 8881 8881 8881 8881
- **Amount**: ₹[Amount]
- **Order Number**: [Order #]
- **Payment ID**: [Payment ID]
- **Status**: PASSED/FAILED
- **Notes**: [Any observations]

### Test 2: Return and Change Method ✅
- **Initial Method**: NDPS
- **Final Method**: COD
- **Status**: PASSED/FAILED
- **Notes**: [Any observations]

### Test 3: Payment Failure ✅
- **Status**: PASSED/FAILED
- **Error Shown**: [Error message]
- **Notes**: [Any observations]

### Test 4: Complete Journey ✅
- **Start**: Add to cart
- **End**: Order confirmation
- **Duration**: [Time taken]
- **Status**: PASSED/FAILED
- **Notes**: [Any observations]

---

## 🎯 Production Testing Checklist

Before deploying to production, test:

- [ ] With real payment card (if available)
- [ ] With actual NDPS production credentials
- [ ] With production database
- [ ] Cross-browser compatibility:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge
- [ ] Mobile device testing:
  - [ ] iPhone (Safari)
  - [ ] Android (Chrome)
- [ ] Different payment methods:
  - [ ] Credit Card
  - [ ] Debit Card
  - [ ] UPI
  - [ ] Net Banking
  - [ ] Wallet
- [ ] Error scenarios:
  - [ ] Network timeout during payment
  - [ ] User closes popup mid-payment
  - [ ] Duplicate payment attempt
  - [ ] Session timeout
- [ ] Security:
  - [ ] HTTPS works
  - [ ] SSL certificate valid
  - [ ] No console errors
  - [ ] No sensitive data exposed

---

## 📞 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Payment system is still loading" | Wait a few seconds, ensure CDN accessible |
| Popup doesn't open | Check browser popup blocker settings |
| Form data not parsed | Check Content-Type header in NDPS request |
| "Invalid response from payment gateway" | Verify NDPS credentials in .env |
| Redirect loop | Check CORS_ORIGIN doesn't have trailing slash |
| Order not showing in database | Check MySQL connection and permissions |
| Wrong amount charged | Verify calculation in backend /api/ndps/initiate |
| Signature mismatch | Verify NDPS_RESPONSE_KEY matches NDPS settings |

---

## 📝 Notes

- Test card is provided for UAT only
- Each test should clear previous cart/order data
- Refresh page between tests to clear state
- Monitor database for duplicates (test thoroughly)
- Check email for order confirmations (if email configured)
- Verify success page shows before dismissing NDPS popup

---

**Ready to Test**: ✅ All systems configured
**Expected Duration**: 15-20 minutes for full test
**Success Criteria**: All 4 scenarios pass with expected results
