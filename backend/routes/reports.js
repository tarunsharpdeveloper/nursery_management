const { z } = require("zod");
const { pool } = require("../db");

const payLedgerSchema = z.object({
  customerId: z.number().int().positive(),
  amount: z.number().positive(),
  paymentMethod: z.enum(["cash", "upi", "credit_card", "debit_card", "net_banking"]).default("cash"),
  remarks: z.string().optional()
});

async function payCustomerLedger(req, res, { readJson, sendJson }) {
  const payload = payLedgerSchema.parse(await readJson(req));

  const [customerRows] = await pool.query(
    "SELECT id, name FROM customers WHERE id = ?",
    [payload.customerId]
  );

  if (customerRows.length === 0) {
    return sendJson(res, 404, { message: "Customer not found" });
  }

  const customer = customerRows[0];
  const remarksText = payload.remarks && payload.remarks.trim()
    ? payload.remarks.trim()
    : `Outstanding payment received via ${payload.paymentMethod.toUpperCase()}`;

  await pool.query(
    `INSERT INTO customer_ledger
      (customer_id, transaction_date, transaction_type, debit_amount, credit_amount, reference_type, remarks)
     VALUES (:customerId, CURDATE(), 'payment', 0, :amount, 'payment', :remarksText)`,
    {
      customerId: payload.customerId,
      amount: payload.amount,
      remarksText
    }
  );

  const provider = payload.paymentMethod === "cash" ? "cash" : "manual";
  await pool.query(
    `INSERT INTO payments
      (payment_gateway, payment_method, payment_status, amount, paid_at, remarks)
     VALUES (:provider, :paymentMethod, 'paid', :amount, NOW(), :remarksText)`,
    {
      provider,
      paymentMethod: payload.paymentMethod,
      amount: payload.amount,
      remarksText: `Ledger Payment - ${customer.name}: ${remarksText}`
    }
  );

  sendJson(res, 201, {
    success: true,
    message: `Payment of ₹${payload.amount} recorded for ${customer.name}`
  });
}

async function getLedger(_req, res, { sendJson }) {
  const [rows] = await pool.query(
    `SELECT c.id AS customer_id,
            c.name AS customer,
            SUM(l.debit_amount) AS total_purchase,
            SUM(l.credit_amount) AS amount_paid,
            SUM(l.debit_amount - l.credit_amount) AS outstanding_amount
       FROM customer_ledger l
       JOIN customers c ON c.id = l.customer_id
      GROUP BY c.id, c.name`
  );

  sendJson(res, 200, rows);
}

async function getCustomerLedgerDetails(req, res, { sendJson }) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const customerId = url.searchParams.get("customerId");

  if (!customerId) {
    sendJson(res, 400, { message: "customerId is required" });
    return;
  }

  const [rows] = await pool.query(
    `SELECT l.id,
            l.transaction_date,
            l.transaction_type,
            l.debit_amount,
            l.credit_amount,
            l.reference_type,
            l.reference_id,
            l.remarks,
            l.created_at,
            c.name AS customer_name
       FROM customer_ledger l
       JOIN customers c ON c.id = l.customer_id
      WHERE l.customer_id = :customerId
      ORDER BY l.transaction_date DESC, l.created_at DESC`,
    { customerId }
  );

  sendJson(res, 200, rows);
}

async function getReport(req, res, { sendJson }) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const report = url.searchParams.get("report") || "sales";
  const fromDate = url.searchParams.get("fromDate") || "1970-01-01";
  const toDate = url.searchParams.get("toDate") || "2999-12-31";

  if (report === "outstanding") {
    const [rows] = await pool.query(
      `SELECT c.name,
              SUM(l.debit_amount) AS total_purchase,
              SUM(l.credit_amount) AS amount_paid,
              SUM(l.debit_amount - l.credit_amount) AS outstanding_amount
         FROM customer_ledger l
         JOIN customers c ON c.id = l.customer_id
        GROUP BY c.id, c.name
        HAVING outstanding_amount > 0`
    );
    sendJson(res, 200, rows);
    return;
  }

  if (report === "stock") {
    const [rows] = await pool.query("SELECT name, available_quantity FROM products WHERE is_deleted = 0 ORDER BY name");
    sendJson(res, 200, rows);
    return;
  }

  if (report === "product_wise_sales") {
    const [rows] = await pool.query(
      `SELECT p.name AS product_name,
              SUM(bi.quantity) AS total_quantity,
              SUM(bi.line_total) AS total_revenue
         FROM bill_items bi
         JOIN bills b ON b.id = bi.bill_id
         JOIN products p ON p.id = bi.product_id
        WHERE b.bill_date BETWEEN :fromDate AND :toDate
          AND b.is_deleted = 0
        GROUP BY p.id, p.name
        ORDER BY total_revenue DESC`,
      { fromDate, toDate }
    );
    sendJson(res, 200, rows);
    return;
  }

  if (report === "advance_bookings") {
    const [rows] = await pool.query(
      `SELECT a.booking_number, c.name AS customer, p.name AS product,
              a.quantity, a.advance_amount, a.total_bill_amount, a.status, a.delivery_date
         FROM advance_bookings a
         JOIN customers c ON c.id = a.customer_id
         JOIN products p ON p.id = a.product_id
        WHERE a.delivery_date BETWEEN :fromDate AND :toDate
        ORDER BY a.delivery_date DESC`,
      { fromDate, toDate }
    );
    sendJson(res, 200, rows);
    return;
  }

  if (report === "attendance") {
    const [rows] = await pool.query(
      `SELECT e.name AS employee, a.attendance_date, a.status, a.remarks
         FROM attendance a
         JOIN employees e ON e.id = a.employee_id
        WHERE a.attendance_date BETWEEN :fromDate AND :toDate
        ORDER BY a.attendance_date DESC, e.name`,
      { fromDate, toDate }
    );
    sendJson(res, 200, rows);
    return;
  }

  const search = url.searchParams.get("search") || "";
  const filterKey = url.searchParams.get("filterKey");
  const filterValue = url.searchParams.get("filterValue");

  let salesWhere = "WHERE b.bill_date BETWEEN :fromDate AND :toDate";
  
  if (search) {
    salesWhere += " AND (b.bill_number LIKE :search OR c.name LIKE :search)";
  }
  
  if (filterKey === "bill_type" && filterValue) {
    salesWhere += " AND b.bill_type = :filterValue";
  }

  const [rows] = await pool.query(
    `SELECT b.bill_date, b.bill_number, c.name AS customer, b.total_amount, b.paid_amount, b.balance_amount, b.bill_type
       FROM bills b
       LEFT JOIN customers c ON c.id = b.customer_id
      ${salesWhere}
      ORDER BY b.bill_date DESC`,
    { fromDate, toDate, search: `%${search}%`, filterValue }
  );

  sendJson(res, 200, rows);
}

module.exports = { getLedger, getCustomerLedgerDetails, getReport, payCustomerLedger };
