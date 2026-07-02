# Backend Files Updated for NDPS Payment Integration

## Files Modified/Created

### 1. Environment Configuration
**File**: `backend/.env`
**Changes**: Added NDPS UAT credentials
```env
# NTT DATA Payment Gateway (UAT)
NDPS_MERCHANT_ID=317159
NDPS_USER_ID=
NDPS_PASSWORD=Test@123
NDPS_PRODUCT_ID=NSE
NDPS_API_URL=https://paynetzuat.atomtech.in/ots/aipay/auth
NDPS_RETURN_URL=http://localhost:3000/payment/callback
NDPS_REQUEST_HASH_KEY=KEY123657234
NDPS_RESPONSE_HASH_KEY=KEYRESP123657234
NDPS_ENCRYPTION_KEY=A4476C2062FFA58980DC8F79EB6A799E
NDPS_DECRYPTION_KEY=75AEF0FA1B94B3C10D4F5B268F757F11
NDPS_MCC_CODE=5999
```

### 2. NDPS Payment Routes
**File**: `backend/routes/ndps-payment.js` (**NEW FILE**)
**Description**: Complete NDPS payment gateway integration
**Features**:
- AES-256-CBC encryption/decryption functions
- Payment initiation endpoint
- Payment callback handling
- Transaction status checking
- Database integration for orders and payments

### 3. Main Application Routes
**File**: `backend/app.js`
**Changes**: Added NDPS payment routes registration
```javascript
// NDPS Payment Gateway Routes
const { initiateNDPSPayment, handleNDPSCallback, checkPaymentStatus } = require('./routes/ndps-payment');

// Register NDPS routes
app.post('/api/payments/ndps/initiate', initiateNDPSPayment);
app.post('/api/payments/ndps/callback', handleNDPSCallback);
app.get('/api/payments/ndps/status/:transactionId', checkPaymentStatus);
```

## API Endpoints Added

### 1. Payment Initiation
- **URL**: `POST /api/payments/ndps/initiate`
- **Purpose**: Creates order, encrypts payload, returns form data for NDPS
- **Request Body**: Customer info, cart items
- **Response**: Encrypted payment data for form submission

### 2. Payment Callback
- **URL**: `POST /api/payments/ndps/callback`
- **Purpose**: Handles NDPS response after payment completion
- **Process**: Decrypts response, updates order/payment status
- **Database**: Updates orders and payments tables

### 3. Payment Status Check
- **URL**: `GET /api/payments/ndps/status/:transactionId`
- **Purpose**: Query payment transaction status
- **Response**: Order and payment details

## Database Integration

### Tables Modified
1. **orders** - Payment status tracking
2. **order_items** - Line items storage
3. **payments** - Payment transaction records

### New Records Created
- Order record with status 'received' → 'approved'
- Order items for each cart product
- Payment record with gateway details
- Payment status: 'pending' → 'paid'

## Key Functions Implemented

### Encryption Functions
```javascript
encryptData(data, encryptionKey)    // AES-256-CBC encryption
decryptData(encryptedData, key)     // AES-256-CBC decryption
```

### Payment Processing
```javascript
initiateNDPSPayment()              // Create order + encrypt payload
handleNDPSCallback()               // Process payment response
checkPaymentStatus()               // Query transaction status
```

## Configuration Notes

### For Production Deployment
1. Update `.env` with production NDPS credentials
2. Change `NDPS_API_URL` to production endpoint
3. Update `NDPS_RETURN_URL` to production domain
4. Ensure database schema includes required tables
5. Test encryption/decryption with production keys

### Dependencies Required
- `crypto` (built-in Node.js module)
- `mysql2` or equivalent database driver
- Express.js framework

## Testing Status
- ✅ Backend routes working
- ✅ Encryption/decryption working  
- ✅ Database integration working
- ✅ Form submission working
- ❌ NDPS UAT server responding with blank page

---

**Files to copy to production server**:
1. `backend/routes/ndps-payment.js`
2. `backend/.env` (updated with NDPS variables)
3. `backend/app.js` (with NDPS routes added)

**Database changes**: No schema changes required if orders/payments tables exist.