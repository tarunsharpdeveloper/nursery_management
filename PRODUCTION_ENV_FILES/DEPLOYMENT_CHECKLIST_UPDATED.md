# PRODUCTION DEPLOYMENT CHECKLIST - UPDATED WITH LIVE CREDENTIALS
## AWANTIKA SEEDS - NDPS Live Deployment (FINAL VERSION)

## ✅ NEW PRODUCTION FILES TO DEPLOY

### 1. Backend Environment
- **File**: `backend_production.env` (UPDATED with live credentials)
- **Deploy to**: `backend/.env` on live server
- **Contains**: Live NDPS credentials from NTT Data

### 2. Frontend Environment  
- **File**: `frontend_production_updated.env` (NEW)
- **Deploy to**: `frontend/.env` on live server
- **Contains**: Production CDN URL and API endpoints

### 3. Frontend Checkout Page
- **File**: `checkout_page_production.tsx` (NEW - CRITICAL UPDATE)
- **Deploy to**: `frontend/src/app/checkout/page.tsx` on live server
- **Changes**: Uses environment variable for CDN URL instead of hardcoded UAT URL

## 🔧 LIVE PRODUCTION CREDENTIALS (FROM NTT DATA)

### NDPS Gateway Configuration:
- **Merchant ID / LoginID / UserID**: 856377
- **Product ID**: AWANT  
- **Dashboard Login Password**: 856377_titan@123
- **Auth API URL**: https://payment1.atomtech.in/ots/aipay/auth
- **CDN URL (PRODUCTION)**: https://psa.atomtech.in/staticdata/ots/js/atomcheckout.js
- **Dashboard URL**: https://titan.atomtech.in/titan_merchant_console

### Encryption Keys:
- **HashRequest Key**: 27786aad29c63b6a3a
- **HashResponse Key**: 9f9153a2a8671ae683
- **AES Request Salt/IV**: 74ABEA4102D67FD3491F23AB9D4636AB
- **AES Response Salt/IV**: 9B130849756D796521AC4DBEC26D3B2B

### Configuration:
- **MCC Code**: 5261
- **Payment Options**: UPI
- **Surcharge**: Yes
- **Registered Domain**: https://awantikaseeds.com/

## 🏦 SETTLEMENT ACCOUNT (ACTIVE)
- **Account Name**: AWANT
- **Account No**: 922020062155675
- **Beneficiary Name**: AWANTIKA SEEDS
- **IFSC**: UTIB0004605
- **Status**: ACTIVE

## 📋 DEPLOYMENT STEPS

### Step 1: Backend Deployment
```bash
# 1. Copy backend environment file
cp backend_production.env /path/to/backend/.env

# 2. Restart backend service
pm2 restart backend-app-name
# OR
systemctl restart your-backend-service
```

### Step 2: Frontend Deployment  
```bash
# 1. Copy frontend environment file
cp frontend_production_updated.env /path/to/frontend/.env

# 2. Copy updated checkout page
cp checkout_page_production.tsx /path/to/frontend/src/app/checkout/page.tsx

# 3. Rebuild and restart frontend
cd /path/to/frontend
npm run build
pm2 restart frontend-app-name
# OR
systemctl restart your-frontend-service
```

### Step 3: Database Verification
```bash
# Verify transaction ID columns exist
mysql -u awantikaseeds_eway -p awantikaseeds_eway
> DESCRIBE payments;
> # Look for merchant_transaction_id and atom_transaction_id columns
```

## 🧪 CRITICAL TESTING CHECKLIST

### 1. Payment Gateway Test
- [ ] Visit checkout page
- [ ] Verify production CDN script loads: `https://psa.atomtech.in/staticdata/ots/js/atomcheckout.js`
- [ ] Complete test payment with live gateway
- [ ] Verify popup opens correctly
- [ ] Complete payment flow
- [ ] Check success page shows transaction IDs

### 2. Admin Interface Test
- [ ] Login to admin panel
- [ ] Go to orders list: `/admin/orders`
- [ ] Verify both transaction ID columns are visible
- [ ] Click on order details
- [ ] Verify transaction IDs display in order view

### 3. API Endpoints Test
```bash
# Test callback URL (should return 400 - endpoint working)
curl -X POST https://api.awantikaseeds.com/api/ndps/response

# Test requery API
curl -X POST https://api.awantikaseeds.com/api/ndps/requery \
  -H "Content-Type: application/json" \
  -d '{"merchTxnId":"NURSERY_123_test"}'

# Test health endpoint
curl -X GET https://api.awantikaseeds.com/api/health
```

### 4. Database Verification
```sql
-- Check recent payment with transaction IDs
SELECT 
  id, order_id, status, amount,
  merchant_transaction_id, 
  atom_transaction_id,
  created_at 
FROM payments 
ORDER BY created_at DESC 
LIMIT 5;
```

## ⚠️ CRITICAL DIFFERENCES FROM UAT

### CDN URL Changes:
- **UAT**: `https://pgtest.atomtech.in/staticdata/ots/js/atomcheckout.js`
- **PRODUCTION**: `https://psa.atomtech.in/staticdata/ots/js/atomcheckout.js`

### API URL Changes:
- **UAT**: `https://caller.atomtech.in/ots/aipay/auth`
- **PRODUCTION**: `https://payment1.atomtech.in/ots/aipay/auth`

### Merchant ID Changes:
- **UAT**: 446442
- **PRODUCTION**: 856377

## 📞 NTT DATA COMPLIANCE STATUS

### ✅ COMPLETED REQUIREMENTS:
- [x] Re-query API implemented and working
- [x] Callback API implemented and working  
- [x] Transaction ID storage in dedicated database columns
- [x] Transaction ID display in admin interface
- [x] All mandatory APIs ready for production approval
- [x] Live credentials received and configured

## 🚨 IMPORTANT WARNINGS

1. **DO NOT** change your local development files - these are separate production files
2. **BACKUP** your database before deployment
3. **TEST THOROUGHLY** with live credentials before going fully live
4. **MONITOR** payment transactions closely during first few live orders
5. **VERIFY** callback URLs are accessible from NTT Data servers
6. **KEEP** transaction IDs for audit purposes

## ✅ SUCCESS CRITERIA

After deployment, verify:
- [ ] Payment popup opens with LIVE gateway (not test)
- [ ] Successful payment redirects to success page
- [ ] Transaction IDs displayed on success page
- [ ] Transaction IDs stored in database
- [ ] Transaction IDs visible in admin orders list
- [ ] Transaction IDs visible in admin order details
- [ ] Callback API receiving real payment status updates
- [ ] Requery API working for payment status verification
- [ ] NTT Data dashboard accessible with live credentials

## 📋 POST-DEPLOYMENT VERIFICATION

### Monitor These Files:
1. **Backend logs**: Check for NDPS API calls and responses
2. **Database**: Monitor payments table for new entries with transaction IDs
3. **Frontend console**: Verify no CDN loading errors
4. **Network tab**: Confirm production CDN URL is being used

### Expected Log Messages:
```
✅ AtomPaynetz script loaded successfully from: https://psa.atomtech.in/staticdata/ots/js/atomcheckout.js
✅ NDPS payment initiated successfully
✅ Transaction IDs stored: NURSERY_XXX_XXX and 1100000XXXXXXX
```

Once all checkpoints pass, your NDPS integration is LIVE with production credentials!