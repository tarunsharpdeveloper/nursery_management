/**
 * Product CRUD Operations Test
 * 
 * This script tests all product operations to diagnose why products
 * aren't being edited, added, or updated in the admin panel.
 */

const http = require('http');

// Configuration for local development
const BACKEND_URL = 'localhost:4000';

console.log('🧪 Testing Product CRUD Operations...\n');
console.log(`🔗 Backend: http://${BACKEND_URL}\n`);

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = responseData ? JSON.parse(responseData) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: result
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testBackendConnection() {
  console.log('1️⃣  Testing backend connection...');
  try {
    const response = await makeRequest('/api/products');
    console.log(`   ✅ Backend is running: Status ${response.statusCode}`);
    console.log(`   📊 Response: ${Array.isArray(response.data) ? `${response.data.length} products` : 'Non-array response'}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Backend connection failed: ${error.message}`);
    return false;
  }
}

async function testListProducts() {
  console.log('\n2️⃣  Testing GET /api/products...');
  try {
    const response = await makeRequest('/api/products');
    console.log(`   📊 Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const products = response.data;
      if (Array.isArray(products)) {
        console.log(`   ✅ Products loaded: ${products.length} products`);
        if (products.length > 0) {
          console.log(`   📦 Sample product: ${products[0].name} (ID: ${products[0].id})`);
          return products[0]; // Return first product for edit test
        }
      } else {
        console.log(`   ⚠️  Unexpected response format:`, products);
      }
    } else {
      console.log(`   ❌ Failed: Status ${response.statusCode}`);
      console.log(`   📝 Response:`, response.data);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  return null;
}

async function testGetCategories() {
  console.log('\n3️⃣  Testing GET /api/categories...');
  try {
    const response = await makeRequest('/api/categories');
    console.log(`   📊 Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const categories = response.data;
      if (Array.isArray(categories)) {
        console.log(`   ✅ Categories loaded: ${categories.length} categories`);
        if (categories.length > 0) {
          console.log(`   📁 Sample category: ${categories[0].name} (ID: ${categories[0].id})`);
          return categories[0]; // Return first category for create test
        }
      } else {
        console.log(`   ⚠️  Unexpected response format:`, categories);
      }
    } else {
      console.log(`   ❌ Failed: Status ${response.statusCode}`);
      console.log(`   📝 Response:`, response.data);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  return null;
}

async function testCreateProduct(category) {
  if (!category) {
    console.log('\n4️⃣  Skipping product creation - no category available');
    return null;
  }

  console.log('\n4️⃣  Testing POST /api/products (Create Product)...');
  
  const testProduct = {
    categoryId: category.id,
    name: `Test Product ${Date.now()}`,
    description: "Test product created by diagnostic script",
    sellingPrice: 100,
    actualPrice: 80,
    availableQuantity: 10,
    unit: "Piece",
    mediaUrls: JSON.stringify(["test-image.jpg"]),
    variants: []
  };

  try {
    const response = await makeRequest('/api/products', 'POST', testProduct);
    console.log(`   📊 Status: ${response.statusCode}`);
    
    if (response.statusCode === 201) {
      console.log(`   ✅ Product created successfully!`);
      console.log(`   📦 Product ID: ${response.data.productId}`);
      return response.data.productId;
    } else {
      console.log(`   ❌ Failed: Status ${response.statusCode}`);
      console.log(`   📝 Response:`, response.data);
      
      // Check for specific error patterns
      if (response.data && response.data.message) {
        console.log(`   💡 Error analysis:`);
        if (response.data.message.includes('validation')) {
          console.log(`      - Validation error - check required fields`);
        }
        if (response.data.message.includes('category')) {
          console.log(`      - Category issue - check category exists and is active`);
        }
        if (response.data.message.includes('permission')) {
          console.log(`      - Permission issue - check authentication`);
        }
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  return null;
}

async function testEditProduct(productId) {
  if (!productId) {
    console.log('\n5️⃣  Skipping product edit - no product ID available');
    return;
  }

  console.log('\n5️⃣  Testing PATCH /api/products (Edit Product)...');
  
  const editData = {
    productId: productId,
    categoryId: 1, // Assuming category 1 exists
    name: `Edited Test Product ${Date.now()}`,
    description: "Updated by diagnostic script",
    sellingPrice: 150,
    actualPrice: 120,
    availableQuantity: 15,
    unit: "Piece",
    mediaUrls: JSON.stringify(["edited-image.jpg"]),
    variants: []
  };

  try {
    const response = await makeRequest('/api/products', 'PATCH', editData);
    console.log(`   📊 Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log(`   ✅ Product edited successfully!`);
      console.log(`   📝 Response:`, response.data);
    } else {
      console.log(`   ❌ Failed: Status ${response.statusCode}`);
      console.log(`   📝 Response:`, response.data);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

async function testToggleProduct(productId) {
  if (!productId) {
    console.log('\n6️⃣  Skipping product toggle - no product ID available');
    return;
  }

  console.log('\n6️⃣  Testing PATCH /api/products/toggle (Toggle Product)...');
  
  const toggleData = {
    productId: productId,
    isActive: false // Disable the product
  };

  try {
    const response = await makeRequest('/api/products/toggle', 'PATCH', toggleData);
    console.log(`   📊 Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log(`   ✅ Product toggled successfully!`);
      console.log(`   📝 Response:`, response.data);
    } else {
      console.log(`   ❌ Failed: Status ${response.statusCode}`);
      console.log(`   📝 Response:`, response.data);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Main test execution
async function runAllTests() {
  console.log('🎯 GOAL: Diagnose why products cannot be added, edited, or updated\n');

  // Test 1: Backend connection
  const isConnected = await testBackendConnection();
  if (!isConnected) {
    console.log('\n❌ DIAGNOSIS: Backend is not running on localhost:4000');
    console.log('💡 SOLUTION: Start the backend server with: npm start or node app.js');
    return;
  }

  // Test 2: List products
  const sampleProduct = await testListProducts();

  // Test 3: Get categories
  const sampleCategory = await testGetCategories();

  // Test 4: Create product
  const newProductId = await testCreateProduct(sampleCategory);

  // Test 5: Edit product (use either new product or existing one)
  const productToEdit = newProductId || (sampleProduct ? sampleProduct.id : null);
  await testEditProduct(productToEdit);

  // Test 6: Toggle product
  await testToggleProduct(productToEdit);

  // Final summary
  console.log('\n' + '='.repeat(70));
  console.log('📋 DIAGNOSIS SUMMARY');
  console.log('='.repeat(70));
  
  console.log('\n🔍 COMMON ISSUES TO CHECK:');
  console.log('  1. Backend server not running on localhost:4000');
  console.log('  2. CORS issues preventing frontend from reaching backend');
  console.log('  3. Authentication/permission issues');
  console.log('  4. Database connection problems');
  console.log('  5. Missing or invalid category data');
  console.log('  6. Frontend API URL misconfiguration');
  
  console.log('\n💡 NEXT STEPS:');
  console.log('  1. Ensure backend is running: cd backend && npm start');
  console.log('  2. Check frontend .env file for correct API URL');
  console.log('  3. Check browser console for JavaScript errors');
  console.log('  4. Verify admin authentication if using protected routes');
  
  console.log('\n' + '='.repeat(70));
}

// Run the diagnostic
runAllTests().catch(console.error);