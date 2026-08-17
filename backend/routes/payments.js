const { z } = require("zod");
const { pool } = require("../db");

const initiateSchema = z.object({
  orderId: z.union([z.number(), z.string().min(1)]),
  amount: z.number().positive(),
  paymentMethod: z.enum(["upi", "credit_card", "debit_card", "net_banking", "cash"]),
  transactionId: z.string().optional().nullable()
});

const webhookSchema = z.object({
  gatewayPaymentId: z.string().min(1),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
  paymentId: z.number().int().positive().optional(),
  orderId: z.number().int().positive().optional()
});

async function initiatePayment(req, res, { readJson, sendJson }) {
  const payload = initiateSchema.parse(await readJson(req));
  const provider = payload.paymentMethod === "cash" ? "cash" : (process.env.PAYMENT_GATEWAY_PROVIDER || "razorpay");

  const searchVal = String(payload.orderId).trim();
  const searchNum = !isNaN(Number(searchVal)) ? Number(searchVal) : -1;
  const prefVal = searchVal.startsWith("ORD-") ? searchVal : `ORD-${searchVal}`;

  const [orderRows] = await pool.query(
    `SELECT id FROM orders WHERE (id = ? OR order_number = ? OR order_number = ?) AND (is_deleted IS NULL OR is_deleted = 0)`,
    [searchNum, searchVal, prefVal]
  );

  const realOrderId = orderRows.length > 0 ? orderRows[0].id : (typeof payload.orderId === 'number' ? payload.orderId : null);

  if (!realOrderId) {
    return sendJson(res, 404, { message: "Order not found" });
  }

  const [result] = await pool.query(
    `INSERT INTO payments
      (order_id, payment_gateway, payment_method, payment_status, amount, gateway_payment_id, paid_at, remarks)
     VALUES (:realOrderId, :provider, :paymentMethod, :paymentStatus, :amount, :gatewayPaymentId, :paidAt, 'Payment initiated')`,
    {
      realOrderId,
      provider,
      paymentMethod: payload.paymentMethod,
      amount: payload.amount,
      gatewayPaymentId: payload.transactionId || null,
      paymentStatus: payload.transactionId ? "paid" : "pending",
      paidAt: payload.transactionId ? new Date() : null
    }
  );

  // If transaction ID provided, mark the order as paid too
  if (payload.transactionId) {
    await pool.query(
      "UPDATE orders SET payment_status = 'paid' WHERE id = :realOrderId",
      { realOrderId }
    );
  }

  sendJson(res, 201, {
    paymentId: Number(result.insertId),
    provider,
    status: "pending",
    supportedMethods: ["upi", "credit_card", "debit_card", "net_banking", "cash"]
  });
}

async function paymentWebhook(req, res, { readJson, sendJson }) {
  const payload = webhookSchema.parse(await readJson(req));

  await pool.query(
    `UPDATE payments
        SET gateway_payment_id = :gatewayPaymentId,
            payment_status = :paymentStatus,
            paid_at = CASE WHEN :paymentStatus = 'paid' THEN NOW() ELSE paid_at END
      WHERE (:paymentId IS NOT NULL AND id = :paymentId)
         OR (:orderId IS NOT NULL AND order_id = :orderId)`,
    {
      gatewayPaymentId: payload.gatewayPaymentId,
      paymentStatus: payload.paymentStatus,
      paymentId: payload.paymentId || null,
      orderId: payload.orderId || null
    }
  );

  if (payload.orderId) {
    await pool.query(
      "UPDATE orders SET payment_status = :paymentStatus WHERE id = :orderId",
      { paymentStatus: payload.paymentStatus, orderId: payload.orderId }
    );
  }

  sendJson(res, 200, { updated: true });
}

module.exports = { initiatePayment, paymentWebhook };
