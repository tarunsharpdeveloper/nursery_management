const { loadEnv } = require("./env");
loadEnv();
const http = require("http");
const { readJson, readFormData, sendJson, sendNoContent, sendError, notFound } = require("./http");
const { initEmailService } = require("./email");
const { listProducts, getProduct, createProduct, editProduct, toggleProduct, deleteProduct } = require("./routes/products");
const { createOrder, listCustomerOrders } = require("./routes/orders");
const { createProduction } = require("./routes/production");
const { createBill } = require("./routes/billing");
const { createAdvanceBooking } = require("./routes/bookings");
const { createDispatch } = require("./routes/dispatch");
const { initiatePayment, paymentWebhook } = require("./routes/payments");
const { createEmployee, saveAttendance, saveBulkAttendance, editEmployee, toggleEmployee, deleteEmployee } = require("./routes/attendance");
const { calculateWages } = require("./routes/wages");
const { getLedger, getCustomerLedgerDetails, getReport } = require("./routes/reports");
const { getReviews, submitReview, getReviewStats } = require("./routes/reviews");
const { getFavorites, toggleFavorite } = require("./routes/favorites");
const { initiateNDPSPayment, handleNDPSResponse, checkPaymentStatus, requeryTransactionStatus, handleNDPSPopupResponse } = require("./routes/ndps-payments");
const { ensureAdminSchema } = require("./migrate");
const { authenticate, hasPermission } = require("./auth");
const { login, me, registerCustomer, updateProfile, updatePassword, forgotPassword, resetPassword, verifyResetToken, autoCreateAccount, autoCreateAccountWithPhone, checkEmailExists } = require("./routes/auth");
const {
  getDashboard,
  listCustomers,
  listCategories,
  createCategory,
  editCategory,
  toggleCategory,
  deleteCategory,
  listInventory,
  listOrders,
  getOrder,
  updateOrderStatus,
  deleteOrder,
  listPayments,
  listBills,
  getBill,
  deleteBill,
  listBookings,
  updateBookingStatus,
  listDispatches,
  updateDispatchStatus,
  listEmployees,
  listAttendance,
  listWageSummary,
  getUnifiedList,
  listMonthlyAttendance,
  getEmployeeAttendance
} = require("./routes/admin-data");

const { listUsers, createUser, editUser, toggleUser, deleteUser } = require("./routes/users");
const { listRoles, createRole, editRole, deleteRole } = require("./routes/roles");
const { uploadFiles } = require("./routes/upload");

const helpers = { readJson, readFormData, sendJson };

const routes = [
  ["GET", "/api/health", null, (_req, res) => sendJson(res, 200, { status: "ok", service: "nursery-node-backend" })],
  ["POST", "/api/auth/login", null, login],
  ["POST", "/api/auth/register-customer", null, registerCustomer],
  ["POST", "/api/auth/auto-create-account", null, autoCreateAccount],
  ["POST", "/api/auth/auto-create-account-phone", null, autoCreateAccountWithPhone],
  ["POST", "/api/auth/check-email", null, checkEmailExists],
  ["POST", "/api/auth/forgot-password", null, forgotPassword],
  ["POST", "/api/auth/reset-password", null, resetPassword],
  ["POST", "/api/auth/verify-reset-token", null, verifyResetToken],
  ["GET", "/api/auth/me", null, me],
  ["PATCH", "/api/auth/profile", null, updateProfile],
  ["PATCH", "/api/auth/password", null, updatePassword],
  ["PATCH", "/api/auth/update-password", null, updatePassword],
  ["GET", "/api/dashboard", "dashboard:read", getDashboard],
  ["GET", "/api/users", "users:read", listUsers],
  ["POST", "/api/users", "users:write", createUser],
  ["PATCH", "/api/users", "users:write", editUser],
  ["PATCH", "/api/users/toggle", "users:write", toggleUser],
  ["POST", "/api/users/delete", "users:write", deleteUser],
  ["GET", "/api/roles", "roles:read", listRoles],
  ["POST", "/api/roles", "roles:write", createRole],
  ["PATCH", "/api/roles", "roles:write", editRole],
  ["POST", "/api/roles/delete", "roles:write", deleteRole],
  ["GET", "/api/customers", "billing:read", listCustomers],
  ["GET", "/api/categories", null, listCategories],
  ["POST", "/api/categories", "products:write", createCategory],
  ["PATCH", "/api/categories", "products:write", editCategory],
  ["PATCH", "/api/categories/toggle", "products:write", toggleCategory],
  ["POST", "/api/categories/delete", "products:write", deleteCategory],
  ["GET", "/api/products", null, listProducts],
  ["POST", "/api/products/get", "products:read", getProduct],
  ["POST", "/api/products", "products:write", createProduct],
  ["PATCH", "/api/products", "products:write", editProduct],
  ["PATCH", "/api/products/toggle", "products:write", toggleProduct],
  ["POST", "/api/products/delete", "products:write", deleteProduct],
  ["GET", "/api/inventory", "inventory:read", listInventory],
  ["GET", "/api/orders", "orders:read", listOrders],
  ["POST", "/api/orders/get", null, getOrder],
  ["POST", "/api/orders/delete", "orders:write", deleteOrder],
  ["POST", "/api/orders", null, createOrder],
  ["GET", "/api/customer-orders", null, listCustomerOrders],
  ["PATCH", "/api/orders/status", "orders:write", updateOrderStatus],
  ["POST", "/api/production", "production:write", createProduction],
  ["GET", "/api/payments", "payments:read", listPayments],
  ["POST", "/api/billing", "billing:write", createBill],
  ["GET", "/api/bills", "billing:read", listBills],
  ["POST", "/api/bills/get", "billing:read", getBill],
  ["POST", "/api/bills/delete", "billing:write", deleteBill],
  ["GET", "/api/advance-bookings", "bookings:read", listBookings],
  ["POST", "/api/advance-bookings", "bookings:write", createAdvanceBooking],
  ["PATCH", "/api/advance-bookings/status", "bookings:write", updateBookingStatus],
  ["GET", "/api/dispatch", "dispatch:read", listDispatches],
  ["POST", "/api/dispatch", "dispatch:write", createDispatch],
  ["PATCH", "/api/dispatch/status", "dispatch:write", updateDispatchStatus],
  ["POST", "/api/payments/initiate", "payments:write", initiatePayment],
  ["POST", "/api/payments/webhook", null, paymentWebhook],
  ["GET", "/api/employees", "employees:read", listEmployees],
  ["POST", "/api/employees", "employees:write", createEmployee],
  ["PATCH", "/api/employees", "employees:write", editEmployee],
  ["PATCH", "/api/employees/toggle", "employees:write", toggleEmployee],
  ["POST", "/api/employees/delete", "employees:write", deleteEmployee],
  ["GET", "/api/attendance", "attendance:read", listAttendance],
  ["GET", "/api/attendance/monthly", "attendance:read", listMonthlyAttendance],
  ["GET", "/api/attendance/employee", "attendance:read", getEmployeeAttendance],
  ["POST", "/api/attendance", "attendance:write", saveAttendance],
  ["POST", "/api/attendance/bulk", "attendance:write", saveBulkAttendance],
  ["GET", "/api/wages/summary", "wages:read", listWageSummary],
  ["POST", "/api/wages/calculate", "wages:read", calculateWages],
  ["GET", "/api/customer-ledger", "ledger:read", getLedger],
  ["GET", "/api/customer-ledger/details", "ledger:read", getCustomerLedgerDetails],
  ["GET", "/api/reports", "reports:read", getReport],
  ["GET", "/api/reviews/:productId", null, getReviews],
  ["POST", "/api/reviews", null, submitReview],
  ["GET", "/api/reviews/stats/:productId", null, getReviewStats],
  ["GET", "/api/favorites", null, getFavorites],
  ["POST", "/api/favorites/toggle", null, toggleFavorite],
  ["POST", "/api/ndps/initiate", null, initiateNDPSPayment],
  ["POST", "/api/ndps/response", null, handleNDPSResponse],
  ["POST", "/Response", null, handleNDPSPopupResponse],
  ["GET", "/api/ndps/status/:paymentId", null, checkPaymentStatus],
  ["POST", "/api/ndps/requery", null, requeryTransactionStatus],
  ["GET", "/api/admin/data-list", null, getUnifiedList],
  ["POST", "/api/upload", null, uploadFiles]
];

// Route matcher that handles path parameters
function matchRoute(method, pathname, routeMethod, routePath) {
  if (method !== routeMethod) return false;
  
  // Exact match
  if (pathname === routePath) return true;
  
  // Check for path parameters
  const routeParts = routePath.split('/');
  const pathParts = pathname.split('/');
  
  if (routeParts.length !== pathParts.length) return false;
  
  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(':')) {
      // This is a parameter, skip comparison
      continue;
    }
    if (routeParts[i] !== pathParts[i]) {
      return false;
    }
  }
  
  return true;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendNoContent(res);
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname.startsWith("/uploads/")) {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(__dirname, url.pathname);
    
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        notFound(res);
        return;
      }
      
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm'
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      res.writeHead(200, {
        "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
        "Content-Type": contentType
      });
      fs.createReadStream(filePath).pipe(res);
    });
    return;
  }

  const match = routes.find(([method, path]) => matchRoute(req.method, url.pathname, method, path));

  if (!match) {
    notFound(res);
    return;
  }

  try {
    const [, , permission, handler] = match;
    if (permission) {
      const user = authenticate(req);
      if (!user) {
        sendJson(res, 401, { message: "Login required" });
        return;
      }
      if (!(await hasPermission(user, permission))) {
        sendJson(res, 403, { message: "Permission denied" });
        return;
      }
      req.user = user;
    }
    await handler(req, res, helpers);
  } catch (error) {
    sendError(res, error);
  }
});

const port = Number(process.env.BACKEND_PORT || 4000);

// Initialize email service
initEmailService();

ensureAdminSchema()
  .then(() => {
    server.listen(port, () => {
      console.log(`Node backend running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Database migration failed:", error.message);
    process.exit(1);
  });
