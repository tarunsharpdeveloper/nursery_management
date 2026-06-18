const { z } = require("zod");
const { pool } = require("../db");

const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email().optional(),
    address: z.string().min(5)
  }),
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive()
    })
  ).min(1)
});

async function createOrder(req, res, { readJson, sendJson }) {
  const payload = orderSchema.parse(await readJson(req));
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [customerResult] = await connection.query(
      "INSERT INTO customers (name, phone, email, address) VALUES (:name, :phone, :email, :address)",
      payload.customer
    );
    const customerId = Number(customerResult.insertId);
    const totalAmount = payload.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const orderNumber = `ORD-${Date.now()}`;

    const [orderResult] = await connection.query(
      `INSERT INTO orders (customer_id, order_number, order_source, status, payment_status, total_amount)
       VALUES (:customerId, :orderNumber, 'online', 'received', 'pending', :totalAmount)`,
      { customerId, orderNumber, totalAmount }
    );
    const orderId = Number(orderResult.insertId);

    for (const item of payload.items) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
         VALUES (:orderId, :productId, :quantity, :unitPrice, :lineTotal)`,
        { ...item, orderId, lineTotal: item.quantity * item.unitPrice }
      );
      await connection.query(
        `UPDATE products
            SET available_quantity = available_quantity - :quantity
          WHERE id = :productId AND available_quantity >= :quantity`,
        item
      );
      await connection.query(
        `INSERT INTO stock_ledger (product_id, movement_type, quantity_change, reference_type, reference_id, remarks)
         VALUES (:productId, 'online_order', :quantityChange, 'orders', :orderId, 'Online checkout order')`,
        { productId: item.productId, quantityChange: -item.quantity, orderId }
      );
    }

    await connection.commit();
    sendJson(res, 201, { orderId, orderNumber });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { createOrder };
