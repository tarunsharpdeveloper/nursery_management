# NDPS Payment Flow - Detailed Diagram

## Complete Request-Response Cycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CHECKOUT PAGE                                       │
│  User enters order details and clicks "Pay with NDPS"                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   NDPSPayment Component (Frontend)                           │
│                                                                              │
│  1. Calculate returnUrl:                                                    │
│     returnUrl = "http://localhost:3000/Response"                           │
│                                                                              │
│  2. Save to localStorage:                                                   │
│     localStorage.ndps_payment_id = paymentId                               │
│     localStorage.ndps_merch_txn_id = merchTxnId                           │
│                                                                              │
│  3. Call backend API                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                 ┌──────────────────┴──────────────────┐
                 │                                     │
                 ▼                                     ▼
    ┌────────────────────────────┐      ┌────────────────────────────┐
    │  REQUEST to Backend        │      │  REQUEST BODY             │
    │  POST /api/ndps/initiate   │      │  {                        │
    │  http://localhost:4000/... │      │    orderId: 123,          │
    │                            │      │    amount: 1000,          │
    │  Headers:                  │      │    customerEmail: "...",  │
    │  Content-Type:             │      │    customerMobile: "...", │
    │    application/json        │      │    returnUrl:             │
    │                            │      │      "http://localhost... │
    │                            │      │      :3000/Response"  ✅ NEW
    │                            │      │  }                        │
    └────────────────────────────┘      └────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              Backend: initiateNDPSPayment() Handler                          │
│                                                                              │
│  1. Parse request body                                                      │
│  2. Validate fields                                                         │
│  3. Check order exists in database                                          │
│  4. Extract returnUrl (or use config default) ✅ NEW                       │
│  5. Generate merchTxnId = "NURSERY_123_xyz123"                            │
│  6. Build payment request JSON:                                            │
│     {                                                                       │
│       payInstrument: {                                                     │
│         headDetails: { version, api, platform },                           │
│         merchDetails: { merchId, userId, password, ... },                │
│         payDetails: { amount, product, txnCurrency: "INR" },             │
│         custDetails: { custEmail, custMobile },                           │
│         extras: {                                                         │
│           udf1: "order_123",                                              │
│           udf2: "nursery_payment",                                        │
│           udf3: returnUrl  ✅ NEW (http://localhost:3000/Response)      │
│           ...                                                             │
│         }                                                                 │
│       }                                                                   │
│     }                                                                     │
│  7. Encrypt JSON using AES-256-CBC + PBKDF2                             │
│  8. Save payment to database (status: pending)                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
    ┌────────────────────────────┐      ┌────────────────────────────┐
    │  REQUEST to NDPS           │      │  REQUEST BODY (Form)      │
    │  POST                      │      │  encData=<encrypted_json> │
    │  https://caller.atomtech.. │      │  &merchId=446442          │
    │  .in/ots/aipay/auth        │      │                           │
    │                            │      │  Content-Type:            │
    │  (UAT: caller.atomtech)    │      │  application/x-www-form.. │
    │  (PROD: paynetz.atomtech)  │      │  -urlencoded              │
    │                            │      │                           │
    └────────────────────────────┘      └────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NTT DATA NDPS AUTH API                                    │
│                                                                              │
│  Processes payment request and returns token                               │
│  Response: encData=<encrypted_response>&merchId=446442                     │
│            OR just: <encrypted_hex_string>                                 │
│                                                                              │
│  Inside encrypted response:                                                │
│  {                                                                         │
│    atomTokenId: 1234567890,        ✅ Token for popup                     │
│    responseDetails: {                                                      │
│      statusCode: "OTS0000",                                                │
│      message: "Token generated"                                           │
│    },                                                                      │
│    ...                                                                     │
│  }                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
    ┌────────────────────────────┐      ┌────────────────────────────┐
    │  RESPONSE to Frontend       │      │  RESPONSE BODY            │
    │  POST /api/ndps/initiate    │      │  {                        │
    │  200 OK                    │      │    success: true,         │
    │                            │      │    paymentId: 5,          │
    │                            │      │    atomTokenId: 123456,   │
    │                            │      │    merchId: "446442",     │
    │                            │      │    merchTxnId: "NURSERY..│
    │                            │      │    customerEmail: "...",  │
    │                            │      │    customerMobile: "...", │
    │                            │      │    returnUrl:             │
    │                            │      │      "http://localhost... │
    │                            │      │      :3000/Response",✅   │
    │                            │      │    env: "uat"             │
    │                            │      │  }                        │
    └────────────────────────────┘      └────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   NDPSPayment Component Opens Popup                          │
│                                                                              │
│  1. Create AtomPaynetz instance                                            │
│  2. Pass atomTokenId and other config                                      │
│  3. Popup opens automatically                                              │
│  4. User enters payment details and completes transaction                  │
│                                                                              │
│  Return URL in popup config: http://localhost:3000/Response ✅             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    │ (Parallel Processes)           │
                    │                                │
        ┌───────────▼────────────────┐   ┌──────────▼─────────────┐
        │  Process A: Browser Redirect   │   Process B: Server CB   │
        │  (Immediate)                   │   (Background)          │
        └────────────────────────────────┘   └─────────────────────┘


PROCESS A: USER REDIRECT (Browser)
═══════════════════════════════════════════════════════════════════════════

After user completes payment in popup, NDPS redirects user:
                                    │
                                    ▼
    ┌────────────────────────────┐
    │  Browser Redirect          │
    │  HTTP 302 Found            │
    │  Location: http://localhost│
    │  :3000/Response            │
    └────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    /Response Page Loads (Frontend)                           │
│                                                                              │
│  1. Page mounts, useEffect runs                                            │
│  2. Retrieve from localStorage:                                            │
│     - paymentId = 5                                                        │
│     - merchTxnId = "NURSERY_123_xyz123"                                   │
│  3. Show "Processing your payment..." message                              │
│  4. Call backend to check payment status                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
    ┌────────────────────────────┐
    │  REQUEST to Backend        │
    │  GET /api/ndps/status/5    │
    │  http://localhost:4000/... │
    │                            │
    │  No body, simple GET       │
    └────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│               Backend: checkPaymentStatus() Handler                         │
│                                                                              │
│  1. Extract paymentId from URL: 5                                          │
│  2. Query database: SELECT * FROM payments WHERE id = 5                    │
│  3. Return payment details                                                 │
│                                                                              │
│  ⚠️  NOTE: At this point, payment status might still be "pending"         │
│           because server-to-server callback hasn't arrived yet             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
    ┌────────────────────────────┐      ┌──────────────────────────────┐
    │  RESPONSE from Backend     │      │  RESPONSE BODY               │
    │  GET /api/ndps/status/5    │      │  {                           │
    │  200 OK                    │      │    paymentId: 5,             │
    │                            │      │    orderId: 123,             │
    │                            │      │    orderNumber: "ORD-2024..", │
    │                            │      │    status: "pending" | "paid"│
    │                            │      │    amount: "1000.00",        │
    │                            │      │    paidAt: null | timestamp, │
    │                            │      │    gatewayPaymentId: "NURS.."│
    │                            │      │  }                           │
    └────────────────────────────┘      └──────────────────────────────┘
                                    │
                    ┌───────────────┴──────────────────┐
                    │ Check Status Value                │
                    │                                  │
        ┌───────────▼─────────────┐    ┌──────────────▼─────────────┐
        │                         │    │                           │
    If "paid"              If "pending"              If "failed"
        │                         │                    │
        ▼                         ▼                    ▼
   ✅ Success            ⏳ Still Processing       ❌ Failure
   • Show success         • Show processing msg      • Show error
   • Display order info   • Wait 2 seconds           • Display reason
   • Auto-redirect to     • Reload page             • Auto-redirect
     confirmation page    • Recheck status           back to checkout


PROCESS B: SERVER-TO-SERVER CALLBACK (Background)
═══════════════════════════════════════════════════════════════════════════

While user is being redirected to /Response, NDPS also sends:
                                    │
                                    ▼
    ┌────────────────────────────┐      ┌───────────────────────────┐
    │  REQUEST from NDPS         │      │  REQUEST BODY             │
    │  POST /api/ndps/response   │      │  {                        │
    │  http://localhost:4000/... │      │    "encData":             │
    │                            │      │    "<encrypted_json>",   │
    │  Headers:                  │      │    "merchId": "446442"    │
    │  Content-Type:             │      │  }                        │
    │    application/json        │      │                           │
    │  (or form-urlencoded)      │      │  Encrypted JSON inside:   │
    │                            │      │  {                        │
    │                            │      │    payInstrument: [       │
    │                            │      │      {                    │
    │                            │      │        merchDetails: {...}│
    │                            │      │        payDetails: {...}  │
    │                            │      │        responseDetails: { │
    │                            │      │          statusCode: ...  │
    │                            │      │          message: ...     │
    │                            │      │        }                  │
    │                            │      │        ...                │
    │                            │      │      }                    │
    │                            │      │    ]                      │
    │                            │      │  }                        │
    └────────────────────────────┘      └───────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│            Backend: handleNDPSResponse() Handler                             │
│                                                                              │
│  1. Extract encData from request body                                       │
│  2. Decrypt using AES-256-CBC + PBKDF2 ✅ Same keys as request             │
│  3. Parse decrypted JSON                                                    │
│  4. Extract transaction details:                                           │
│     - merchTxnId = "NURSERY_123_xyz123"                                   │
│     - statusCode = "OTS0000" (success) or other (failure)                 │
│     - statusMessage = "Transaction successful"                             │
│     - atomTxnId = NDPS transaction ID                                      │
│  5. Find payment record: SELECT * FROM payments                            │
│     WHERE gateway_payment_id = "NURSERY_123_xyz123"                        │
│  6. Determine new status:                                                  │
│     - If statusCode === "OTS0000" → status = "paid"                       │
│     - Else → status = "failed"                                             │
│  7. Update payment record:                                                 │
│     UPDATE payments SET payment_status = "paid",                          │
│     paid_at = NOW(), remarks = "..."                                      │
│  8. Update order record:                                                   │
│     UPDATE orders SET payment_status = "paid"                             │
│  9. Return success response                                                │
│                                                                              │
│  ⚠️  Now when /Response page rechecks status, it will get "paid"          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
    ┌────────────────────────────┐
    │  RESPONSE to NDPS          │
    │  POST /api/ndps/response   │
    │  200 OK                    │
    │  {                         │
    │    message: "Transaction  │
    │    successful",            │
    │    status: "OK"            │
    │  }                         │
    └────────────────────────────┘


TIMELINE VISUALIZATION
═════════════════════════════════════════════════════════════════════════════

Time    User Browser                  Backend DB         NDPS Server
────    ────────────────────────────  ─────────────────  ──────────────
T+0s    Click "Pay Now"
        ↓ POST /api/ndps/initiate
        
T+0.5s                                INSERT INTO        POST to
                                      payments            AUTH API
                                      (status: pending)   
                                                         
T+1s    ← Payment token
        Open popup
        
T+1-60s User enters payment details
        in NDPS popup
        
T+60s   User clicks "Pay" button
        NDPS processes
        
T+61s   ← Redirect to /Response        ← Server callback
        /Response page loads            received!
        GET /api/ndps/status/{id}      
        ↓ (might return "pending"       UPDATE payments
        if callback hasn't               (status: paid)
        arrived yet)                     
                                        UPDATE orders
T+62s   If "pending": wait 2s          (payment_status:
        & retry                         paid)
        
T+63s   GET /api/ndps/status/{id}     
        ↓ Now returns "paid"!          
        
T+64s   Show success message           
        Auto-redirect to confirmation


KEY POINTS
═════════════════════════════════════════════════════════════════════════════

✅ returnUrl = http://localhost:3000/Response
   - Sent by frontend in payment initiation
   - Used by NDPS popup to redirect user
   - Must be publicly accessible in production

✅ Server-to-Server Callback = http://localhost:4000/api/ndps/response
   - Sent by NDPS backend servers
   - Confirms transaction status
   - Updates payment status in database
   - Independent of user redirect

✅ Status Check = http://localhost:4000/api/ndps/status/{paymentId}
   - Called by /Response page
   - Queries current payment status
   - May initially return "pending" while server callback is processing
   - Eventually returns "paid" or "failed"

✅ Two-Phase Confirmation
   - Phase 1: User redirect (immediate, may show "pending")
   - Phase 2: Server callback (background, updates status)
   - Phase 3: Status check retry (confirms final status)

✅ Error Handling
   - Network timeout: Retry status check
   - Decryption error: Log and return error
   - Missing payment: Return 404
   - Invalid signature: Log warning and continue
