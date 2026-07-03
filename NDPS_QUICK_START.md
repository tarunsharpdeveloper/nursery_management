# NDPS Payment Integration - Quick Start Guide

## What Was Added

### 1. **Frontend Response Handler** (`/Response` page)
- **Location:** `frontend/src/app/Response/page.tsx`
- **Purpose:** Handles redirect from NDPS popup after payment completion
- **URL:** `http://localhost:3000/Response`

### 2. **Return URL in Payment Initiation**
- **Component:** `frontend/src/components/NDPSPayment.tsx`
- **Change:** Now sends dynamic `returnUrl` to backend
- **Benefit:** Frontend can specify where to redirect after payment

### 3. **Return URL Support in Backend**
- **File:** `backend/routes/ndps-payments.js`
- **Change:** Accepts and uses `returnUrl` parameter
- **Benefit:** Flexible configuration for different environments

## How It Works

```
User clicks "Pay Now"
    ↓
Payment initiation with returnUrl: http://localhost:3000/Response
    ↓
NDPS popup opens
    ↓
User completes payment
    ↓
NDPS redirects to: http://localhost:3000/Response
    ↓
Response page checks payment status
    ↓
Shows success/failure, auto-redirects
```

## Key URLs

| What | URL | Purpose |
|------|-----|---------|
| Payment Response Page | `http://localhost:3000/Response` | Frontend page that handles popup redirect |
| Server Callback | `http://localhost:4000/api/ndps/response` | Backend endpoint for NDPS server-to-server callback |
| Status Check | `http://localhost:4000/api/ndps/status/{paymentId}` | Frontend queries this for payment status |

## Environment Setup

### Backend (.env)
```
NDPS_RESPONSE_URL=http://localhost:4000/api/ndps/response
NDPS_RETURN_URL=http://localhost:3000/Response
```

### Frontend (.env)
No changes needed - uses dynamic host detection

## Testing

### 1. Start Services
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 2. Test Payment
1. Navigate to Checkout page
2. Add product to cart
3. Click "Pay with NDPS"
4. Complete NDPS popup
5. You'll be redirected to `/Response` page
6. Wait for status check (2-3 seconds)
7. See success/failure message

### 3. Expected Behavior

**Success Case:**
- ✅ Payment successful message
- Redirects to order confirmation
- Order status changes to "paid"

**Failure Case:**
- ❌ Payment failed message
- Redirects back to checkout
- Order status remains "pending"

**Timeout Case:**
- ⏳ Processing message for up to 5 seconds
- Auto-retries status check
- Eventually shows success or failure

## Troubleshooting

### "Payment session not found"
- Check localStorage isn't cleared between popup and redirect
- Verify Same-Site cookie settings

### Status check returns 404
- Verify payment was created successfully
- Check database has the payment record
- Try refreshing the `/Response` page

### Popup doesn't redirect
- Check `NDPS_RETURN_URL` is correct in backend env
- Verify browser security settings allow redirects
- Check for popup blocker

## Files Changed

### New Files
- ✅ `frontend/src/app/Response/page.tsx`
- ✅ `NDPS_RESPONSE_HANDLER.md` (documentation)
- ✅ `NDPS_QUICK_START.md` (this file)

### Modified Files
- 📝 `frontend/src/components/NDPSPayment.tsx`
  - Added: Dynamic returnUrl calculation
  - Added: returnUrl parameter in API call
  - Added: localStorage for payment ID

- 📝 `backend/routes/ndps-payments.js`
  - Added: returnUrl parameter handling
  - Updated: Use provided returnUrl instead of config default
  - Updated: Return final returnUrl to frontend

## Response Page Features

### Visual Feedback
- ⏳ Processing state with animated dots
- ✅ Success state with order details
- ❌ Failure state with error message

### Automatic Actions
- Shows status for 2-3 seconds
- Auto-redirects to appropriate page
- Stores/clears payment metadata

### Error Handling
- Handles missing payment session
- Retries on network errors
- Shows user-friendly messages

## Integration Points

### From Checkout
```javascript
<NDPSPayment 
  orderId={order.id}
  amount={order.total}
  customerEmail={user.email}
  customerMobile={user.phone}
  onSuccess={handlePaymentSuccess}
  onError={handlePaymentError}
/>
```

### Payment Flow
1. NDPSPayment → Backend `/api/ndps/initiate`
2. Backend → NDPS AUTH API
3. NDPS → Browser (redirect to `/Response`)
4. NDPS → Backend `/api/ndps/response` (server-to-server)
5. `/Response` → Backend `/api/ndps/status/{paymentId}`
6. `/Response` → User (success/failure page)

## Production Deployment

### Changes Needed
1. Update `NDPS_RETURN_URL` to production domain
```
NDPS_RETURN_URL=https://yourdomain.com/Response
```

2. Update `NDPS_RESPONSE_URL` to production backend
```
NDPS_RESPONSE_URL=https://api.yourdomain.com/api/ndps/response
```

3. Update `NDPS_API_URL` to production NDPS endpoint
```
NDPS_API_URL=https://paynetz.atomtech.in/ots/aipay/auth
```

4. Update encryption keys for production (provided by NTT DATA)

5. Ensure HTTPS for all URLs

6. Test end-to-end with production NDPS account

## Support

For issues or questions:
1. Check `NDPS_RESPONSE_HANDLER.md` for detailed documentation
2. Review backend console logs for encryption/decryption errors
3. Check frontend console for payment initiation errors
4. Verify environment variables are correctly set
5. Confirm NDPS credentials are valid

## Related Files

- `backend/routes/ndps-payments.js` - All NDPS logic
- `frontend/src/components/NDPSPayment.tsx` - Payment component
- `frontend/src/app/checkout/page.tsx` - Checkout integration
- `backend/.env` - Environment configuration
- `database/schema.sql` - Payments table schema
