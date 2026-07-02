# NDPS Payment Gateway UAT Support Request

**Date:** July 1, 2026  
**Project:** Nursery Management System  
**Website:** nursery.jyada.in  
**Contact Email:** manaspathak2107@gmail.com  
**Contact Phone:** +91 80852 63020

---

## Issue Summary

We are integrating NDPS Payment Gateway (NTT DATA Payment Services) into our e-commerce platform. The integration is complete and we are successfully submitting encrypted payment requests to your UAT gateway, but we are receiving blank pages instead of the payment form.

## Environment Details

**Environment:** UAT (Testing)  
**Gateway URL:** https://paynetzuat.atomtech.in/ots/aipay/auth  
**Request Method:** POST  
**HTTP Response:** 200 OK  
**Page Load Time:** 68ms  
**Issue:** Blank page with no content

## Merchant Credentials (UAT)

```
Merchant ID: 317159
Alternative IDs provided: 317156, 317157, 8952
Password: Test@123
Product: NSE / AIPAY
Platform: FLASH
API Version: OTSv1.1

Request Key (Encryption): A4476C2062FFA58980DC8F79EB6A799E
Response Key (Decryption): 75AEF0FA1B94B3C10D4F5B268F757F11
Request Hash Key: KEY123657234
Response Hash Key: KEYRESP123657234
```

## Sample Request

### Last Test Transaction Details:
```
Merchant Transaction ID: NURSERY_40_1782902391823
Transaction Date: 2026-07-01 15:53:11
Amount: ₹568.00
Currency: INR
Customer Email: test@example.com
Customer Mobile: 9876543210
Return URL: http://localhost:3000/payment/return
```

### JSON Payload (Before Encryption):
```json
{
  "payInstrument": {
    "headDetails": {
      "version": "OTSv1.1",
      "api": "AUTH",
      "platform": "FLASH"
    },
    "merchDetails": {
      "merchId": 317159,
      "userId": "",
      "password": "Test@123",
      "merchTxnId": "NURSERY_40_1782902391823",
      "merchTxnDate": "2026-07-01 15:53:11"
    },
    "payDetails": {
      "amount": "568",
      "product": "NSE",
      "custAccNo": "40",
      "txnCurrency": "INR"
    },
    "custDetails": {
      "custEmail": "test@example.com",
      "custMobile": "9876543210"
    },
    "extras": {
      "udf1": "order_40",
      "udf2": "nursery_payment",
      "udf3": "http://localhost:3000/payment/return",
      "udf4": "",
      "udf5": ""
    }
  }
}
```

### Encrypted Data Sent:
```
encdata: DA49FE7EF39306A0CB2AEFB3B3B8B73BEDB6296FBBA55E193DE4F5FB98CCE80F0B6C96C74427C06F4BE4BCB690B121AB8C74A56799F769C7CB52B84C3BB0E55CC0D94903A687AACB44FEED280988FE7D61F9B3BF143F173AB06A0E6BA7FD61531739F57CBDFC68FC9BC01EFCA5F636C8B10E493B18061BDA9D1F5C241BBEFA4A5FAB31A31029170EC9629149ABC38F59B533D569D4FA005AB15A79579DEFBC4E71C2C08B196DE5062FEF130AD7E94E0EFC34C6AACA0BFED2C634DBBE8F69C594260B0DC31B8BFB23A60C6FAD0DDAC07180EDF2C62B2F079CB4F299578E7BCFB39A2429790A34ABEE91B3EF97D7ED7D43DC5ACE1A144965ED70693A004A3A456DC9E55D7066E3DD2788E66F643D464465A56664C66561594F221981BD50758D704C16963FEE2FE82D4FC20A26A9F1772438F9829FB978FFB9102101BDE2BEA260F4ECEDB8121BE2ECD8ACD6E28A6B07F0CFA5986ECFE06C1C7AE58F9C65A04111FDD8C3C1F2B34B35A34343C102D49EDC773BF7489555EF9CD077F2CE59B8F7A6A6B1EBC5C608DE3B70699DEDE151EBA819BF9B6DB81A45584AB06CF1076AB5BEE3BE9238C9AE2BC1E3DAA6C01D8B4FD0ABC2D89C439DDC4256859DD7C472DC5BAD21440878628AEABE59168831BC7DF8E9FFE8577E52BFC8AEDF749BD87048A563080B55C5CBB63A00BF3A724E4456893FCE6BB85993012BB384EE3320DAC5D3

signature: 054FF90032F51B27019E395E2B42EBBF5671FE8BE23214C274C26528EF51A8C2
```

## Encryption Implementation

**Algorithm:** AES-128-ECB  
**Key Format:** Hex string converted to 16-byte buffer  
**Implementation:** Node.js v22.23.0, crypto.createCipheriv  
**Output Format:** Uppercase hex string

```javascript
// Key conversion
const keyBuffer = Buffer.from('A4476C2062FFA58980DC8F79EB6A799E', 'hex');

// Encryption
const cipher = crypto.createCipheriv('aes-128-ecb', keyBuffer, null);
let encrypted = cipher.update(jsonString, 'utf8', 'hex');
encrypted += cipher.final('hex');
return encrypted.toUpperCase();

// Signature
const signature = crypto.createHash('sha256')
  .update(encryptedData + 'KEY123657234')
  .digest('hex')
  .toUpperCase();
```

## Network Details

**Request:**
- URL: https://paynetzuat.atomtech.in/ots/aipay/auth
- Method: POST
- Content-Type: application/x-www-form-urlencoded
- Body Size: 1.2 KB

**Response:**
- Status: 200 OK
- Content: Empty/Blank page
- Transfer Size: 330 B
- Load Time: 68ms
- DOMContentLoaded: 106ms

## Questions for NDPS Support

1. **Is Merchant ID 317159 active in UAT environment?**
   - Can you verify this merchant is enabled for testing?
   - Should we use one of the alternative IDs (317156, 317157, 8952)?

2. **Is our encryption format correct?**
   - We're using AES-128-ECB with your Request Key as hex buffer
   - Can you decrypt our sample encrypted data to verify?
   - Is the JSON structure correct?

3. **Why are we receiving blank pages?**
   - Is there an error log on your side?
   - Is there a specific error message we should see?
   - Do we need to whitelist our return URL?

4. **Return URL Requirements:**
   - We're testing with: http://localhost:3000/payment/return
   - For production, will use: https://nursery.jyada.in/payment/return
   - Do these need to be whitelisted?

5. **What should the response contain?**
   - After payment, what parameters will be sent to our return URL?
   - Will the response be encrypted?
   - What status codes indicate success/failure?

6. **Can you provide:**
   - A working sample encryption (with your test data)
   - Server-side logs for our merchant transaction ID
   - Confirmation that credentials are correct and active
   - Any specific requirements we might be missing

## What We've Tried

✅ Verified JSON structure matches sample format  
✅ Tested with different encryption key formats  
✅ Confirmed 200 OK response from gateway  
✅ Checked browser console (no errors)  
✅ Tested with multiple transactions  
✅ Verified all required fields are present  
✅ Confirmed date format matches sample  
✅ Tested signature generation  

## Integration Status

**Backend:** ✅ Complete
- Payment encryption implemented
- Signature generation working
- Database integration done
- Callback handler ready
- Status checking endpoint ready

**Frontend:** ✅ Complete
- Checkout flow working
- Payment component ready
- Return page created
- Order creation successful

**Only Issue:** Blank page from NDPS UAT gateway

## Urgency

**Priority:** Medium  
**Timeline:** We need this working for production launch

For now, we're using alternative payment methods (COD, Bank Transfer), but online payment via NDPS is essential for our customers.

## Technical Contact

**Name:** Manas Pathak  
**Email:** manaspathak2107@gmail.com  
**Phone:** +91 80852 63020  
**Company:** Shri Sanviya Hi-Tech Nursery  
**Website:** https://nursery.jyada.in

## Additional Information

- Server: Node.js v22.23.0
- npm: v10.9.8
- Database: MySQL
- Frontend: Next.js
- Hosting: cPanel (Linux)

## Expected Resolution

Please help us identify why we're receiving blank pages instead of the payment form. We need:
1. Confirmation of UAT access for merchant ID 317159
2. Verification of our encryption implementation
3. Working test credentials if current ones are incorrect
4. Any additional requirements or whitelisting needed

Thank you for your assistance!

---

**Document Version:** 1.0  
**Created:** July 1, 2026  
**Last Test:** July 1, 2026 15:53 IST
