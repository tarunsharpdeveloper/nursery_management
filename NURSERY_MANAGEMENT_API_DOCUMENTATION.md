# Nursery Management System - Complete API Documentation

## System Architecture Overview

```
Frontend (Next.js)    Backend (Node.js)    Database (MySQL)    External APIs
     Port 3000    ←→     Port 4000      ←→      MySQL       ←→   NTT DATA
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Styling**: CSS + Bootstrap
- **State Management**: React Context API
- **HTTP Client**: Fetch API

### Backend
- **Framework**: Node.js with Express-like routing
- **Language**: JavaScript
- **Database**: MySQL with mysql2
- **Authentication**: JWT Tokens
- **Payment Gateway**: NTT DATA Payment Services (NDPS)
- **Email**: Nodemailer

### Database
- **Type**: MySQL
- **ORM**: Native SQL queries with mysql2
- **Connection Pool**: Configured connection pooling

---

## 1. PRODUCT MANAGEMENT FLOW

### 1.1 Product Listing API

**Endpoint**: `GET /api/products`
**File**: `backend/routes/products.js`

**Flow**:
```
User visits /products page
    ↓
Frontend calls GET /api/products
    ↓
Backend queries: SELECT * FROM products WHERE is_active = 1
    ↓
Returns: Array of products with variants
    ↓
Frontend displays product grid
```

**Response Structure**:
```json
[
  {
    "id": 1,
    "name": "Rose Plant",
    "category": "Plants",
    "selling_price": 250.00,
    "actual_price": 300.00,
    "photo_url": "rose.jpg",
    "available_quantity": 50,
    "variants": [
      {
        "id": 1,
        "variant_type": "Color",
        "variant_value": "Red",
        "price_adjustment": 0
      }
    ]
  }
]
```

### 1.2 Product Details API

**Endpoint**: `GET /api/products/:id`
**File**: `backend/routes/products.js`

**Flow**:
```
User clicks product
    ↓
Navigate to /products/[id]
    ↓
Frontend calls GET /api/products/123
    ↓
Backend queries product + variants + reviews
    ↓
Returns detailed product info
    ↓
Frontend displays product page with add to cart
```

---

## 2. CART MANAGEMENT FLOW

### 2.1 Cart Context (Frontend Only)

**File**: `frontend/src/context/CartContext.tsx`

**Operations**:
- `addToCart(product, quantity)` - Add item to localStorage
- `removeFromCart(cartKey)` - Remove item from localStorage
- `updateQuantity(cartKey, qty)` - Update item quantity
- `clearCart()` - Empty entire cart

**Calculations**:
```javascript
subtotal = sum of (price × quantity) for all items
shipping = 0 (FREE DELIVERY)
total = subtotal (no delivery charges)
```

---

## 3. ORDER CREATION FLOW

### 3.1 Order Placement API

**Endpoint**: `POST /api/orders`
**File**: `backend/routes/orders.js`

**Request Body**:
```json
{
  "customer": {
    "name": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "address": "123 Street, City - 500001"
  },
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 250.00
    }
  ]
}
```

**Flow**:
```
User fills checkout form
    ↓
Frontend validates data
    ↓
POST /api/orders with customer + items
    ↓
Backend creates/finds customer record
    ↓
Backend creates order record
    ↓
Backend creates order_items records
    ↓
Returns order ID + order number
    ↓
Frontend proceeds to payment selection
```

**Database Operations**:
```sql
-- 1. Create/find customer
INSERT INTO customers (name, email, phone, address) 
VALUES (...) ON DUPLICATE KEY UPDATE ...

-- 2. Create order
INSERT INTO orders (order_number, customer_id, total_amount, payment_status)
VALUES (...)

-- 3. Create order items
INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, total_price)
VALUES (...)
```

---

## 4. PAYMENT FLOW (NDPS Integration)

### 4.1 Payment Initiation API

**Endpoint**: `POST /api/ndps/initiate`
**File**: `backend/routes/ndps-payments.js`

**Request Body**:
```json
{
  "orderId": 70,
  "amount": 270.00,
  "customerEmail": "customer@example.com",
  "customerMobile": "9876543210"
}
```

**Technical Flow**:
```
Frontend calls POST /api/ndps/initiate
    ↓
Backend validates order exists
    ↓
Backend creates payment JSON payload:
{
  "payInstrument": {
    "headDetails": {"version": "OTSv1.1", "api": "AUTH", "platform": "FLASH"},
    "merchDetails": {"merchId": 446442, "password": "Test@123", ...},
    "payDetails": {"amount": "270.00", "product": "NSE", ...},
    "custDetails": {"custEmail": "...", "custMobile": "..."},
    "extras": {"udf1": "order_70", ...}
  }
}
    ↓
Backend encrypts payload using AES-256-CBC with PBKDF2:
- Key: A4476C2062FFA58980DC8F79EB6A799E (hex to UTF-8)
- Salt: Same as key
- Iterations: 65536
- Hash: SHA-512
- IV: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]
    ↓
Backend sends to NTT AUTH API:
POST https://caller.atomtech.in/ots/aipay/auth
Content-Type: application/x-www-form-urlencoded
Body: encData=[encrypted]&merchId=446442
    ↓
NTT responds: merchId=446442&encData=[encrypted_response]
    ↓
Backend decrypts response using same method
    ↓
Backend extracts atomTokenId from response
    ↓
Backend saves payment record with 'pending' status
    ↓
Backend returns atomTokenId to frontend
```

**Response**:
```json
{
  "success": true,
  "paymentId": 123,
  "atomTokenId": "15000000953140",
  "merchId": "446442",
  "merchTxnId": "NURSERY_70_xxx",
  "customerEmail": "customer@example.com",
  "customerMobile": "9876543210",
  "returnUrl": "http://localhost:3000/payment/return",
  "env": "uat"
}
```

### 4.2 Payment Popup (Frontend)

**File**: `frontend/src/components/NDPSPayment.tsx`

**Flow**:
```
Frontend receives atomTokenId
    ↓
Frontend loads AtomPaynetz script:
<script src="https://pgtest.atomtech.in/staticdata/ots/js/atomcheckout.js?v=timestamp">
    ↓
Frontend creates AtomPaynetz instance:
new AtomPaynetz({
  atomTokenId: "15000000953140",
  merchId: "446442",
  custEmail: "customer@example.com",
  custMobile: "9876543210", 
  returnUrl: "http://localhost:3000/payment/return"
}, 'uat')
    ↓
NTT payment popup opens
    ↓
User completes payment
    ↓
User redirected to returnUrl
```

### 4.3 Payment Callback API

**Endpoint**: `POST /api/ndps/response`
**File**: `backend/routes/ndps-payments.js`

**Flow**:
```
NTT sends encrypted callback to backend
    ↓
Backend receives: {encData: "encrypted_response"}
    ↓
Backend decrypts using AES-256-CBC with response key
    ↓
Decrypted format:
{
  "payInstrument": [{
    "merchDetails": {"merchId": 446442, "merchTxnId": "NURSERY_70_xxx"},
    "payDetails": {"atomTxnId": 11000000631738, "totalAmount": 270.00},
    "responseDetails": {"statusCode": "OTS0000", "message": "SUCCESS"},
    "payModeSpecificData": {"subChannel": "NB", "bankDetails": {...}}
  }]
}
    ↓
Backend extracts transaction details
    ↓
Backend updates payment status:
- OTS0000 = 'paid'
- Other codes = 'failed'
    ↓
Backend updates order payment_status
    ↓
Backend responds to NTT with confirmation
```

### 4.4 Payment Return Page

**File**: `frontend/src/app/payment/return/page.tsx`

**Flow**:
```
User redirected from NTT popup
    ↓
Frontend gets merchTxnId from localStorage
    ↓
Frontend waits 2 seconds for callback processing
    ↓
Frontend calls GET /api/ndps/status/[paymentId]
    ↓
If status still pending, calls POST /api/ndps/requery
    ↓
Frontend displays success/failed/pending message
    ↓
LocalStorage cleared
```

### 4.5 Status Requery API

**Endpoint**: `POST /api/ndps/requery`
**File**: `backend/routes/ndps-payments.js`

**Flow**:
```
Frontend needs to check payment status
    ↓
Backend creates STATUS query payload (same encryption)
    ↓
Backend calls NTT STATUS API
    ↓
Backend decrypts response
    ↓
Backend updates database with latest status
    ↓
Returns current transaction status
```

---

## 5. CUSTOMER REVIEW SYSTEM

### 5.1 Get Reviews API

**Endpoint**: `GET /api/reviews/:productId`
**File**: `backend/routes/reviews.js`

**Flow**:
```
Product page loads
    ↓
Frontend calls GET /api/reviews/123
    ↓
Backend queries: SELECT * FROM reviews WHERE product_id = 123 AND is_approved = 1
    ↓
Returns array of approved reviews with ratings
```

### 5.2 Submit Review API

**Endpoint**: `POST /api/reviews`
**File**: `backend/routes/reviews.js`

**Request Body**:
```json
{
  "productId": 123,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "rating": 5,
  "reviewText": "Great product!"
}
```

**Flow**:
```
Customer submits review form
    ↓
Backend validates input
    ↓
Backend inserts review with is_approved = 0
    ↓
Review requires admin approval before showing
```

---

## 6. AUTHENTICATION SYSTEM

### 6.1 Customer Login/Registration

**Endpoint**: `POST /api/auth/customer/login`
**File**: `backend/routes/auth.js`

**Flow**:
```
Customer enters email + phone
    ↓
Backend checks if customer exists
    ↓
If not exists: creates new customer record
    ↓
Backend generates JWT token
    ↓
Returns token + customer data
    ↓
Frontend stores in localStorage
```

### 6.2 Admin Authentication

**Endpoint**: `POST /api/auth/admin/login`
**File**: `backend/routes/auth.js`

**Flow**:
```
Admin enters email + password
    ↓
Backend validates credentials
    ↓
Backend checks admin permissions
    ↓
Returns JWT token + admin data with permissions
```

---

## 7. ADMIN MANAGEMENT APIS

### 7.1 Admin Dashboard Data

**Endpoint**: `GET /api/admin/dashboard`
**File**: `backend/routes/admin-data.js`

**Returns**:
```json
{
  "totalProducts": 150,
  "totalOrders": 45,
  "totalCustomers": 120,
  "totalRevenue": 125000,
  "recentOrders": [...],
  "topProducts": [...],
  "monthlyStats": [...]
}
```

### 7.2 Order Management

**Endpoints**:
- `GET /api/admin/orders` - List all orders
- `PUT /api/admin/orders/:id` - Update order status
- `GET /api/admin/orders/:id` - Get order details

### 7.3 Product Management

**Endpoints**:
- `GET /api/admin/products` - List all products
- `POST /api/admin/products` - Create new product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product

---

## 8. DATABASE SCHEMA

### 8.1 Core Tables

```sql
-- Products
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  selling_price DECIMAL(10,2),
  actual_price DECIMAL(10,2),
  photo_url VARCHAR(500),
  available_quantity INT DEFAULT 0,
  is_active BOOLEAN DEFAULT 1
);

-- Customers
CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE,
  customer_id INT,
  total_amount DECIMAL(10,2),
  payment_status ENUM('pending','paid','failed') DEFAULT 'pending',
  order_status ENUM('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT,
  payment_gateway VARCHAR(50),
  payment_method VARCHAR(50),
  payment_status ENUM('pending','paid','failed') DEFAULT 'pending',
  amount DECIMAL(10,2),
  gateway_payment_id VARCHAR(255),
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  is_approved BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9. ERROR HANDLING

### 9.1 Standard Error Response Format

```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "code": "ERROR_CODE"
}
```

### 9.2 HTTP Status Codes Used

- **200**: Success
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (login required)
- **403**: Forbidden (permission denied)
- **404**: Not Found (resource doesn't exist)
- **500**: Internal Server Error

---

## 10. ENVIRONMENT CONFIGURATION

### 10.1 Backend (.env)

```bash
# Database
MYSQL_HOST=localhost
MYSQL_DATABASE=nursery_management
MYSQL_USER=root
MYSQL_PASSWORD=

# Server
BACKEND_PORT=4000
CORS_ORIGIN=*
AUTH_SECRET=change-this-long-random-string

# NDPS Payment Gateway
NDPS_MERCH_ID=446442
NDPS_PASSWORD=Test@123
NDPS_PRODUCT_ID=NSE
NDPS_API_URL=https://caller.atomtech.in/ots/aipay/auth
NDPS_REQUEST_KEY=A4476C2062FFA58980DC8F79EB6A799E
NDPS_RESPONSE_KEY=75AEF0FA1B94B3C10D4F5B268F757F11
NDPS_REQUEST_HASH_KEY=KEY123657234
NDPS_RESPONSE_HASH_KEY=KEYRESP123657234

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=manaspathak2107@gmail.com
EMAIL_PASSWORD=ncxg jbcc qtff pqpy
```

### 10.2 Frontend (.env.local)

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

---

## 11. DEPLOYMENT ARCHITECTURE

```
Production Setup:
- Frontend: nursery.jyada.in (Static files)
- Backend: nursery.jyada.in/api (Node.js)
- Database: MySQL on cPanel hosting
- Payment Gateway: NTT DATA Production URLs

Development Setup:
- Frontend: localhost:3000
- Backend: localhost:4000  
- Database: Local MySQL
- Payment Gateway: NTT DATA UAT URLs
```

---

## 12. API TESTING

### 12.1 Test Scripts Available

- `debug_ndps_request.js` - Test NDPS payment initiation
- `test_exact_working_format.html` - Test payment popup
- `test_atom_with_token.html` - Test AtomPaynetz integration

### 12.2 Testing Flow

1. **Unit Testing**: Individual API endpoints
2. **Integration Testing**: Complete payment flow
3. **UAT Testing**: End-to-end user scenarios
4. **Production Testing**: Final verification with real data

---

This documentation covers the complete technical flow of the Nursery Management System from frontend user interactions to backend processing, database operations, and external API integrations.