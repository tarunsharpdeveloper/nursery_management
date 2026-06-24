const { z } = require("zod");
const { pool } = require("../db");

async function getDashboard(_req, res, { sendJson }) {
  const [[products]] = await pool.query("SELECT COUNT(*) AS total_products, COALESCE(SUM(available_quantity), 0) AS total_stock FROM products");
  const [[orders]] = await pool.query("SELECT COUNT(*) AS total_orders, COALESCE(SUM(total_amount), 0) AS order_value FROM orders");
  const [[bookings]] = await pool.query("SELECT COUNT(*) AS total_bookings FROM advance_bookings");
  const [[employees]] = await pool.query("SELECT COUNT(*) AS total_employees FROM employees WHERE is_active = TRUE");

  sendJson(res, 200, { ...products, ...orders, ...bookings, ...employees });
}

async function listCustomers(_req, res, { sendJson }) {
  const [rows] = await pool.query(
    `SELECT id, name, phone, is_credit_customer, credit_limit
       FROM customers
      ORDER BY name`
  );
  sendJson(res, 200, rows);
}

async function listCategories(_req, res, { sendJson }) {
  const [rows] = await pool.query(
    `SELECT c.id, c.parent_id, c.category_type, c.name, c.description, c.photo_urls, c.is_active,
            p.name AS parent_name,
            COUNT(DISTINCT child.id) AS child_count,
            COUNT(DISTINCT product.id) AS product_count
       FROM categories c
       LEFT JOIN categories p ON p.id = c.parent_id
       LEFT JOIN categories child ON child.parent_id = c.id
       LEFT JOIN products product ON product.category_id = c.id
       GROUP BY c.id, c.parent_id, c.category_type, c.name, c.description, c.photo_urls, c.is_active, p.name
       ORDER BY COALESCE(p.name, c.name), c.parent_id IS NOT NULL, c.name`
  );
  sendJson(res, 200, rows);
}

const categorySchema = z.object({
  parentId: z.number().int().positive().nullable().optional(),
  categoryType: z.enum(["plant", "seed"]).optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  photoUrls: z.string().optional()
});

async function createCategory(req, res, { readJson, sendJson }) {
  const payload = categorySchema.parse(await readJson(req));
  await pool.query(
    `INSERT INTO categories (parent_id, category_type, name, description, photo_urls)
     VALUES (:parentId, :categoryType, :name, :description, :photoUrls)`,
    {
      parentId: payload.parentId || null,
      categoryType: payload.categoryType || null,
      name: payload.name,
      description: payload.description || null,
      photoUrls: payload.photoUrls || null
    }
  );

  sendJson(res, 201, { created: true });
}

const editCategorySchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().min(2),
  description: z.string().optional().nullable()
});

async function editCategory(req, res, { readJson, sendJson }) {
  const payload = editCategorySchema.parse(await readJson(req));
  await pool.query(
    `UPDATE categories 
        SET name = :name, 
            description = :description 
      WHERE id = :categoryId`,
    {
      categoryId: payload.categoryId,
      name: payload.name,
      description: payload.description || null
    }
  );
  sendJson(res, 200, { updated: true });
}

const toggleCategorySchema = z.object({
  categoryId: z.number().int().positive(),
  isActive: z.boolean()
});

async function toggleCategory(req, res, { readJson, sendJson }) {
  const payload = toggleCategorySchema.parse(await readJson(req));
  await pool.query(
    "UPDATE categories SET is_active = :isActive WHERE id = :categoryId",
    payload
  );
  sendJson(res, 200, { updated: true });
}

const deleteCategorySchema = z.object({
  categoryId: z.number().int().positive()
});

async function deleteCategory(req, res, { readJson, sendJson }) {
  const payload = deleteCategorySchema.parse(await readJson(req));
  
  // Need to check if there are any products attached
  const [[productCheck]] = await pool.query(
    "SELECT COUNT(*) AS total FROM products WHERE category_id = :categoryId", 
    payload
  );
  if (productCheck.total > 0) {
    throw new Error("Cannot delete category because it has products linked to it.");
  }

  // Need to check if there are any subcategories attached
  const [[childCheck]] = await pool.query(
    "SELECT COUNT(*) AS total FROM categories WHERE parent_id = :categoryId",
    payload
  );
  if (childCheck.total > 0) {
    throw new Error("Cannot delete category because it has sub-categories linked to it.");
  }

  await pool.query(
    "DELETE FROM categories WHERE id = :categoryId",
    payload
  );
  sendJson(res, 200, { deleted: true });
}



async function listInventory(_req, res, { sendJson }) {
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.available_quantity,
            COALESCE(SUM(CASE WHEN s.quantity_change < 0 THEN ABS(s.quantity_change) ELSE 0 END), 0) AS sold_quantity,
            p.available_quantity AS current_balance
       FROM products p
       LEFT JOIN stock_ledger s ON s.product_id = p.id
      GROUP BY p.id, p.name, p.available_quantity
      ORDER BY p.name`
  );
  sendJson(res, 200, rows);
}

async function listOrders(_req, res, { sendJson }) {
  const [rows] = await pool.query(
    `SELECT o.id, o.order_number, c.name AS customer, o.status, o.payment_status, o.total_amount, o.created_at
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
      ORDER BY o.created_at DESC`
  );
  sendJson(res, 200, rows);
}

const orderStatusSchema = z.object({
  orderId: z.number().int().positive(),
  status: z.enum(["received", "approved", "dispatch", "delivered", "cancelled"])
});

async function updateOrderStatus(req, res, { readJson, sendJson }) {
  const payload = orderStatusSchema.parse(await readJson(req));
  await pool.query("UPDATE orders SET status = :status WHERE id = :orderId", payload);
  sendJson(res, 200, { updated: true });
}

async function listPayments(_req, res, { sendJson }) {
  const [rows] = await pool.query(
    `SELECT p.id, o.order_number, p.payment_gateway, p.payment_method, p.payment_status, p.amount, p.paid_at
       FROM payments p
       LEFT JOIN orders o ON o.id = p.order_id
      ORDER BY p.created_at DESC`
  );
  sendJson(res, 200, rows);
}

async function listBills(_req, res, { sendJson }) {
  const [rows] = await pool.query(
    `SELECT b.id, b.bill_number, c.name AS customer, b.bill_type, b.payment_type,
            b.total_amount, b.paid_amount, b.balance_amount, b.bill_date,
            p.gateway_payment_id AS transaction_id
       FROM bills b
       LEFT JOIN customers c ON c.id = b.customer_id
       LEFT JOIN payments p ON p.bill_id = b.id
      ORDER BY b.created_at DESC`
  );
  sendJson(res, 200, rows);
}

async function listBookings(_req, res, { sendJson }) {
  const [rows] = await pool.query(
    `SELECT a.id, a.booking_number, c.name AS customer, c.phone, p.name AS product,
            a.quantity, a.advance_amount, a.total_bill_amount, a.balance_payable,
            a.delivery_date, a.status
       FROM advance_bookings a
       JOIN customers c ON c.id = a.customer_id
       JOIN products p ON p.id = a.product_id
      ORDER BY a.delivery_date`
  );
  sendJson(res, 200, rows);
}

const bookingStatusSchema = z.object({
  bookingId: z.number().int().positive(),
  status: z.enum(["booked", "ready", "delivered", "cancelled"])
});

async function updateBookingStatus(req, res, { readJson, sendJson }) {
  const payload = bookingStatusSchema.parse(await readJson(req));
  await pool.query("UPDATE advance_bookings SET status = :status WHERE id = :bookingId", payload);
  sendJson(res, 200, { updated: true });
}

async function listDispatches(_req, res, { sendJson }) {
  const [rows] = await pool.query(
    `SELECT d.id, 
            COALESCE(o.order_number, ab.booking_number) AS reference_number, 
            IF(o.id IS NOT NULL, 'Online Order', 'Advance Booking') AS reference_type,
            d.dispatch_type, d.status, d.dispatch_date,
            d.bus_number, d.driver_name, d.driver_mobile, d.courier_company, d.docket_number
       FROM dispatches d
       LEFT JOIN orders o ON o.id = d.order_id
       LEFT JOIN advance_bookings ab ON ab.id = d.advance_booking_id
      ORDER BY d.id DESC`
  );
  sendJson(res, 200, rows);
}

async function listEmployees(_req, res, { sendJson }) {
  const [rows] = await pool.query(
    `SELECT id, name, mobile, gender, joining_date, employee_type, monthly_salary, daily_wage
       FROM employees
      WHERE is_active = TRUE
      ORDER BY name`
  );
  sendJson(res, 200, rows);
}

async function listAttendance(_req, res, { sendJson }) {
  const [rows] = await pool.query(
    `SELECT a.id, e.name AS employee, a.attendance_date, a.status, a.remarks
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
      WHERE a.employee_id IS NOT NULL
      ORDER BY a.attendance_date DESC, e.name
      LIMIT 100`
  );
  sendJson(res, 200, rows);
}

async function listWageSummary(req, res, { sendJson }) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const wageMonth = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const [rows] = await pool.query(
    `SELECT e.id, e.name, e.employee_type, e.gender, e.monthly_salary, e.daily_wage,
            SUM(CASE WHEN a.status = 'present' THEN 1 WHEN a.status = 'half_day' THEN 0.5 ELSE 0 END) AS days_worked,
            SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_days
       FROM employees e
       LEFT JOIN attendance a
         ON a.employee_id = e.id AND DATE_FORMAT(a.attendance_date, '%Y-%m') = :wageMonth
      WHERE e.is_active = TRUE
      GROUP BY e.id
      ORDER BY e.name`,
    { wageMonth }
  );

  sendJson(res, 200, rows.map((row) => {
    const daysWorked = Number(row.days_worked || 0);
    const absentDays = Number(row.absent_days || 0);
    const salary = Number(row.monthly_salary || 0);
    const dailyWage = Number(row.daily_wage || 0);
    const payable = row.employee_type === "monthly_salary"
      ? Math.max(salary - ((salary / 30) * absentDays), 0)
      : dailyWage * daysWorked;

    return { ...row, days_worked: daysWorked, absent_days: absentDays, payable_amount: payable };
  }));
}

module.exports = {
  getDashboard,
  listCustomers,
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
};
