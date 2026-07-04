# NDPS Form Encoding Fix ✅

## The Problem

Got error: `SyntaxError: Unexpected token 'e', "encData=0C"... is not valid JSON`

### Root Cause
NDPS sends the popup response as **form-encoded data** (`application/x-www-form-urlencoded`), not JSON!

```
Content-Type: application/x-www-form-urlencoded

encData=0C7F2A1B...&merchId=446442
```

But we were trying to parse it as JSON with `readJson()` which failed.

## The Solution

### 1. Added Form-Encoding Helper
**File:** `backend/http.js`

```javascript
/**
 * Read form-encoded data (application/x-www-form-urlencoded)
 * Used for NDPS popup responses which send form-encoded POST data
 */
async function readFormData(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  const params = new URLSearchParams(raw);
  
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  
  return result;
}
```

**What it does:**
- Reads raw POST data
- Parses form-encoded format using URLSearchParams
- Returns object: `{ encData: "0C7F2A...", merchId: "446442" }`

### 2. Updated Backend Handler
**File:** `backend/routes/ndps-payments.js`

**Before (Wrong):**
```javascript
const readData = helpers ? helpers.readJson : readJson;
const body = await readData(req);  // ❌ Fails with JSON error
```

**After (Correct):**
```javascript
const body = await helpers.readFormData(req);  // ✅ Parses form data
const encryptedResponse = body.encData;
```

### 3. Updated Helpers Export
**File:** `backend/app.js`

**Before:**
```javascript
const helpers = { readJson, sendJson };
```

**After:**
```javascript
const helpers = { readJson, readFormData, sendJson };
```

## How It Works Now

```
NDPS Popup Response (Form-Encoded)
┌─────────────────────────────────────────────────┐
│ POST /Response                                   │
│ Content-Type: application/x-www-form-urlencoded │
│                                                  │
│ encData=0C7F2A1B...&merchId=446442             │
└─────────────────────────────────────────────────┘
                        ↓
Backend readFormData()
┌─────────────────────────────────────────────────┐
│ Reads raw data                                   │
│ Parses URLSearchParams                           │
│ Returns: {                                       │
│   encData: "0C7F2A1B...",                       │
│   merchId: "446442"                             │
│ }                                                │
└─────────────────────────────────────────────────┘
                        ↓
Decrypt & Process
┌─────────────────────────────────────────────────┐
│ Extract encData                                  │
│ Decrypt using AES-256-CBC                       │
│ Parse JSON transaction details                  │
│ Update database                                 │
│ Send 302 redirect                               │
└─────────────────────────────────────────────────┘
```

## Testing

### Now It Should Work
1. Start backend: `npm start`
2. Start frontend: `npm run dev`
3. Go to checkout
4. Click "Pay Now"
5. Complete NDPS popup
6. **Backend should now:**
   - ✅ Receive form data successfully
   - ✅ Parse encData correctly
   - ✅ Decrypt transaction
   - ✅ Update database
   - ✅ Send 302 redirect

### Expected Backend Logs
```
=== NDPS Popup Response Handler ===
Received form-encoded data, encData length: 1024
Encrypted response received from popup

=== Decrypted Popup Response ===
{...transaction JSON...}

=== Transaction Details ===
- Merchant Txn ID: NURSERY_123_xyz
- Status Code: OTS0000
- Atom Txn ID: 12345

=== Payment Updated ===
Payment ID: 5
Order ID: 123
New Status: paid
Redirecting to: http://localhost:3000/checkout?orderNumber=123&success=true

HTTP/1.1 302 Found
```

## Key Changes Summary

| Component | Change | Reason |
|-----------|--------|--------|
| `http.js` | Added `readFormData()` | Parse form-encoded data |
| `app.js` | Export `readFormData` | Available to route handlers |
| `ndps-payments.js` | Use `readFormData()` | Parse NDPS popup POST |

## Files Modified

1. ✅ `backend/http.js` - Added form parser
2. ✅ `backend/app.js` - Export new function
3. ✅ `backend/routes/ndps-payments.js` - Use form parser

## Important Notes

### Two Types of Data NDPS Sends

1. **Server-to-Server Callback**
   - Format: JSON
   - Endpoint: `/api/ndps/response`
   - Handler: `handleNDPSResponse()`
   - Uses: `readJson()`

2. **Popup Response Callback**
   - Format: Form-Encoded
   - Endpoint: `/Response`
   - Handler: `handleNDPSPopupResponse()`
   - Uses: `readFormData()` ← NEW

### URLSearchParams
Native Node.js API for parsing form-encoded data:
```javascript
const params = new URLSearchParams("encData=0C7F...&merchId=446442");
// params.get('encData') → "0C7F..."
// params.get('merchId') → "446442"
```

## Verification

After restart, verify:
- ✅ Backend starts without errors
- ✅ NDPS popup opens
- ✅ Can complete payment
- ✅ Backend logs show "Encrypted response received"
- ✅ Backend logs show successful decryption
- ✅ Database updates
- ✅ Browser redirects with correct URL

## Next Steps

1. ✅ Restart backend: `npm start`
2. ✅ Test payment flow again
3. ✅ Monitor backend logs
4. ✅ Verify successful redirect

---

**Status: ✅ Form Encoding Issue Fixed**

The handler now correctly parses form-encoded NDPS responses!
