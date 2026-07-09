# ✅ CORS_ORIGIN Environment Variable Integration

## What Was Updated

All hardcoded `http://localhost:3000/` URLs in `backend/routes/ndps-payments.js` have been replaced with the `CORS_ORIGIN` environment variable for production flexibility.

## Changes Made

### 1. Added Frontend URL Variable
**File:** `backend/routes/ndps-payments.js` (Line 50)

```javascript
// Frontend URL for redirects (from CORS_ORIGIN environment variable)
const frontendUrl = (process.env.CORS_ORIGIN || 'http://localhost:3000').replace(/\/$/, '');
```

**What it does:**
- Reads `CORS_ORIGIN` from environment
- Falls back to `http://localhost:3000` if not set
- Removes trailing slash for consistency

### 2. Updated All Redirect URLs

**Before (Hardcoded):**
```javascript
res.writeHead(302, { 'Location': 'http://localhost:3000/checkout?payment=failed' });
res.writeHead(302, { 'Location': `http://localhost:3000/checkout?orderNumber=${payment.order_id}&success=true` });
```

**After (Environment Variable):**
```javascript
res.writeHead(302, { 'Location': `${frontendUrl}/checkout?payment=failed` });
res.writeHead(302, { 'Location': `${frontendUrl}/checkout?orderNumber=${payment.order_id}&success=true` });
```

## All Updated Locations

| Location | Count | Updated |
|----------|-------|---------|
| Error handling (no encData) | 1 | ✅ |
| Decryption error handling | 1 | ✅ |
| Invalid payInstrument | 1 | ✅ |
| No transaction found | 1 | ✅ |
| Missing merchTxnId | 1 | ✅ |
| Signature mismatch | 1 | ✅ |
| Payment not found | 1 | ✅ |
| Payment redirect logic | 2 | ✅ |
| Error catch block | 1 | ✅ |
| **Total** | **11** | **✅** |

## Environment Configuration

### Development (.env)
```
CORS_ORIGIN=http://localhost:3000
```

### Production (.env)
```
CORS_ORIGIN=https://yourdomain.com
```

Or with trailing slash (will be removed automatically):
```
CORS_ORIGIN=https://yourdomain.com/
```

## How It Works

### Example Flow

**Development:**
```
CORS_ORIGIN=http://localhost:3000
frontendUrl = 'http://localhost:3000'
Redirect: http://localhost:3000/checkout?success=true
```

**Production:**
```
CORS_ORIGIN=https://nursery.jyada.in
frontendUrl = 'https://nursery.jyada.in'
Redirect: https://nursery.jyada.in/checkout?success=true
```

## Benefits

✅ **Environment-Agnostic:** Works across development, staging, and production
✅ **No Hardcoding:** No need to change code for different environments
✅ **Easy Configuration:** Just update `.env` file
✅ **Consistent:** Uses same variable as CORS configuration
✅ **Fallback:** Safe default if not set
✅ **Production Ready:** Fully flexible for any domain

## Testing

### Local Testing
```bash
# Existing setup works as-is
CORS_ORIGIN=http://localhost:3000
# Or leave empty (uses default)
```

### Production Testing
```bash
# Update .env before deployment
CORS_ORIGIN=https://your-production-domain.com
# Restart backend
npm start
# Test payment flow
```

## Verification

After update, verify in backend logs:

```
=== NDPS Popup Response Handler ===
...
Redirecting to: https://your-domain.com/checkout?orderNumber=149&success=true
```

The URL should use your configured domain, not localhost.

## Deployment Checklist

- [ ] Update `CORS_ORIGIN` in production `.env`
- [ ] Ensure frontend is deployed at that domain
- [ ] Restart backend after changing `.env`
- [ ] Test payment flow end-to-end
- [ ] Verify redirects go to correct domain
- [ ] Monitor logs for redirect URLs

## Files Modified

1. ✅ `backend/routes/ndps-payments.js`
   - Added: `frontendUrl` variable (Line 50)
   - Updated: 11 redirect URLs to use `frontendUrl`

## No Other Changes Needed

- ✅ Frontend works as-is (no changes)
- ✅ Database queries work as-is (no changes)
- ✅ NDPS configuration unchanged
- ✅ Encryption/decryption unchanged
- ✅ Payment logic unchanged

---

**Status: ✅ Complete**

All redirect URLs now use the `CORS_ORIGIN` environment variable for full production flexibility!
