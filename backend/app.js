const { loadEnv } = require("./env");
loadEnv();
const http = require("http");
const { readJson, sendJson, sendNoContent, sendError, notFound } = require("./http");
const { listProducts, getProduct, createProduct, editProduct, toggleProduct, deleteProduct } = require("./routes/products");
const { createOrder, listCustomerOrders } = require("./routes/orders");
const { createProduction } = require("./routes/production");
const { createBill } = require("./routes/billing");
const { createAdvanceBooking } = require("./routes/bookings");
const { createDispatch } = require("./routes/dispatch");
const { initiatePayment, paymentWebhook } = require("./routes/payments");
const { createEmployee, saveAttendance } = require("./routes/attendance");
const { calculateWages } = require("./routes/wages");
const { getLedger, getReport } = require("./routes/reports");
const { ensureAdminSchema } = require("./migrate");
const { authenticate, hasPermission } = require("./auth");
const { login, me } = require("./routes/auth");
const {
  getDashboard,
  listCategories,
  createCategory,
  editCategory,
  toggleCategory,
  deleteCategory,
  listInventory,
  listOrders,
  updateOrderStatus,
  listPayments,
  listBills,
  listBookings,
  updateBookingStatus,
  listDispatches,
  listEmployees,
  listAttendance,
  listWageSummary
} = require("./routes/admin-data");

const helpers = { readJson, sendJson };

const routes = [
  ["GET", "/api/health", null, (_req, res) => sendJson(res, 200, { status: "ok", service: "nursery-node-backend" })],
  ["POST", "/api/auth/login", null, login],
  ["GET", "/api/auth/me", "dashboard:read", me],
  ["GET", "/api/dashboard", "dashboard:read", getDashboard],
  ["GET", "/api/categories", "products:read", listCategories],
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
  ["POST", "/api/orders", null, createOrder],
  ["GET", "/api/customer-orders", null, listCustomerOrders],
  ["PATCH", "/api/orders/status", "orders:write", updateOrderStatus],
  ["POST", "/api/production", "production:write", createProduction],
  ["GET", "/api/payments", "payments:read", listPayments],
  ["POST", "/api/billing", "billing:write", createBill],
  ["GET", "/api/bills", "billing:read", listBills],
  ["GET", "/api/advance-bookings", "bookings:read", listBookings],
  ["POST", "/api/advance-bookings", "bookings:write", createAdvanceBooking],
  ["PATCH", "/api/advance-bookings/status", "bookings:write", updateBookingStatus],
  ["GET", "/api/dispatch", "dispatch:read", listDispatches],
  ["POST", "/api/dispatch", "dispatch:write", createDispatch],
  ["POST", "/api/payments/initiate", "payments:write", initiatePayment],
  ["POST", "/api/payments/webhook", null, paymentWebhook],
  ["GET", "/api/employees", "employees:read", listEmployees],
  ["POST", "/api/employees", "employees:write", createEmployee],
  ["GET", "/api/attendance", "attendance:read", listAttendance],
  ["POST", "/api/attendance", "attendance:write", saveAttendance],
  ["GET", "/api/wages/summary", "wages:read", listWageSummary],
  ["POST", "/api/wages/calculate", "wages:read", calculateWages],
  ["GET", "/api/customer-ledger", "ledger:read", getLedger],
  ["GET", "/api/reports", "reports:read", getReport]
];

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendNoContent(res);
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const match = routes.find(([method, path]) => method === req.method && path === url.pathname);

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
      if (!hasPermission(user, permission)) {
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
