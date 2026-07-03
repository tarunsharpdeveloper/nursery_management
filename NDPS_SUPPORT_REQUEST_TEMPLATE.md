# NTT DATA Support Request Template

## Subject: UAT Environment Issue - Empty Response from AUTH API

**To**: NTT DATA Payment Services Support  
**From**: Shri Sanviya Hi-Tech Nursery (Awantika Seeds)  
**Contact**: +91 80852 63020  
**Email**: manaspathak2107@gmail.com  

---

## Issue Description
We are experiencing issues with the NDPS UAT environment where the AUTH API is returning empty responses for payment token generation.

## Technical Details

### Request Configuration
- **API URL**: https://caller.atomtech.in/ots/aipay/auth
- **Merchant ID**: 446442
- **Product**: NSE
- **Request Method**: POST
- **Content-Type**: application/x-www-form-urlencoded

### Issue Symptoms
1. **HTTP Response**: 200 OK (Success)
2. **Content-Length**: 0 (Empty response body)
3. **Response Body**: Completely empty
4. **Expected**: Encrypted response with payment token

### Request Sample
```
Method: POST
URL: https://caller.atomtech.in/ots/aipay/auth
Headers: Content-Type: application/x-www-form-urlencoded
Body: merchId=446442&encData=[ENCRYPTED_DATA]&signature=[HMAC_SIGNATURE]
```

### Response Sample
```
Status: 200 OK
Headers: {
  'content-length': '0',
  'content-type': 'application/json'
}
Body: (empty)
```

## Troubleshooting Completed
1. ✅ Verified all merchant credentials
2. ✅ Tested multiple merchant IDs (317159, 317156, 317157, 8952, 446442)
3. ✅ Confirmed AES-128-ECB encryption implementation
4. ✅ Verified HMAC-SHA-512 signature generation
5. ✅ Tested with different request formats
6. ✅ All produce same result: empty response

## Business Impact
- Cannot process online payments for customers
- Currently using Cash on Delivery as workaround
- Affects customer experience and conversion rates

## Request for Assistance
1. **Immediate**: Please verify if merchant ID 446442 is active in UAT environment
2. **Alternative**: Provide working UAT credentials if current ones are inactive
3. **Escalation**: Consider providing production credentials for immediate deployment
4. **Timeline**: Our application is ready for production deployment

## Technical Contact
- **Developer**: Available for immediate testing once credentials are fixed
- **Implementation**: Complete and ready, only awaiting working gateway
- **Testing**: Can provide additional logs or debugging information if needed

## Urgency
**HIGH** - Production deployment blocked pending working payment gateway

---

Thank you for your prompt assistance.

**Shri Sanviya Hi-Tech Nursery Team**  
**Phone**: +91 80852 63020  
**Email**: manaspathak2107@gmail.com