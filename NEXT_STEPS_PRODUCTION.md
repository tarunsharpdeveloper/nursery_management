# NDPS Payment System - Next Steps for Production

## Current Status

✅ **Completed**:
- Payment encryption/decryption working (AES-256-CBC with PBKDF2)
- Token generation from NTT AUTH API
- Frontend popup opens with payment methods
- Callback handling and database updates
- Payment return page with status checking
- Requery mechanism (database-first with NTT fallback)
- Error handling and graceful degradation

⚠️ **Known UAT Limitations**:
- NTT's STATUS API returns welcome message (API limitation in UAT)
- Payment popup shows "Transaction Failed" (expected for UAT test merchant)
- Test merchant has limited capabilities

## Immediate Actions Required

### 1. Get Production Credentials from NTT Data

**Required Information**:
- Production Merchant ID
- Production Password
- Production Request Key (for encryption)
- Production Response Key (for decryption)
- Production Request Hash Key
- Production Response Hash Key

**Where to get**: Contact NTT Data support or your account manager

**Action**:
```bash
# Create production environment file
# backend/.env.production

NDPS_API_URL=https://paynetz.atomtech.in/ots/aipay/auth
NDPS_RESPONSE_URL=https://yourdomain.com/api/ndps/response
NDPS_RETURN_URL=https://yourdomain.com/payment/return

NDPS_MERCH_ID=your_prod_merch_id
NDPS_PASSWORD=your_prod_password
NDPS_PRODUCT_ID=NSE

NDPS_REQUEST_KEY=your_prod_request_key
NDPS_RESPONSE_KEY=your_prod_response_key
NDPS_REQUEST_HASH_KEY=your_prod_request_hash_key
NDPS_RESPONSE_HASH_KEY=your_prod_response_hash_key

NODE_ENV=production
```

### 2. Update Frontend Configuration

**File**: `frontend/.env.production`

```env
NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com/api
```

**File**: `frontend/src/components/NDPSPayment.tsx`

Update AtomPaynetz script for production:
```javascript
// Change from pgtest.atomtech.in to paynetz.atomtech.in
const script = document.createElement('script');
script.src = 'https://paynetz.atomtech.in/AtomInstaPay/atomInstapay.js';
```

### 3. Set Default Payment Method to COD (Cash on Delivery)

Until NDPS is fully tested in production, use COD as default:

**File**: `frontend/src/app/checkout/page.tsx`

```javascript
// Set COD as default payment method
const [paymentMethod, setPaymentMethod] = useState('cod');
```

**Why**: Allows system to operate safely while NDPS is being fully validated in production.

### 4. SSL Certificate & HTTPS

**Required**:
- Valid SSL certificate for production domain
- All URLs must be HTTPS
- NTT API callbacks require HTTPS return URL

**Action**:
```bash
# On Linux server at /home/jyada/public_html/
# Ensure SSL is configured for nursery.jyada.in

# Test SSL:
curl -I https://nursery.jyada.in
```

### 5. Deploy to Production

**Backend Deployment**:
```bash
# SSH to server
ssh jyada@your.server.ip

cd /home/jyada/public_html/nursery.jyada.in/backend

# Use production env file
source ~/.env.production

# Install dependencies (if not already done)
/opt/cpanel/ea-nodejs22/bin/npm install

# Start backend with PM2
pm2 start app.js --name "nursery-backend" --env production

# Check logs
pm2 logs nursery-backend
```

**Frontend Deployment**:
```bash
cd /home/jyada/public_html/nursery.jyada.in/frontend

# Build for production
/opt/cpanel/ea-nodejs22/bin/npm run build

# Start with PM2
pm2 start npm --name "nursery-frontend" -- start --env production

# Or use ecosystem.config.js
pm2 start ecosystem.config.js --env production
```

### 6. Update Database for Production

**Action**: Backup and verify database structure:
```bash
# Backup database
mysqldump -u your_user -p your_database > backup_$(date +%Y%m%d).sql

# Verify payments table exists and has correct schema
mysql -u your_user -p your_database -e "DESCRIBE payments;"

# Verify orders table has payment_status column
mysql -u your_user -p your_database -e "DESCRIBE orders;"
```

### 7. Configure Callback Handler

NTT Data needs to know your callback URL. They will POST encrypted payment responses to:
```
POST https://yourdomain.com/api/ndps/response
```

**Action**: 
- Inform NTT Data of your callback URL
- Ensure this endpoint is publicly accessible
- Test callback delivery before going live

## Testing Plan

### Phase 1: UAT Testing (Current)
- ✅ Token generation
- ✅ Popup opens
- ✅ Callback received
- ✅ Database updates
- ⚠️ Status API returns welcome message (expected)

### Phase 2: Production Testing

**After deployment to production**:

1. **Test with Real Credentials**
   ```bash
   # 1. Initiate payment
   curl -X POST https://yourdomain.com/api/ndps/initiate \
     -H "Content-Type: application/json" \
     -d '{
       "orderId": 1,
       "customerEmail": "test@example.com",
       "customerMobile": "9876543210",
       "amount": 100
     }'
   
   # Should return atomTokenId
   ```

2. **Test Payment Flow**
   - Open payment page
   - Select payment method
   - Complete payment
   - Verify callback received
   - Check database status
   - Verify return page shows success

3. **Test Error Scenarios**
   - Invalid order ID → should return 404
   - Missing amount → should return 400
   - Network timeout → should handle gracefully
   - Callback delay → should handle pending status

4. **Test Requery**
   ```bash
   curl -X POST https://yourdomain.com/api/ndps/requery \
     -H "Content-Type: application/json" \
     -d '{"merchTxnId": "NURSERY_1_xxxxx"}'
   ```

### Phase 3: Load Testing

**Before going fully live**:
- Test with 10+ concurrent payments
- Monitor server resources
- Check database performance
- Verify callback handling under load

## Monitoring & Logging

### Backend Logs
```bash
# Monitor in real-time
pm2 logs nursery-backend

# Check specific payment
grep "NURSERY_1_" pm2-backend.log

# Search for errors
grep "error\|Error\|ERROR" pm2-backend.log
```

### Database Logging
```sql
-- Check recent payments
SELECT * FROM payments 
ORDER BY created_at DESC 
LIMIT 10;

-- Check failed payments
SELECT * FROM payments 
WHERE payment_status = 'failed' 
ORDER BY created_at DESC;

-- Check payment amounts
SELECT SUM(amount) as total, payment_status 
FROM payments 
GROUP BY payment_status;
```

### Frontend Errors
- Check browser console for JavaScript errors
- Check Network tab for failed API calls
- Monitor /api/ndps/initiate responses

## Rollback Plan

If production payment system fails:

### Quick Disable NDPS
```javascript
// backend/app.js - Comment out NDPS routes
// router.post('/api/ndps/initiate', ...);
// router.post('/api/ndps/response', ...);
```

### Switch to COD Only
```javascript
// frontend/src/app/checkout/page.tsx
const availablePaymentMethods = ['cod']; // Remove 'ndps'
```

### Revert to Previous Version
```bash
# Undo recent commits
git reset --hard HEAD~1

# Redeploy
pm2 restart all
```

## Ongoing Maintenance

### Weekly Tasks
- [ ] Check payment success rate
- [ ] Monitor failed payments
- [ ] Review server logs for errors
- [ ] Verify callbacks are being received

### Monthly Tasks
- [ ] Analyze payment trends
- [ ] Review transaction amounts
- [ ] Check for fraud patterns
- [ ] Backup database

### Quarterly Tasks
- [ ] Review NTT Data security updates
- [ ] Update encryption keys if needed
- [ ] Audit payment flow
- [ ] Performance optimization

## Contacts & Resources

**NTT Data Support**:
- Email: [your contact]
- Phone: [your contact]
- Documentation: Transaction API (Non-seamless)_V2.2 PDF

**Your Server Administrator**:
- SSH: ssh jyada@your.server.ip
- cPanel: https://your.server.ip:2083

**Database**:
- Host: localhost
- Database: [your_db_name]
- User: [your_db_user]

## Troubleshooting

### Payment Initiation Fails

**Check**:
1. Backend logs for encryption errors
2. NTT credentials in .env file
3. Network connectivity to NTT API
4. Database connection
5. Order exists in database

**Solution**:
```bash
# Test backend connectivity
curl -v https://caller.atomtech.in/ots/aipay/auth

# Check env variables loaded
node -e "console.log(process.env.NDPS_MERCH_ID)"

# Check logs
pm2 logs nursery-backend
```

### Callback Not Received

**Check**:
1. Return URL is publicly accessible
2. HTTPS is working
3. Firewall allows incoming requests
4. Database is writable
5. Logs show callback attempt

**Solution**:
```bash
# Verify endpoint is accessible
curl -I https://yourdomain.com/api/ndps/response

# Check iptables
sudo iptables -L | grep 443

# Monitor for incoming requests
tail -f /var/log/apache2/access.log | grep ndps
```

### Status API Returns Welcome Message

**This is expected in UAT**. The system handles it by:
1. Checking database first
2. Falling back gracefully
3. Returning cached status

In production, this should not happen. If it does:
1. Verify encryption is correct
2. Contact NTT Data support
3. Check API credentials
4. Review encrypted payload format

## Success Criteria for Production Go-Live

- [ ] All payment initiations succeed with valid data
- [ ] AtomPaynetz popup opens correctly
- [ ] At least 10 successful test payments completed
- [ ] Callbacks received and database updated for all payments
- [ ] Return page shows correct status for all test payments
- [ ] Requery returns accurate status
- [ ] Error handling works (404 for missing orders, etc.)
- [ ] SSL certificate valid and trusted
- [ ] All URLs using HTTPS
- [ ] Database backups configured
- [ ] Logging and monitoring in place
- [ ] Team trained on payment troubleshooting

---

**Last Updated**: 2026-07-02  
**System**: Nursery Management - NDPS Integration  
**Status**: Ready for Production Deployment
