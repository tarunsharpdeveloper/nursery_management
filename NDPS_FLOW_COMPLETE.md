# Complete NDPS Payment Flow - Quick Reference

## Architecture Overview

```
┌─────────────────────┐
│   Next.js Frontend  │ (localhost:3000)
│   (Browser)         │
└──────────┬──────────┘
           │
           │ API calls
           ↓
┌─────────────────────┐
│   Express Backend   │ (localhost:4000)
│   Node.js/Database  │
└──────────┬──────────┘
           │
           │ Encrypted requests/responses
           ↓
┌─────────────────────┐
│   NTT DATA API      │
│   Atom PayNetz      │ (UAT: caller.atomtech.in)
└─────────────────────┘
```

## Payment Flow - Step by Step

### Step 1: User Clicks "Pay Now" on Checkout
**Location**: `frontend/src/app/checkout/page.tsx`

User selects NDPS payment method and clicks "Pay Now". This triggers the NDPSPayment component.

### Step 2: Frontend Calls Backend to Initiate Payment
**Frontend Route**: `POST /api/ndps/initiate`
**Handler**: `initiateNDPSPayment()` in `backend/routes/ndps-payments.js`

**Request**:
```json
{
  "orderId": 130,
  "customerEmail": "user@example.com",
  "customerMobile": "9876543210",
  "amount": 270.00
}
```

### Step 3: Backend Encrypts and Sends to NTT AUTH API
**NTT Endpoint**: `https://caller.atomtech.in/ots/aipay/auth` (UAT)

**Backend Process**:
1. Generate unique merchant transaction ID: `NURSERY_130_mr3ifkw4`
2. Build payment JSON structure with all details
3. **Encrypt using AES-256-CBC with PBKDF2**:
   - Algorithm: AES-256-CBC
   - Key derivation: PBKDF2 (65536 iterations, SHA-512)
   - Key: Request Key (from env)
   - IV: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]
4. Send encrypted data + merchantId to NTT

**Encrypted Payload Structure**:
```javascript
{
  payInstrument: {
    headDetails: {
      version: "OTSv1.1",
      api: "AUTH",
      platform: "FLASH"
    },
    merchDetails: {
      merchId: "446442",
      userId: "",
      password: "Test@123",
      merchTxnId: "NURSERY_130_mr3ifkw4",
      merchTxnDate: "2026-07-02 12:19:35"
    },
    payDetails: {
      amount: "270.00",
      product: "NSE",
      custAccNo: "130",
      txnCurrency: "INR"
    },
    custDetails: {
      custEmail: "user@example.com",
      custMobile: "9876543210"
    },
    extras: {
      udf1: "order_130",
      udf2: "nursery_payment",
      udf3: "http://localhost:3000/payment/return",
      udf4: "",
      udf5: ""
    }
  }
}
```

### Step 4: NTT Returns Encrypted Token
**NTT Response**:
```
merchId=446442&encData=5500FEA2F09DA7EF128CFE7D2D01F25...
```

**Backend Process**:
1. Extract encrypted data from response
2. **Decrypt using AES-256-CBC with PBKDF2** (Response Key)
3. Parse decrypted JSON:
```json
{
  "atomTokenId": 15000000953395,
  "responseDetails": {
    "txnStatusCode": "OTS0000",
    "txnMessage": "SUCCESS",
    "txnDescription": "ATOM TOKEN ID HAS BEEN GENERATED SUCCESSFULLY"
  }
}
```
4. Store payment record in database (status: "pending")
5. Return token + config to frontend

**Backend Response to Frontend**:
```json
{
  "success": true,
  "paymentId": 112,
  "atomTokenId": 15000000953395,
  "merchId": "317159",
  "merchTxnId": "NURSERY_130_mr3ifkw4",
  "customerEmail": "user@example.com",
  "customerMobile": "9876543210",
  "returnUrl": "http://localhost:3000/payment/return",
  "env": "uat"
}
```

### Step 5: Frontend Loads AtomPaynetz Script
**Location**: `frontend/src/components/NDPSPayment.tsx`

Frontend dynamically loads:
```html
<script src="https://pgtest.atomtech.in/AtomInstaPay/atomInstapay.js"></script>
```

### Step 6: Frontend Opens Payment Popup
**Process**:
1. Create AtomPaynetz instance with token and config
2. Open popup for user to select payment method
3. Popup shows:
   - Net Banking
   - Debit Card
   - Credit Card
   - UPI
   - Wallet options

**Popup Config**:
```json
{
  "atomTokenId": "15000000953395",
  "merchId": "317159",
  "custEmail": "user@example.com",
  "custMobile": "9876543210",
  "returnUrl": "http://localhost:3000/payment/return"
}
```

### Step 7: User Completes Payment in Popup
User selects payment method and enters credentials in the popup. After payment:
- ✅ Success: Transaction processed
- ❌ Failed: Payment declined
- ⏳ Pending: Transaction in progress

### Step 8: NTT Sends Callback to Backend
**Callback Route**: `POST /api/ndps/response`
**Handler**: `handleNDPSResponse()` in `backend/routes/ndps-payments.js`

**Callback Data** (encrypted):
```
encData=[encrypted response]
```

**Backend Process**:
1. Decrypt response using Response Key
2. Parse decrypted data:
```json
{
  "payInstrument": [{
    "merchDetails": {
      "merchId": "446442",
      "merchTxnId": "NURSERY_130_mr3ifkw4",
      "merchTxnDate": "2026-07-02 11:17:50"
    },
    "payDetails": {
      "atomTxnId": 15000000631738,
      "product": "NSE",
      "amount": "270.00",
      "totalAmount": "270.00"
    },
    "payModeSpecificData": {
      "subChannel": "NB",
      "bankDetails": {
        "bankTxnId": "NBnL0kjrRRpBIr2KYVR5",
        "otsBankName": "Atom Bank"
      }
    },
    "responseDetails": {
      "statusCode": "OTS0000",
      "message": "SUCCESS",
      "description": "TRANSACTION IS SUCCESSFUL"
    }
  }]
}
```

3. Extract status code
4. Update payment record in database
5. Update order status accordingly

### Step 9: Popup Closes & Redirects to Return Page
**Return URL**: `http://localhost:3000/payment/return`

### Step 10: Return Page Checks Payment Status
**Location**: `frontend/src/app/payment/return/page.tsx`

**Process**:
1. Get `merchTxnId` from localStorage or URL params
2. Call backend requery endpoint
3. Backend checks:
   - First: Database (cached status)
   - Second: NTT API (live status)
4. Frontend displays result:
   - ✅ **Success**: "Payment Completed Successfully!"
   - ❌ **Failed**: "Payment Failed"
   - ⏳ **Pending**: "Payment Pending"

### Step 11: Requery Status (if needed)
**Requery Route**: `POST /api/ndps/requery`
**Handler**: `requeryTransactionStatus()` in `backend/routes/ndps-payments.js`

**Request**:
```json
{
  "merchTxnId": "NURSERY_130_mr3ifkw4"
}
```

**Process**:
1. **Check Database First** (fast, reliable)
   - Look up payment by gateway_payment_id (merchTxnId)
   - If found, return stored status
2. **If Not Found, Query NTT API** (with STATUS api type)
   - Build requery payload with api: "STATUS"
   - Encrypt and send to same AUTH endpoint
   - Decrypt response and extract status
3. **Handle UAT Limitations**
   - If NTT returns welcome message → return "not found"
   - Fall back to database status

**Response**:
```json
{
  "merchTxnId": "NURSERY_130_mr3ifkw4",
  "statusCode": "OTS0000",
  "statusMessage": "SUCCESS",
  "status": "paid",
  "amount": 270,
  "source": "database"
}
```

## Database Schema

### Payments Table
```sql
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  payment_gateway VARCHAR(50),           -- 'ndps'
  payment_method VARCHAR(50),            -- 'online', 'cod'
  payment_status VARCHAR(50),            -- 'pending', 'paid', 'failed'
  amount DECIMAL(10, 2),
  gateway_payment_id VARCHAR(100),       -- merchTxnId
  remarks TEXT,
  created_at TIMESTAMP,
  paid_at TIMESTAMP NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

## Encryption Details

### AES-256-CBC with PBKDF2

**Request Encryption**:
```javascript
const password = Buffer.from(requestKey, 'utf8');  // 'A4476C2062FFA58980DC8F79EB6A799E'
const salt = Buffer.from(requestKey, 'utf8');      // Same as key for PBKDF2
const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
const iv = Buffer.from([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);
const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
const encrypted = cipher.update(plaintext, 'utf8', 'hex') + cipher.final('hex');
```

**Response Decryption**:
```javascript
const password = Buffer.from(responseKey, 'utf8');  // '75AEF0FA1B94B3C10D4F5B268F757F11'
const salt = Buffer.from(responseKey, 'utf8');      // Same as key
const derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha512');
const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
const decrypted = decipher.update(encryptedHex, 'hex') + decipher.final();
```

## Status Codes

### Transaction Status Codes
| Code | Meaning |
|------|---------|
| OTS0000 | SUCCESS - Transaction successful |
| OTS0001 | PENDING - Transaction pending |
| OTS9999 | FAILED - Transaction failed |
| Others | Various error codes |

### Payment Status Values
| Value | Meaning |
|-------|---------|
| pending | Awaiting payment completion |
| paid | Payment successful |
| failed | Payment failed |
| cod | Cash on Delivery |

## Environment Variables Required

```env
# NTT DATA API Configuration
NDPS_API_URL=https://caller.atomtech.in/ots/aipay/auth
NDPS_RESPONSE_URL=http://localhost:4000/api/ndps/response
NDPS_RETURN_URL=http://localhost:3000/payment/return

# Merchant Credentials (UAT)
NDPS_MERCH_ID=446442
NDPS_PASSWORD=Test@123
NDPS_PRODUCT_ID=NSE

# Encryption Keys
NDPS_REQUEST_KEY=A4476C2062FFA58980DC8F79EB6A799E
NDPS_RESPONSE_KEY=75AEF0FA1B94B3C10D4F5B268F757F11
NDPS_REQUEST_HASH_KEY=KEY123657234
NDPS_RESPONSE_HASH_KEY=KEYRESP123657234
```

## Error Handling

### Common Errors

1. **"Atom Token ID was not found"**
   - Cause: Token not properly passed to popup
   - Solution: Verify atomTokenId is present in NDPSPayment config

2. **"Empty response from NTT AUTH API"**
   - Cause: Encryption failed or credentials wrong
   - Solution: Verify encryption method and merchant credentials

3. **"X-Frame-Options header"**
   - Cause: NTT sends malformed header format
   - Solution: Harmless warning, not actual error

4. **"Transaction not found in database"**
   - Cause: Payment record not created or callback not received
   - Solution: Check if payment initiated successfully and callback processed

5. **"Welcome to NTTDATAPAY OTS-UAT API"**
   - Cause: Wrong endpoint or encrypted payload not recognized
   - Solution: Verify endpoint URL and encryption

## Testing Checklist

- [ ] Payment initiation returns atomTokenId
- [ ] Popup opens with payment methods
- [ ] Callback received and decrypted successfully
- [ ] Payment status updated in database
- [ ] Return page shows correct status (Success/Failed/Pending)
- [ ] Requery returns correct status
- [ ] Order status updated to 'paid' after successful payment

## Production Deployment Notes

1. **Update credentials** to production merchant ID and keys
2. **Change API URL** to production: `https://paynetz.atomtech.in/ots/aipay/auth`
3. **Update return URL** to production domain
4. **Update response URL** to production domain
5. **Set environment** to production in config
6. **Test with real payments** in production environment
7. **Monitor logs** for encryption/decryption issues

## References

- NTT Data PayNetz Documentation: See `Transaction API (Non-seamless)_V2. 2` folder
- Working Reference Implementation: `nttdatapay-nodejs-main` folder
- API Documentation: `NURSERY_MANAGEMENT_API_DOCUMENTATION.md`
- Recent Fix: `NDPS_REQUERY_FIX.md`
