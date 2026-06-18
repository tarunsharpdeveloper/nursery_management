const { pool } = require("../db");

async function getLedger(_req, res, { sendJson }) {
  const [rows] = await pool.query(
    `SELECT c.name AS customer,
            SUM(l.debit_amount) AS total_purchase,
            SUM(l.credit_amount) AS amount_paid,
            SUM(l.debit_amount - l.credit_amount) AS outstanding_amount
       FROM customer_ledger l
       JOIN customers c ON c.id = l.customer_id
      GROUP BY c.id, c.name`
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
    const [rows] = await pool.query("SELECT name, available_quantity FROM products ORDER BY name");
    sendJson(res, 200, rows);
    return;
  }

  const [rows] = await pool.query(
    `SELECT b.bill_date, b.bill_number, c.name AS customer, b.total_amount, b.paid_amount, b.balance_amount
       FROM bills b
       LEFT JOIN customers c ON c.id = b.customer_id
      WHERE b.bill_date BETWEEN :fromDate AND :toDate
      ORDER BY b.bill_date DESC`,
    { fromDate, toDate }
  );

  sendJson(res, 200, rows);
}

module.exports = { getLedger, getReport };
