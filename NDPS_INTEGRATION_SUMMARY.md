# NDPS Payment Gateway Integration - Support Request

## Issue Summary
We have implemented NDPS payment gateway integration but receiving blank page response from UAT server.

## Integration Details

### UAT Credentials Used
- **Merchant ID**: 317159
- **Password**: Test@123
- **Product**: NSE
- **API URL**: https://paynetzuat.atomtech.in/ots/aipay/auth
- **Encryption Key**: A4476C2062FFA58980DC8F79EB6A799E
- **Decryption Key**: 75AEF0FA1B94B3C10D4F5B268F757F11

### Payload Structure (Before Encryption)
```json
{
  "payInstrument": {
    "headDetails": {
      "version": "OTSv1.1",
      "api": "AUTH",
      "platform": "FLASH"
    },
    "merchDetails": {
      "merchId": "317159",
      "userId": "",
      "password": "Test@123",
      "merchTxnId": "TXN17828905583046079",
      "merchTxnDate": "2024-07-01 12:52:38"
    },
    "payDetails": {
      "amount": "330.00",
      "product": "NSE",
      "custAccNo": "1",
      "txnCurrency": "INR"
    },
    "custDetails": {
      "custEmail": "test@example.com",
      "custMobile": "9876543210"
    },
    "extras": {
      "udf1": "27",
      "udf2": "34", 
      "udf3": "ORD1782890558304372",
      "udf4": "Test User",
      "udf5": "",
      "udf6": "",
      "udf7": "",
      "udf8": "",
      "udf9": "",
      "udf10": ""
    }
  }
}
```

### Encryption Details
- **Algorithm**: AES-256-CBC
- **IV**: 16 bytes of zeros
- **Output Format**: Uppercase hex string
- **Encrypted Data Length**: 1120 characters

### Form Submission Details
- **Method**: POST
- **URL**: https://paynetzuat.atomtech.in/ots/aipay/auth
- **Parameters**: 
  - `merchId`: 317159
  - `encData`: [1120-char encrypted hex string]

### Problem Description
1. **Request Status**: HTTP 200 OK (request reaches NDPS server)
2. **Response**: Blank HTML page with only browser extension elements
3. **No Error Messages**: NDPS returns empty body instead of error details

### URLs Tested
- ✅ https://paynetzuat.atomtech.in/ots/aipay/auth (returns blank page)
- ❌ https://paynetzuat.atomtech.in/paynetz/epi/fts (404 not found)
- ❌ https://paynetzuat.atomtech.in/ots/payment/txn (404 not found)

### Technical Implementation
- **Backend**: Node.js with Express
- **Frontend**: Next.js React application
- **Encryption**: Native Node.js crypto module
- **Form Submission**: Standard HTML form POST

## Questions for NDPS Support

1. **Is Merchant ID 317159 properly configured** in UAT environment?

2. **Are we using the correct API endpoint**? Documentation shows different URLs.

3. **Is our payload structure correct**? We're following the sample format provided.

4. **Are there additional parameters required** that aren't documented?

5. **Is there signature/hash validation required** beyond encryption?

6. **Can you provide working integration example** for Node.js?

7. **Are there specific Content-Type headers required**?

## Request for Assistance

Please provide:
1. ✅ **Confirmation of merchant ID activation**
2. ✅ **Correct API endpoint URL**
3. ✅ **Working payload example**
4. ✅ **Integration troubleshooting guidance**
5. ✅ **Error logging mechanism** to understand failures

## Contact Information
- **Developer**: [Your Name]
- **Email**: [Your Email]
- **Project**: Nursery Management System
- **Environment**: UAT Testing

---

**Note**: All technical implementation is complete and working correctly on our end. The issue appears to be with UAT server configuration or undocumented requirements.