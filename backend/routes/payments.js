const { z } = require("zod");
const { pool } = require("../db");

const initiateSchema = z.object({
  orderId: z.number().int().positive(),
  amount: z.number().positive(),
  paymentMethod: z.enum(["upi", "credit_card", "debit_card", "net_banking"])
});

const webhookSchema = z.object({
  gatewayPaymentId: z.string().min(1),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
  paymentId: z.number().int().positive().optional(),
  orderId: z.number().int().positive().optional()
});

async function initiatePayment(req, res, { readJson, sendJson }) {
  const payload = initiateSchema.parse(await readJson(req));
  const provider = process.env.PAYMENT_GATEWAY_PROVIDER || "razorpay";

  const [result] = await pool.query(
    `INSERT INTO payments
      (order_id, payment_gateway, payment_method, payment_status, amount, remarks)
     VALUES (:orderId, :provider, :paymentMethod, 'pending', :amount, 'Payment initiated')`,
    { ...payload, provider }
  );

  sendJson(res, 201, {
    paymentId: Number(result.insertId),
    provider,
    status: "pending",
    supportedMethods: ["upi", "credit_card", "debit_card", "net_banking"]
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
