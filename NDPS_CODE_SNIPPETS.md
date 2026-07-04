# NDPS Payment Integration - Code Snippets

## Complete Code References

### 1. Response Page Component
**File:** `frontend/src/app/Response/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

export default function ResponsePage() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'failure'>('processing');
  const [message, setMessage] = useState('Processing your payment...');
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const handlePaymentResponse = async () => {
      try {
        // Retrieve payment ID from localStorage
        const paymentId = localStorage.getItem('ndps_payment_id');
        const merchTxnId = localStorage.getItem('ndps_merch_txn_id');

        if (!paymentId) {
          setStatus('failure');
          setMessage('Payment session not found. Please try again.');
          setTimeout(() => router.push('/checkout'), 3000);
          return;
        }

        // Check payment status from backend
        const statusResponse = await apiRequest<any>(`/api/ndps/status/${paymentId}`);

        setPaymentData(statusResponse);

        if (statusResponse.status === 'paid') {
          setStatus('success');
          setMessage('✅ Payment successful! Your order is being processed.');
          localStorage.removeItem('ndps_payment_id');
          localStorage.removeItem('ndps_merch_txn_id');
          
          setTimeout(() => {
            router.push(`/checkout?orderNumber=${statusResponse.orderNumber}&success=true`);
          }, 2000);
        } else if (statusResponse.status === 'failed') {
          setStatus('failure');
          setMessage('❌ Payment failed. Please try again or use a different payment method.');
          
          setTimeout(() => {
            router.push('/checkout?payment=failed');
          }, 3000);
        } else if (statusResponse.status === 'pending') {
          // Retry if still pending
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (error: any) {
        console.error('Response handling error:', error);
        setStatus('failure');
        setMessage('An error occurred. Please contact support.');
        
        setTimeout(() => {
          router.push('/checkout');
        }, 3000);
      }
    };

    const timer = setTimeout(handlePaymentResponse, 500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%'
      }}>
        {status === 'processing' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <h1 style={{ marginBottom: '10px', color: '#333' }}>Processing Payment</h1>
            <p style={{ color: '#666', marginBottom: '20px' }}>{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
            <h1 style={{ marginBottom: '10px', color: '#4CAF50' }}>Payment Successful</h1>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Thank you for your payment!
            </p>
            {paymentData && (
              <div style={{
                backgroundColor: '#f0f7f0',
                padding: '15px',
                borderRadius: '4px',
                textAlign: 'left'
              }}>
                <p><strong>Order Number:</strong> {paymentData.orderNumber}</p>
                <p><strong>Amount:</strong> ₹{parseFloat(paymentData.amount).toFixed(2)}</p>
                <p><strong>Status:</strong> Paid</p>
              </div>
            )}
          </>
        )}

        {status === 'failure' && (
          <>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
            <h1 style={{ marginBottom: '10px', color: '#f44336' }}>Payment Failed</h1>
            <p style={{ color: '#666', marginBottom: '20px' }}>{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
```

### 2. Payment Initiation - Frontend Changes
**File:** `frontend/src/components/NDPSPayment.tsx` (Relevant sections)

```typescript
const handlePayment = async () => {
  if (!scriptLoaded) {
    onError('Payment system is still loading. Please try again.');
    return;
  }

  setLoading(true);
  
  try {
    // Calculate dynamic return URL
    const protocol = window.location.protocol;
    const host = window.location.host;
    const returnUrl = `${protocol}//${host}/Response`;
    
    console.log('Return URL:', returnUrl);

    // Call backend with returnUrl
    const response = await apiRequest<{
      success: boolean;
      paymentId: number;
      atomTokenId: number;
      merchId: string;
      merchTxnId: string;
      customerEmail: string;
      customerMobile: string;
      returnUrl: string;
      env: 'uat' | 'prod';
    }>('/api/ndps/initiate', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        amount,
        customerEmail,
        customerMobile,
        returnUrl: returnUrl  // ✅ NEW
      })
    });

    // Store payment info for response page
    localStorage.setItem('ndps_payment_id', response.paymentId.toString());
    localStorage.setItem('ndps_merch_txn_id', response.merchTxnId);

    // Open AtomPaynetz popup
    const atomConfig = {
      atomTokenId: response.atomTokenId.toString(),
      merchId: response.merchId.toString(),
      custEmail: response.customerEmail,
      custMobile: response.customerMobile,
      returnUrl: response.returnUrl  // ✅ From backend
    };

    const atom = new window.AtomPaynetz(atomConfig, response.env);
    
  } catch (error: any) {
    console.error('Payment initiation failed:', error);
    onError(error.message || 'Failed to initiate payment');
    setLoading(false);
  }
};
```

### 3. Payment Initiation - Backend Changes
**File:** `backend/routes/ndps-payments.js` (Relevant sections)

```javascript
async function initiateNDPSPayment(req, res, helpers) {
  try {
    const body = helpers ? await helpers.readJson(req) : await readJson(req);
    const { orderId, customerEmail, customerMobile, amount, returnUrl } = body;

    // Validate required fields
    if (!orderId || !customerEmail || !customerMobile || !amount) {
      const send = helpers ? helpers.sendJson : sendJson;
      return send(res, 400, { 
        error: 'Missing required fields',
        received: { orderId, customerEmail, customerMobile, amount }
      });
    }

    // Use provided returnUrl or fall back to config
    const finalReturnUrl = returnUrl || config.returnUrl;
    console.log('Return URL to use:', finalReturnUrl);

    // ... existing code for order validation ...

    // Create payment request with returnUrl
    const paymentRequest = {
      payInstrument: {
        headDetails: {
          version: config.version,
          api: config.api,
          platform: config.platform
        },
        merchDetails: {
          merchId: config.merchId,
          userId: config.userId,
          password: config.password,
          merchTxnId: merchTxnId,
          merchTxnDate: merchTxnDate
        },
        payDetails: {
          amount: parseFloat(amount).toFixed(2),
          product: config.product,
          custAccNo: orderId.toString(),
          txnCurrency: "INR"
        },
        custDetails: {
          custEmail: customerEmail,
          custMobile: customerMobile
        },
        extras: {
          udf1: `order_${orderId}`,
          udf2: "nursery_payment",
          udf3: finalReturnUrl,  // ✅ USE DYNAMIC returnUrl
          udf4: "",
          udf5: ""
        }
      }
    };

    // ... existing code for encryption and NDPS call ...

    // Return response with dynamic returnUrl
    const responsePayload = {
      success: true,
      paymentId: paymentId,
      atomTokenId: responseData.atomTokenId,
      merchId: config.merchId,
      merchTxnId: merchTxnId,
      customerEmail: customerEmail,
      customerMobile: customerMobile,
      returnUrl: finalReturnUrl,  // ✅ RETURN DYNAMIC returnUrl
      env: isProduction ? 'prod' : 'uat'
    };
    
    const send = helpers ? helpers.sendJson : sendJson;
    send(res, 200, responsePayload);

  } catch (error) {
    console.error('NDPS Payment initiation error:', error);
    const send = helpers ? helpers.sendJson : sendJson;
    send(res, 500, { error: 'Failed to initiate payment' });
  }
}
```

### 4. Configuration in .env

```env
# NDPS Gateway Configuration
NDPS_MERCH_ID=446442
NDPS_USER_ID=
NDPS_PASSWORD=Test@123

# API URLs
NDPS_API_URL=https://caller.atomtech.in/ots/aipay/auth
NDPS_RESPONSE_URL=http://localhost:4000/api/ndps/response
NDPS_RETURN_URL=http://localhost:3000/Response

# Encryption Keys
NDPS_REQUEST_KEY=A4476C2062FFA58980DC8F79EB6A799E
NDPS_REQUEST_SALT=A4476C2062FFA58980DC8F79EB6A799E
NDPS_RESPONSE_KEY=75AEF0FA1B94B3C10D4F5B268F757F11
NDPS_RESPONSE_SALT=75AEF0FA1B94B3C10D4F5B268F757F11
NDPS_REQUEST_HASH_KEY=KEY123657234
NDPS_RESPONSE_HASH_KEY=KEYRESP123657234

# Node Environment
NODE_ENV=development
```

### 5. Request-Response Examples

#### Request: Initiate Payment
```javascript
POST /api/ndps/initiate
Content-Type: application/json

{
  "orderId": 123,
  "amount": 1000,
  "customerEmail": "user@example.com",
  "customerMobile": "9876543210",
  "returnUrl": "http://localhost:3000/Response"
}
```

#### Response: Payment Initialized
```javascript
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "paymentId": 5,
  "atomTokenId": 1234567890,
  "merchId": "446442",
  "merchTxnId": "NURSERY_123_abc123",
  "customerEmail": "user@example.com",
  "customerMobile": "9876543210",
  "returnUrl": "http://localhost:3000/Response",
  "env": "uat"
}
```

#### Request: Check Payment Status
```javascript
GET /api/ndps/status/5

(No body required)
```

#### Response: Payment Status
```javascript
HTTP/1.1 200 OK
Content-Type: application/json

{
  "paymentId": 5,
  "orderId": 123,
  "orderNumber": "ORD-2024-00123",
  "status": "paid",
  "amount": "1000.00",
  "paidAt": "2024-07-03T10:30:45.000Z",
  "gatewayPaymentId": "NURSERY_123_abc123"
}
```

### 6. Checkout Integration Example

```typescript
// In checkout component
import NDPSPayment from '@/components/NDPSPayment';

export default function CheckoutPage() {
  const [order, setOrder] = useState(null);

  const handlePaymentSuccess = (paymentId: number) => {
    console.log('Payment successful:', paymentId);
    // Order confirmation handled by /Response page
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // User stays on checkout, can retry
  };

  return (
    <div>
      {/* ... order details ... */}
      
      <NDPSPayment
        orderId={order.id}
        amount={order.total}
        customerEmail={user.email}
        customerMobile={user.phone}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  );
}
```

### 7. Database Query Examples

```sql
-- Check payment status
SELECT id, order_id, payment_status, amount, created_at 
FROM payments 
WHERE id = 5;

-- Find by merchant transaction ID
SELECT id, order_id, payment_status, amount, paid_at, remarks 
FROM payments 
WHERE gateway_payment_id = 'NURSERY_123_abc123';

-- List recent payments
SELECT p.id, p.order_id, o.order_number, p.payment_status, 
       p.amount, p.created_at, p.paid_at
FROM payments p
JOIN orders o ON p.order_id = o.id
WHERE p.created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY p.created_at DESC;
```

### 8. Error Handling Examples

```typescript
// Handle decryption errors
try {
  const decryptedData = decryptData(encryptedResponse);
  const responseData = JSON.parse(decryptedData);
} catch (error) {
  console.error('Decryption failed:', error);
  // Log error, return error response
  return send(res, 400, { error: 'Failed to decrypt response' });
}

// Handle missing payment
const [paymentRows] = await pool.query(
  'SELECT * FROM payments WHERE id = ?',
  [paymentId]
);

if (paymentRows.length === 0) {
  return send(res, 404, { error: 'Payment not found' });
}

// Handle network errors in Response page
try {
  const statusResponse = await apiRequest(`/api/ndps/status/${paymentId}`);
} catch (error) {
  // Retry mechanism
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}
```

### 9. Logging Examples

```javascript
// In Backend (logs to console)
console.log('=== NDPS Payment Initiation ===');
console.log('Order ID:', orderId);
console.log('Amount:', amount);
console.log('Return URL:', finalReturnUrl);
console.log('=== Sending to NTT AUTH API ===');
console.log('Merchant Txn ID:', merchTxnId);
console.log('Request URL:', config.apiUrl);
console.log('=== NTT AUTH API Response ===');
console.log('Status:', authResponse.status);
console.log('=== Payment Updated ===');
console.log('Payment ID:', payment.id);
console.log('New Status:', newStatus);

// In Frontend (logs to browser console)
console.log('=== NDPS Popup Redirect ===');
console.log('Payment ID from storage:', paymentId);
console.log('Checking payment status from backend...');
console.log('=== Payment Status Response ===');
console.log(JSON.stringify(statusResponse, null, 2));
```

### 10. Production Deployment Template

```env
# Production Configuration (.env)

# Environment
NODE_ENV=production

# NDPS Merchant Details (Production)
NDPS_MERCH_ID=YOUR_PRODUCTION_MERCH_ID
NDPS_USER_ID=YOUR_PRODUCTION_USER_ID
NDPS_PASSWORD=YOUR_PRODUCTION_PASSWORD

# Production URLs
NDPS_API_URL=https://paynetz.atomtech.in/ots/aipay/auth
NDPS_RESPONSE_URL=https://api.yourdomain.com/api/ndps/response
NDPS_RETURN_URL=https://yourdomain.com/Response

# Production Encryption Keys (from NTT DATA)
NDPS_REQUEST_KEY=YOUR_PRODUCTION_REQUEST_KEY
NDPS_REQUEST_SALT=YOUR_PRODUCTION_REQUEST_SALT
NDPS_RESPONSE_KEY=YOUR_PRODUCTION_RESPONSE_KEY
NDPS_RESPONSE_SALT=YOUR_PRODUCTION_RESPONSE_SALT
NDPS_REQUEST_HASH_KEY=YOUR_PRODUCTION_REQUEST_HASH_KEY
NDPS_RESPONSE_HASH_KEY=YOUR_PRODUCTION_RESPONSE_HASH_KEY

# Backend Port
BACKEND_PORT=4000
```

## Summary of Changes

### What Changed
1. **Frontend**: Added dynamic `returnUrl` calculation and passing to backend
2. **Backend**: Modified payment initiation to accept and use `returnUrl` parameter
3. **New Component**: Created `/Response` page to handle popup redirect

### What Stayed the Same
1. NDPS encryption/decryption logic
2. Database schema
3. Server-to-server callback handling
4. Payment status checking logic

### Benefits
✅ Flexible URL configuration  
✅ Works across different environments  
✅ Proper popup redirect handling  
✅ Better error handling  
✅ Improved user experience  
✅ Backward compatible  

## Testing Commands

```bash
# Backend startup
cd backend
npm install
npm start

# Frontend startup  
cd frontend
npm install
npm run dev

# Check environment variables are set
echo $NDPS_MERCH_ID
echo $NDPS_RESPONSE_URL
echo $NDPS_RETURN_URL

# View backend logs
tail -f backend.log

# Test payment endpoint
curl -X POST http://localhost:4000/api/ndps/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "amount": 100,
    "customerEmail": "test@example.com",
    "customerMobile": "9876543210",
    "returnUrl": "http://localhost:3000/Response"
  }'
```
