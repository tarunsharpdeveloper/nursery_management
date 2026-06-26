const { z } = require("zod");
const { pool } = require("../db");
const { hashPassword } = require("../auth");

const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email(),
    address: z.string().min(5)
  }),
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      variantId: z.number().int().positive().optional().nullable(),
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

    const [customerRoles] = await connection.query("SELECT id FROM roles WHERE name = 'customer' LIMIT 1");
    if (!customerRoles.length) {
      throw new Error("Customer role is not configured");
    }
    const roleId = Number(customerRoles[0].id);
    const passwordHash = hashPassword(payload.customer.phone);

    const [existingUsers] = await connection.query(
      "SELECT id, role FROM users WHERE email = :email LIMIT 1",
      { email: payload.customer.email }
    );
    if (existingUsers.length && existingUsers[0].role !== "customer") {
      throw new Error("This email is already used by an admin or staff account");
    }

    await connection.query(
      `INSERT INTO users (role_id, role, name, email, password_hash)
       VALUES (:roleId, 'customer', :name, :email, :passwordHash)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         is_active = TRUE`,
      { roleId, name: payload.customer.name, email: payload.customer.email, passwordHash }
    );

    const [existingCustomers] = await connection.query(
      "SELECT id FROM customers WHERE email = :email OR phone = :phone ORDER BY id DESC LIMIT 1",
      { email: payload.customer.email, phone: payload.customer.phone }
    );

    let customerId = Number(existingCustomers[0]?.id || 0);
    if (customerId) {
      await connection.query(
        `UPDATE customers
            SET name = :name,
                phone = :phone,
                email = :email,
                address = :address
          WHERE id = :customerId`,
        { ...payload.customer, customerId }
      );
    } else {
      const [customerResult] = await connection.query(
        "INSERT INTO customers (name, phone, email, address) VALUES (:name, :phone, :email, :address)",
        payload.customer
      );
      customerId = Number(customerResult.insertId);
    }

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
        `INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, line_total)
         VALUES (:orderId, :productId, :variantId, :quantity, :unitPrice, :lineTotal)`,
        { ...item, orderId, variantId: item.variantId || null, lineTotal: item.quantity * item.unitPrice }
      );

      if (item.variantId) {
        const [stockResult] = await connection.query(
          `UPDATE product_variants
              SET available_quantity = available_quantity - :quantity
            WHERE id = :variantId AND available_quantity >= :quantity`,
          item
        );
        if (stockResult.affectedRows === 0) {
          throw new Error("One or more product variants do not have enough stock");
        }
      } else {
        const [stockResult] = await connection.query(
          `UPDATE products
              SET available_quantity = available_quantity - :quantity
            WHERE id = :productId AND available_quantity >= :quantity`,
          item
        );
        if (stockResult.affectedRows === 0) {
          throw new Error("One or more products do not have enough stock");
        }
      }

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

const trackingSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  orderNumber: z.string().min(3).optional()
}).refine((value) => value.email || value.phone || value.orderNumber, {
  message: "Enter email, phone, or order number"
});

async function listCustomerOrders(req, res, { sendJson }) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const filters = trackingSchema.parse({
    email: url.searchParams.get("email") || undefined,
    phone: url.searchParams.get("phone") || undefined,
    orderNumber: url.searchParams.get("orderNumber") || undefined
  });

  const clauses = [];
  const params = {};

  if (filters.email) {
    clauses.push("c.email = :email");
    params.email = filters.email;
  }
  if (filters.phone) {
    clauses.push("c.phone = :phone");
    params.phone = filters.phone;
  }
  if (filters.orderNumber) {
    clauses.push("o.order_number = :orderNumber");
    params.orderNumber = filters.orderNumber;
  }

  const [rows] = await pool.query(
    `SELECT o.id, o.order_number, o.status, o.payment_status, o.total_amount, o.created_at,
            c.name AS customer_name, c.phone, c.email,
            p.name AS product_name, p.product_type, p.photo_url, p.available_quantity,
            oi.quantity, oi.unit_price, oi.line_total
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
      WHERE ${clauses.join(" OR ")}
      ORDER BY o.created_at DESC, o.id DESC`,
    params
  );

  const orders = rows.reduce((acc, row) => {
    let order = acc.find((item) => item.id === row.id);
    if (!order) {
      order = {
        id: row.id,
        order_number: row.order_number,
        status: row.status,
        payment_status: row.payment_status,
        total_amount: Number(row.total_amount),
        created_at: row.created_at,
        customer_name: row.customer_name,
        phone: row.phone,
        email: row.email,
        items: []
      };
      acc.push(order);
    }

    order.items.push({
      product_name: row.product_name,
      product_type: row.product_type,
      photo_url: row.photo_url,
      available_quantity: row.available_quantity,
      quantity: row.quantity,
      unit_price: Number(row.unit_price),
      line_total: Number(row.line_total)
    });

    return acc;
  }, []);

  sendJson(res, 200, orders);
}

module.exports = { createOrder, listCustomerOrders };
