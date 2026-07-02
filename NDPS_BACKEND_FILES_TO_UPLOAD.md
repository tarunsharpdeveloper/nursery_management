# NDPS Payment Integration - Backend Files to Upload

## Updated Files for Production Server

Upload these files to your production server at `/home/jyada/public_html/nursery.jyada.in/backend/`

### 1. New Route File
**File:** `backend/routes/ndps-payments.js`
- Complete NDPS payment integration
- Encryption/decryption functions using AES-128-ECB
- Three endpoints: initiate, response, status

### 2. Updated Application Router
**File:** `backend/app.js`
- Added import: `const { initiateNDPSPayment, handleNDPSResponse, checkPaymentStatus } = require("./routes/ndps-payments");`
- Added 3 routes:
  - `["POST", "/api/ndps/initiate", null, initiateNDPSPayment]`
  - `["POST", "/api/ndps/response", null, handleNDPSResponse]`
  - `["GET", "/api/ndps/status/:paymentId", null, checkPaymentStatus]`

### 3. Environment Configuration
**File:** `backend/.env`

Add these variables (already exist in your local .env):

```env
# NDPS (NTT DATA Payment Services) Configuration
NDPS_MERCH_ID=317159
NDPS_USER_ID=
NDPS_PASSWORD=Test@123
NDPS_API_URL=https://paynetzuat.atomtech.in/ots/aipay/auth
NDPS_RESPONSE_URL=https://nursery.jyada.in/api/ndps/response
NDPS_RETURN_URL=https://nursery.jyada.in/payment/return
NDPS_REQUEST_KEY=A4476C2062FFA58980DC8F79EB6A799E
NDPS_RESPONSE_KEY=75AEF0FA1B94B3C10D4F5B268F757F11
NDPS_REQUEST_HASH_KEY=KEY123657234
NDPS_RESPONSE_HASH_KEY=KEYRESP123657234

# CORS (for production, set to your domain)
CORS_ORIGIN=https://nursery.jyada.in
```

## Deployment Steps

### On Production Server:

1. **Upload Files:**
   ```bash
   cd /home/jyada/public_html/nursery.jyada.in/backend/
   
   # Upload routes/ndps-payments.js
   # Upload app.js (overwrite existing)
   ```

2. **Update .env file:**
   ```bash
   nano /home/jyada/public_html/nursery.jyada.in/backend/.env
   
   # Add the NDPS configuration variables listed above
   # Make sure CORS_ORIGIN is set to: https://nursery.jyada.in
   ```

3. **Restart Backend:**
   ```bash
   # Find the PM2 process
   pm2 list
   
   # Restart the backend process
   pm2 restart nursery-backend
   
   # Or restart all
   pm2 restart all
   
   # Check logs
   pm2 logs nursery-backend
   ```

## Testing on Production

1. **Test API endpoint:**
   ```bash
   curl -X POST https://nursery.jyada.in/api/ndps/initiate \
     -H "Content-Type: application/json" \
     -d '{
       "orderId": 1,
       "customerEmail": "test@example.com",
       "customerMobile": "9876543210",
       "amount": 100.00
     }'
   ```

2. **Expected Response:**
   - Status: 200 OK
   - Body contains: paymentId, gatewayUrl, encryptedData, signature

3. **Test from Frontend:**
   - Go to checkout page
   - Select NDPS payment option
   - Complete order
   - Should redirect to NDPS gateway

## Important Notes

### UAT vs Production
Current configuration uses **UAT (Test) credentials**:
- Gateway: https://paynetzuat.atomtech.in/ots/aipay/auth
- Merchant ID: 317159

For production, you'll need:
1. Contact NTT DATA to get production credentials
2. Update `.env` with production merchant ID and keys
3. Change `NDPS_API_URL` to production gateway URL

### Encryption
- Uses AES-128-ECB encryption
- Compatible with Node.js v22+ (uses `crypto.createCipheriv` instead of deprecated `createCipher`)

### Database
No schema changes required - uses existing `payments` table.

### Security
- Payment data is encrypted before transmission
- Signature validation using SHA-256 hash
- Response decryption for callback handling

## Troubleshooting

### Issue: 500 Error - crypto.createCipher not a function
**Solution:** Make sure you uploaded the latest `ndps-payments.js` that uses `createCipheriv`

### Issue: 400 Bad Request
**Solution:** Check backend logs to see which field is missing

### Issue: CORS Error
**Solution:** Verify CORS_ORIGIN in .env matches your frontend URL

### Issue: Payment not redirecting
**Solution:** Check that NDPS_RETURN_URL points to your frontend payment return page

## Files Checklist

- [ ] `backend/routes/ndps-payments.js` uploaded
- [ ] `backend/app.js` updated with NDPS routes
- [ ] `backend/.env` updated with NDPS credentials
- [ ] Backend process restarted
- [ ] API endpoint tested
- [ ] Frontend checkout tested
- [ ] Payment gateway redirection working

## Support

For NDPS gateway issues, contact NTT DATA support with:
- Merchant ID: 317159 (UAT)
- Transaction ID from database
- Error logs from backend console
