# NDPS Payment Gateway Integration Status

## Current Status: ✅ Backend Complete, ⚠️ Gateway Testing Blocked

### What's Working:
✅ Backend API endpoint created (`/api/ndps/initiate`)
✅ Payment encryption with AES-128-ECB implemented
✅ Signature generation with SHA-256
✅ Form submission to NDPS gateway (200 OK response received)
✅ Payment status checking endpoint created
✅ Payment callback handler created
✅ Frontend payment flow complete
✅ Order amount properly passed (₹568.00)
✅ Database integration complete

### Current Issue:
❌ NDPS gateway returns blank page after form submission
- URL: https://paynetzuat.atomtech.in/ots/aipay/auth
- Method: POST
- Status: 200 OK
- Response: Blank page (no content)

### Integration Details:

**Merchant Credentials (UAT):**
- Merchant ID: 317159
- Password: Test@123
- Product: NSE
- Request Key: A4476C2062FFA58980DC8F79EB6A799E
- Response Key: 75AEF0FA1B94B3C10D4F5B268F757F11
- Request Hash Key: KEY123657234
- Response Hash Key: KEYRESP123657234

**Test Transaction Details:**
- Order ID: 39
- Amount: ₹568.00
- Customer Email: test@example.com
- Customer Mobile: 9876543210
- Merchant Transaction ID: NURSERY_39_1782901662547

**Request Format Used:**
```json
{
  "payInstrument": {
    "headDetails": {
      "version": "OTSv1.1",
      "api": "AUTH",
      "platform": "FLASH"
    },
    "merchDetails": {
      "merchId": 317159,
      "userId": "",
      "password": "Test@123",
      "merchTxnId": "NURSERY_39_1782901662547",
      "merchTxnDate": "2026-07-01 15:43:46"
    },
    "payDetails": {
      "amount": "568",
      "product": "NSE",
      "custAccNo": "39",
      "txnCurrency": "INR"
    },
    "custDetails": {
      "custEmail": "test@example.com",
      "custMobile": "9876543210"
    },
    "extras": {
      "udf1": "order_39",
      "udf2": "nursery_payment",
      "udf3": "http://localhost:3000/payment/return",
      "udf4": "",
      "udf5": ""
    }
  }
}
```

**Encryption Method:**
- Algorithm: AES-128-ECB
- Key Format: Hex string converted to 16-byte buffer
- Output Format: Uppercase hex string
- Implementation: Node.js crypto.createCipheriv

**Form Submission:**
```html
POST https://paynetzuat.atomtech.in/ots/aipay/auth
Content-Type: application/x-www-form-urlencoded

encdata=<encrypted_payload>
signature=<sha256_hash>
```

### Possible Causes for Blank Page:

1. **UAT Environment Not Activated:**
   - Merchant ID 317159 might not be active in UAT
   - Need to verify with NDPS support

2. **Encryption Key Mismatch:**
   - Current implementation uses hex buffer conversion
   - NDPS might expect different key format

3. **Missing/Incorrect Parameters:**
   - Some required field might be missing
   - Date format might be incorrect

4. **Whitelist Issue:**
   - Return URL might need to be whitelisted
   - localhost URLs might not be accepted

5. **API Endpoint:**
   - Using: https://paynetzuat.atomtech.in/ots/aipay/auth
   - Might need different endpoint for merchant 317159

### Questions for NDPS Support:

1. Is Merchant ID **317159** active in UAT environment?
2. What is the exact encryption format expected?
   - How should the Request Key be used? (as hex buffer, UTF-8 string, or other?)
   - Should we apply any padding to the JSON before encryption?
3. What response should we expect on the redirect URL?
   - What parameters will be sent?
   - Will it be encrypted?
4. Can you provide working test credentials with confirmed UAT access?
5. Do we need to whitelist our return URL (http://localhost:3000/payment/return)?
6. Is there a test/sandbox mode where we can see the payment page?
7. Can you share logs for merchant transaction ID: NURSERY_39_1782901662547?

### Next Steps:

**Option 1: Contact NDPS Support**
- Share this document with NDPS technical support
- Request UAT environment activation
- Get confirmation of credentials
- Ask for working sample code/test case

**Option 2: Test with Different Merchant ID**
Alternative merchant IDs mentioned: 317156, 317157, 8952
- Try integration with these IDs
- One of them might be already activated

**Option 3: Use Production Credentials**
- If this is urgent, request production credentials
- Deploy to live server and test with real gateway

### Files Ready for Production:

Once NDPS issue is resolved, these files are ready:

1. ✅ `backend/routes/ndps-payments.js` - Complete payment integration
2. ✅ `backend/app.js` - Routes configured
3. ✅ `backend/.env` - Environment variables set
4. ✅ `frontend/src/components/NDPSPayment.tsx` - Payment component
5. ✅ `frontend/src/app/checkout/page.tsx` - Checkout integration
6. ✅ `frontend/src/app/payment/return/page.tsx` - Return page handler

### Technical Contact Info:

**Developer:** Your Name
**Project:** Nursery Management System
**Domain:** nursery.jyada.in
**Backend API:** http://localhost:4000 (dev) / https://nursery.jyada.in (prod)
**Frontend:** http://localhost:3000 (dev) / https://nursery.jyada.in (prod)

### Workaround for Now:

Until NDPS gateway is working, you can:
1. Use Cash on Delivery (COD) payment option ✅ Working
2. Use Direct Bank Transfer option ✅ Working
3. Orders are being created successfully ✅ Working
4. Admin can manually mark payments as completed ✅ Working

---

**Created:** July 1, 2026
**Last Updated:** July 1, 2026
**Status:** Awaiting NDPS Support Response
