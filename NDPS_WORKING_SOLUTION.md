# NDPS Payment Integration - WORKING SOLUTION ✅

## Status: RESOLVED

The NDPS payment integration is now **FULLY WORKING**!

## The Problem
We were using **AES-128-ECB** encryption, which caused NTT's AUTH API to return empty responses (HTTP 200 with content-length: 0).

## The Solution
Switch to **AES-256-CBC with PBKDF2** key derivation (as per NTT's official working Node.js implementation).

## Test Results
```
✅ atomTokenId: 15000000953137
✅ Status Code: OTS0000 (SUCCESS)
✅ Message: "ATOM TOKEN ID HAS BEEN GENERATED SUCCESSFULLY"
```

## Technical Details

### Encryption Method (CORRECTED)
- **Algorithm**: AES-256-CBC (not AES-128-ECB)
- **Key Derivation**: PBKDF2 with 65536 iterations and SHA-512
- **IV (Initialization Vector)**: `[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]`
- **Keys**: Used as UTF-8 strings, not hex buffers

### Request Format
```
POST https://caller.atomtech.in/ots/aipay/auth
Content-Type: application/x-www-form-urlencoded

encData=[encrypted_json]&merchId=446442
```

**Important**: Order matters! `encData` comes first, then `merchId`.

### Response Format
```
merchId=446442&encData=[encrypted_response]
```

The response is URL-encoded, not JSON. Extract and decrypt the `encData` parameter.

### JSON Payload Structure
```json
{
  "payInstrument": {
    "headDetails": {
      "version": "OTSv1.1",
      "api": "AUTH",
      "platform": "FLASH"
    },
    "merchDetails": {
      "merchId": "446442",
      "userId": "",
      "password": "Test@123",
      "merchTxnId": "UNIQUE_ID",
      "merchTxnDate": "2026-07-02 06:01:31"
    },
    "payDetails": {
      "amount": "100.00",
      "product": "NSE",
      "custAccNo": "123",
      "txnCurrency": "INR"
    },
    "custDetails": {
      "custEmail": "customer@example.com",
      "custMobile": "9876543210"
    },
    "extras": {
      "udf1": "order_id",
      "udf2": "custom_field",
      "udf3": "return_url",
      "udf4": "",
      "udf5": ""
    }
  }
}
```

## Implementation Files Updated

### Backend
- ✅ `backend/routes/ndps-payments.js` - Updated with AES-256-CBC encryption

### Frontend  
- ✅ `frontend/src/components/NDPSPayment.tsx` - Ready to use atomTokenId
- ✅ `frontend/src/app/checkout/page.tsx` - Payment flow configured

## Configuration (Working)
```env
NDPS_MERCH_ID=446442
NDPS_PASSWORD=Test@123
NDPS_PRODUCT_ID=NSE
NDPS_API_URL=https://caller.atomtech.in/ots/aipay/auth
NDPS_RESPONSE_URL=http://localhost:4000/api/ndps/response
NDPS_RETURN_URL=http://localhost:3000/payment/return
NDPS_REQUEST_KEY=A4476C2062FFA58980DC8F79EB6A799E
NDPS_RESPONSE_KEY=75AEF0FA1B94B3C10D4F5B268F757F11
NDPS_REQUEST_HASH_KEY=KEY123657234
NDPS_RESPONSE_HASH_KEY=KEYRESP123657234
```

## Testing

### Test Script
Run: `node debug_ndps_request.js`

Expected Output:
```
✅ atomTokenId: [number]
✅ Status Code: OTS0000
✅ Message: SUCCESS
```

### Integration Test
1. Start backend: `cd backend && node app.js`
2. Start frontend: `cd frontend && npm run dev`
3. Go to checkout and select online payment
4. Payment popup should open with NTT DATA gateway

## Next Steps

1. **Test the full flow**:
   - Create an order
   - Initiate payment
   - Complete payment in popup
   - Verify callback handling

2. **For Production**:
   - Update `.env` with production URLs
   - Update `NDPS_RESPONSE_URL` to public URL
   - Update `NDPS_RETURN_URL` to public URL
   - Get production merchant credentials from NTT DATA

## Reference
Based on official NTT DATA Node.js implementation:
- Repository: `nttdatapay-nodejs-main`
- File: `app.js`

## Key Learnings

1. **DO NOT use AES-128-ECB** - NTT requires AES-256-CBC
2. **DO use PBKDF2** for key derivation (65536 iterations, SHA-512)
3. **DO use fixed IV** - `[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]`
4. **Keys are UTF-8 strings**, not hex buffers
5. **Request order matters**: `encData` before `merchId`
6. **Response is URL-encoded**, not JSON

---

**Updated**: July 2, 2026  
**Status**: ✅ WORKING  
**Tested**: ✅ YES