const { pool } = require("../db");

async function listProducts(_req, res, { sendJson }) {
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.product_type, p.description, p.selling_price, p.available_quantity,
            p.photo_url, p.is_active, c.name AS category
       FROM products p
       JOIN categories c ON c.id = p.category_id
      ORDER BY p.created_at DESC`
  );

  sendJson(res, 200, rows);
}

module.exports = { listProducts };
