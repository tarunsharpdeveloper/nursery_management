const { z } = require("zod");
const { pool } = require("../db");

async function getDashboard(_req, res, { sendJson }) {
  const [[products]] = await pool.query("SELECT COUNT(*) AS total_products, COALESCE(SUM(available_quantity), 0) AS total_stock FROM products WHERE is_deleted = 0");
  const [[orders]] = await pool.query("SELECT COUNT(*) AS total_orders, COALESCE(SUM(total_amount), 0) AS order_value FROM orders");
  const [[bookings]] = await pool.query("SELECT COUNT(*) AS total_bookings FROM advance_bookings");
  const [[employees]] = await pool.query("SELECT COUNT(*) AS total_employees FROM employees WHERE is_active = TRUE AND is_deleted = 0");

  sendJson(res, 200, { ...products, ...orders, ...bookings, ...employees });
}

async function listCustomers(_req, res, { sendJson }) {
  const [rows] = await pool.query(
    `SELECT id, name, phone, email, address, is_credit_customer, credit_limit
       FROM customers
      ORDER BY name`
  );
  sendJson(res, 200, rows);
}

async function listCategories(req, res, { sendJson }) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "1000", 10);
  const search = url.searchParams.get("search") || "";
  const filterValue = url.searchParams.get("filterValue");

  let whereClause = "WHERE 1=1";
  const params = {};

  if (search) {
    whereClause += " AND (c.name LIKE :search OR c.description LIKE :search)";
    params.search = `%${search}%`;
  }

  if (filterValue) {
    whereClause += " AND c.category_type = :filterValue";
    params.filterValue = filterValue;
  }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM categories c ${whereClause}`,
    params
  );

  const offset = (page - 1) * limit;
  params.limit = limit;
  params.offset = offset;

  const [rows] = await pool.query(
    `SELECT c.id, c.parent_id, c.category_type, c.name, c.description, c.photo_urls, c.is_active,
            p.name AS parent_name,
            COUNT(DISTINCT child.id) AS child_count,
            COUNT(DISTINCT product.id) AS product_count
       FROM categories c
       LEFT JOIN categories p ON p.id = c.parent_id
       LEFT JOIN categories child ON child.parent_id = c.id
       LEFT JOIN products product ON product.category_id = c.id AND product.is_deleted = 0
       ${whereClause}
       GROUP BY c.id, c.parent_id, c.category_type, c.name, c.description, c.photo_urls, c.is_active, p.name
       ORDER BY COALESCE(p.name, c.name), c.parent_id IS NOT NULL, c.name
       LIMIT :limit OFFSET :offset`,
    params
  );

  if (url.searchParams.has("page")) {
    sendJson(res, 200, {
      data: rows,
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } else {
    sendJson(res, 200, rows);
  }
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
  description: z.string().optional().nullable(),
  photoUrls: z.string().optional().nullable(),
  categoryType: z.enum(["plant", "seed"]).optional().nullable()
});

async function editCategory(req, res, { readJson, sendJson }) {
  const payload = editCategorySchema.parse(await readJson(req));
  await pool.query(
    `UPDATE categories 
        SET name = :name, 
            description = :description,
            category_type = :categoryType,
            photo_urls = CASE WHEN :photoUrls IS NOT NULL THEN :photoUrls ELSE photo_urls END
      WHERE id = :categoryId`,
    {
      categoryId: payload.categoryId,
      name: payload.name,
      description: payload.description || null,
      photoUrls: payload.photoUrls || null,
      categoryType: payload.categoryType || null
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
      WHERE p.is_deleted = 0
      GROUP BY p.id, p.name, p.available_quantity
      ORDER BY p.name`
  );
  sendJson(res, 200, rows);
}

async function listOrders(_req, res, { sendJson }) {
  const [rows] = await pool.query(
    `SELECT o.id, o.order_number, c.name AS customer, o.status, o.payment_status, o.total_amount, o.created_at,
            GROUP_CONCAT(p.name SEPARATOR ', ') AS products
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.is_deleted = 0
      GROUP BY o.id
      ORDER BY o.created_at DESC`
  );
  sendJson(res, 200, rows);
}

const deleteOrderSchema = z.object({
  orderId: z.number().int().positive()
});

async function deleteOrder(req, res, { readJson, sendJson }) {
  const payload = deleteOrderSchema.parse(await readJson(req));
  await pool.query("UPDATE orders SET is_deleted = 1 WHERE id = ?", [payload.orderId]);
  sendJson(res, 200, { deleted: true });
}

const getOrderSchema = z.object({
  orderId: z.number().int().positive()
});

async function getOrder(req, res, { readJson, sendJson }) {
  const payload = getOrderSchema.parse(await readJson(req));
  
  const [orderRows] = await pool.query(
    `SELECT o.id, o.order_number, o.order_source, o.status, o.payment_status, o.total_amount, o.created_at,
            c.name AS customer_name, c.phone, c.email, c.address
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
      WHERE o.id = ?`,
    [payload.orderId]
  );

  if (orderRows.length === 0) {
    throw new Error("Order not found");
  }
  
  const order = orderRows[0];

  const [items] = await pool.query(
    `SELECT oi.id, oi.quantity, oi.unit_price, oi.line_total,
            p.name AS product_name, p.product_type,
            v.unit, v.unit_value
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       LEFT JOIN product_variants v ON v.id = oi.variant_id
      WHERE oi.order_id = ?`,
    [payload.orderId]
  );
  
  order.items = items;
  sendJson(res, 200, order);
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
      WHERE b.is_deleted = 0
      ORDER BY b.created_at DESC`
  );
  sendJson(res, 200, rows);
}

const deleteBillSchema = z.object({
  billId: z.number().int().positive()
});

async function deleteBill(req, res, { readJson, sendJson }) {
  const payload = deleteBillSchema.parse(await readJson(req));
  await pool.query("UPDATE bills SET is_deleted = 1 WHERE id = ?", [payload.billId]);
  sendJson(res, 200, { deleted: true });
}

const getBillSchema = z.object({
  billId: z.number().int().positive()
});

async function getBill(req, res, { readJson, sendJson }) {
  const payload = getBillSchema.parse(await readJson(req));
  
  const [billRows] = await pool.query(
    `SELECT b.id, b.bill_number, b.bill_type, b.payment_type,
            b.total_amount, b.paid_amount, b.balance_amount, b.bill_date,
            c.name AS customer_name, c.phone, c.address,
            p.gateway_payment_id AS transaction_id
       FROM bills b
       LEFT JOIN customers c ON c.id = b.customer_id
       LEFT JOIN payments p ON p.bill_id = b.id
      WHERE b.id = ? AND b.is_deleted = 0`,
    [payload.billId]
  );

  if (billRows.length === 0) {
    throw new Error("Bill not found");
  }
  
  const bill = billRows[0];

  const [items] = await pool.query(
    `SELECT bi.id, bi.quantity, bi.unit_price, bi.line_total,
            p.name AS product_name, p.product_type
       FROM bill_items bi
       JOIN products p ON p.id = bi.product_id
      WHERE bi.bill_id = ?`,
    [payload.billId]
  );
  
  bill.items = items;
  sendJson(res, 200, bill);
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

const dispatchStatusSchema = z.object({
  dispatchId: z.number().int().positive(),
  status: z.enum(["pending", "dispatched", "delivered"])
});

async function updateDispatchStatus(req, res, { readJson, sendJson }) {
  const payload = dispatchStatusSchema.parse(await readJson(req));
  await pool.query("UPDATE dispatches SET status = :status WHERE id = :dispatchId", payload);

  const [dispatchRows] = await pool.query(
    "SELECT order_id, advance_booking_id FROM dispatches WHERE id = :dispatchId",
    payload
  );

  if (dispatchRows.length > 0) {
    const dispatch = dispatchRows[0];
    
    if (dispatch.order_id) {
      let orderStatus;
      if (payload.status === "pending") orderStatus = "approved";
      else if (payload.status === "dispatched") orderStatus = "dispatch";
      else if (payload.status === "delivered") orderStatus = "delivered";
      
      if (orderStatus) {
        await pool.query(
          "UPDATE orders SET status = :orderStatus WHERE id = :orderId",
          { orderStatus, orderId: dispatch.order_id }
        );
      }
    } else if (dispatch.advance_booking_id) {
      let bookingStatus;
      if (payload.status === "pending") bookingStatus = "booked";
      else if (payload.status === "dispatched") bookingStatus = "ready";
      else if (payload.status === "delivered") bookingStatus = "delivered";
      
      if (bookingStatus) {
        await pool.query(
          "UPDATE advance_bookings SET status = :bookingStatus WHERE id = :bookingId",
          { bookingStatus, bookingId: dispatch.advance_booking_id }
        );
      }
    }
  }

  sendJson(res, 200, { updated: true });
}

async function listEmployees(_req, res, { sendJson }) {
  const [rows] = await pool.query(
    `SELECT id, name, mobile, gender, joining_date, employee_type, monthly_salary, daily_wage, is_active
       FROM employees
      WHERE is_deleted = 0
      ORDER BY name`
  );
  sendJson(res, 200, rows);
}

async function listAttendance(_req, res, { sendJson }) {
  const [rows] = await pool.query(
    `SELECT a.id, e.name AS employee, a.attendance_date, a.status, a.remarks
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
      WHERE a.employee_id IS NOT NULL AND e.is_deleted = 0
      ORDER BY a.attendance_date DESC, e.name
      LIMIT 100`
  );
  sendJson(res, 200, rows);
}

async function listMonthlyAttendance(req, res, { sendJson }) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
  
  const [employees] = await pool.query(
    `SELECT id, name, employee_type FROM employees WHERE is_active = TRUE AND is_deleted = 0 ORDER BY name`
  );

  const [attendance] = await pool.query(
    `SELECT employee_id, DATE_FORMAT(attendance_date, '%Y-%m-%d') as date, status 
       FROM attendance 
      WHERE DATE_FORMAT(attendance_date, '%Y-%m') = :month`,
    { month }
  );

  const attendanceMap = {};
  attendance.forEach(record => {
    if (!attendanceMap[record.employee_id]) attendanceMap[record.employee_id] = {};
    attendanceMap[record.employee_id][record.date] = record.status;
  });

  const result = employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    employee_type: emp.employee_type,
    attendance: attendanceMap[emp.id] || {}
  }));

  sendJson(res, 200, result);
}

async function getEmployeeAttendance(req, res, { sendJson }) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const employeeId = url.searchParams.get("employeeId");
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  if (!employeeId) {
    throw new Error("employeeId is required");
  }

  const [employeeRows] = await pool.query(
    "SELECT id, name, employee_type FROM employees WHERE id = :employeeId",
    { employeeId }
  );

  if (employeeRows.length === 0) {
    throw new Error("Employee not found");
  }

  let query = `
    SELECT DATE_FORMAT(attendance_date, '%Y-%m-%d') as date, status, remarks
      FROM attendance 
     WHERE employee_id = :employeeId
  `;
  const params = { employeeId };

  if (startDate) {
    query += " AND attendance_date >= :startDate";
    params.startDate = startDate;
  }
  if (endDate) {
    query += " AND attendance_date <= :endDate";
    params.endDate = endDate;
  }

  query += " ORDER BY attendance_date DESC";

  const [attendance] = await pool.query(query, params);

  sendJson(res, 200, {
    employee: employeeRows[0],
    attendance
  });
}

async function listWageSummary(req, res, { sendJson }) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const wageMonth = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const search = url.searchParams.get("search") || "";
  const filterKey = url.searchParams.get("filterKey");
  const filterValue = url.searchParams.get("filterValue");

  let whereClause = "WHERE e.is_active = TRUE";
  const params = { wageMonth };

  if (search) {
    whereClause += " AND e.name LIKE :search";
    params.search = `%${search}%`;
  }
  
  if (filterKey === "employee_type" && filterValue) {
    whereClause += " AND e.employee_type = :filterValue";
    params.filterValue = filterValue;
  }

  const [rows] = await pool.query(
    `SELECT e.id, e.name, e.employee_type, e.gender, e.monthly_salary, e.daily_wage,
            SUM(CASE WHEN a.status = 'present' THEN 1 WHEN a.status = 'half_day' THEN 0.5 WHEN a.status = 'sunday_off' AND e.employee_type = 'monthly_salary' THEN 1 ELSE 0 END) AS days_worked,
            SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_days
       FROM employees e
       LEFT JOIN attendance a
         ON a.employee_id = e.id AND DATE_FORMAT(a.attendance_date, '%Y-%m') = :wageMonth
      ${whereClause}
      GROUP BY e.id
      ORDER BY e.name`,
    params
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

const modelsConfig = {
  employees: {
    baseSelect: "SELECT id, name, mobile, gender, joining_date, employee_type, monthly_salary, daily_wage FROM employees",
    baseWhere: "WHERE is_active = TRUE",
    searchFields: ["name", "mobile", "employee_type"],
    orderBy: "ORDER BY name",
    allowedFilters: ["employee_type", "gender"]
  },
  orders: {
    baseSelect: "SELECT o.id, o.order_number, c.name AS customer, o.status, o.payment_status, o.total_amount, o.created_at, GROUP_CONCAT(p.name SEPARATOR ', ') AS products FROM orders o JOIN customers c ON c.id = o.customer_id LEFT JOIN order_items oi ON oi.order_id = o.id LEFT JOIN products p ON p.id = oi.product_id",
    baseWhere: "WHERE o.is_deleted = 0",
    groupBy: "GROUP BY o.id",
    searchFields: ["o.order_number", "c.name", "c.phone"],
    orderBy: "ORDER BY o.created_at DESC",
    allowedFilters: ["status", "payment_status"]
  },
  payments: {
    baseSelect: "SELECT p.id, o.order_number, p.payment_gateway, p.payment_method, p.payment_status, p.amount, p.paid_at FROM payments p LEFT JOIN orders o ON o.id = p.order_id",
    baseWhere: "WHERE 1=1",
    searchFields: ["o.order_number", "p.payment_gateway", "p.payment_method"],
    orderBy: "ORDER BY p.created_at DESC",
    allowedFilters: ["payment_status", "payment_method"]
  },
  bills: {
    baseSelect: "SELECT b.id, b.bill_number, c.name AS customer, b.bill_type, b.payment_type, b.total_amount, b.paid_amount, b.balance_amount, b.bill_date, p.gateway_payment_id AS transaction_id FROM bills b LEFT JOIN customers c ON c.id = b.customer_id LEFT JOIN payments p ON p.bill_id = b.id",
    baseWhere: "WHERE b.is_deleted = 0",
    searchFields: ["b.bill_number", "c.name", "p.gateway_payment_id"],
    orderBy: "ORDER BY b.created_at DESC",
    allowedFilters: ["bill_type", "payment_type"]
  },
  advance_bookings: {
    baseSelect: "SELECT a.id, a.booking_number, c.name AS customer, c.phone, p.name AS product, a.quantity, a.advance_amount, a.total_bill_amount, a.balance_payable, a.delivery_date, a.status FROM advance_bookings a JOIN customers c ON c.id = a.customer_id JOIN products p ON p.id = a.product_id",
    baseWhere: "WHERE 1=1",
    searchFields: ["a.booking_number", "c.name", "c.phone", "p.name"],
    orderBy: "ORDER BY a.delivery_date",
    allowedFilters: ["status"]
  },
  dispatch: {
    baseSelect: "SELECT d.id, COALESCE(o.order_number, ab.booking_number) AS reference_number, IF(o.id IS NOT NULL, 'Online Order', 'Advance Booking') AS reference_type, d.dispatch_type, d.status, d.dispatch_date, d.bus_number, d.driver_name, d.driver_mobile, d.courier_company, d.docket_number FROM dispatches d LEFT JOIN orders o ON o.id = d.order_id LEFT JOIN advance_bookings ab ON ab.id = d.advance_booking_id",
    baseWhere: "WHERE 1=1",
    searchFields: ["o.order_number", "ab.booking_number", "d.bus_number", "d.driver_name", "d.courier_company", "d.docket_number"],
    orderBy: "ORDER BY d.id DESC",
    allowedFilters: ["status", "dispatch_type"]
  },
  attendance: {
    baseSelect: "SELECT a.id, e.name AS employee, a.attendance_date, a.status, a.remarks FROM attendance a JOIN employees e ON e.id = a.employee_id",
    baseWhere: "WHERE a.employee_id IS NOT NULL",
    searchFields: ["e.name", "a.remarks"],
    orderBy: "ORDER BY a.attendance_date DESC, e.name",
    allowedFilters: ["status"]
  },
  inventory: {
    baseSelect: "SELECT p.id, p.name, p.available_quantity, COALESCE(SUM(CASE WHEN s.quantity_change < 0 THEN ABS(s.quantity_change) ELSE 0 END), 0) AS sold_quantity, p.available_quantity AS current_balance FROM products p LEFT JOIN stock_ledger s ON s.product_id = p.id",
    baseWhere: "WHERE p.is_deleted = 0",
    groupBy: "GROUP BY p.id, p.name, p.available_quantity",
    searchFields: ["p.name"],
    orderBy: "ORDER BY p.name",
    allowedFilters: [] // Usually stock status, but that needs a HAVING clause or subquery which is complex for this unified setup
  }
};

async function getUnifiedList(req, res, { sendJson }) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const model = url.searchParams.get("model");
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const search = url.searchParams.get("search") || "";
  const filterKey = url.searchParams.get("filterKey");
  const filterValue = url.searchParams.get("filterValue");

  const config = modelsConfig[model];
  if (!config) {
    return sendJson(res, 400, { error: `Unknown model: ${model}` });
  }

  let whereClause = config.baseWhere;
  const params = {};

  if (search && config.searchFields.length > 0) {
    const searchConditions = config.searchFields.map(f => `${f} LIKE :search`).join(" OR ");
    whereClause += ` AND (${searchConditions})`;
    params.search = `%${search}%`;
  }

  if (filterKey && filterValue && config.allowedFilters.includes(filterKey)) {
    // If it's a joined table and filter doesn't have an alias prefix, assume main table alias or generic. 
    // In our config, status is usually o.status or a.status, so it's safer if frontend passes the correct alias or we just handle it.
    // For simplicity, we assume filterKey exactly matches a valid column name in the scope.
    let fKey = filterKey;
    if (model === 'orders' && filterKey === 'status') fKey = 'o.status';
    else if (model === 'orders' && filterKey === 'payment_status') fKey = 'o.payment_status';
    else if (model === 'advance_bookings' && filterKey === 'status') fKey = 'a.status';
    else if (model === 'dispatch' && filterKey === 'status') fKey = 'd.status';
    else if (model === 'dispatch' && filterKey === 'dispatch_type') fKey = 'd.dispatch_type';
    else if (model === 'attendance' && filterKey === 'status') fKey = 'a.status';
    else if (model === 'payments' && filterKey === 'payment_status') fKey = 'p.payment_status';
    else if (model === 'payments' && filterKey === 'payment_method') fKey = 'p.payment_method';
    else if (model === 'bills' && filterKey === 'bill_type') fKey = 'b.bill_type';
    else if (model === 'bills' && filterKey === 'payment_type') fKey = 'b.payment_type';
    else if (model === 'employees' && filterKey === 'employee_type') fKey = 'e.employee_type'; // employees table is just employee_type, but let's just use the column name

    whereClause += ` AND ${fKey} = :filterValue`;
    params.filterValue = filterValue;
  }

  // Count total records
  // Count queries with GROUP BY need to be wrapped as a subquery
  let countSql = `SELECT COUNT(*) AS total FROM (${config.baseSelect} ${whereClause} ${config.groupBy || ""}) AS count_query`;
  const [[{ total }]] = await pool.query(countSql, params);

  // Fetch paginated data
  const offset = (page - 1) * limit;
  const dataSql = `
    ${config.baseSelect}
    ${whereClause}
    ${config.groupBy || ""}
    ${config.orderBy || ""}
    LIMIT :limit OFFSET :offset
  `;
  
  params.limit = limit;
  params.offset = offset;

  const [data] = await pool.query(dataSql, params);

  sendJson(res, 200, {
    data,
    totalRecords: total,
    totalPages: Math.ceil(total / limit),
    currentPage: page
  });
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
};
