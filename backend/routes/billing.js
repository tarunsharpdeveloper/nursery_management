const { z } = require("zod");
const { pool } = require("../db");

const billingSchema = z.object({
  customerId: z.number().int().positive().optional().nullable(),
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().optional().nullable()
  }).optional().nullable(),
  billType: z.enum(["cash_sale", "credit_sale"]),
  paymentType: z.enum(["cash", "upi", "credit"]),
  transactionId: z.string().optional().nullable(),
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      variantId: z.number().int().positive().optional().nullable(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().min(0)
    })
  ).min(1),
  createdBy: z.number().int().positive().optional().nullable()
});

async function createBill(req, res, { readJson, sendJson }) {
  const payload = billingSchema.parse(await readJson(req));
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let customerId = payload.customerId;
    if (!customerId) {
      const [customerResult] = await connection.query(
        "INSERT INTO customers (name, phone, is_credit_customer) VALUES (:name, :phone, :isCreditCustomer)",
        { ...payload.customer, isCreditCustomer: payload.billType === "credit_sale", phone: payload.customer?.phone || "" }
      );
      customerId = Number(customerResult.insertId);
    }
    const totalAmount = payload.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const paidAmount = payload.paymentType === "credit" ? 0 : totalAmount;
    const balanceAmount = totalAmount - paidAmount;

    const [billResult] = await connection.query(
      `INSERT INTO bills
        (customer_id, bill_number, bill_type, payment_type, bill_date, total_amount, paid_amount, balance_amount, created_by)
       VALUES (:customerId, :billNumber, :billType, :paymentType, CURDATE(), :totalAmount, :paidAmount, :balanceAmount, :createdBy)`,
      {
        customerId,
        billNumber: `BILL-${Date.now()}`,
        billType: payload.billType,
        paymentType: payload.paymentType,
        totalAmount,
        paidAmount,
        balanceAmount,
        createdBy: payload.createdBy || null
      }
    );
    const billId = Number(billResult.insertId);

    for (const item of payload.items) {
      await connection.query(
        `INSERT INTO bill_items (bill_id, product_id, quantity, unit_price, line_total)
         VALUES (:billId, :productId, :quantity, :unitPrice, :lineTotal)`,
        { ...item, billId, lineTotal: item.quantity * item.unitPrice }
      );
      await connection.query(
        "UPDATE products SET available_quantity = available_quantity - :quantity WHERE id = :productId",
        item
      );
      await connection.query(
        `INSERT INTO stock_ledger (product_id, movement_type, quantity_change, reference_type, reference_id, remarks, created_by)
         VALUES (:productId, 'sale', :quantityChange, 'bills', :billId, 'Offline billing sale', :createdBy)`,
        { productId: item.productId, quantityChange: -item.quantity, billId, createdBy: payload.createdBy || null }
      );
    }

    await connection.query(
      `INSERT INTO customer_ledger
        (customer_id, transaction_date, transaction_type, debit_amount, credit_amount, reference_type, reference_id, remarks)
       VALUES (:customerId, CURDATE(), 'purchase', :totalAmount, 0, 'bills', :billId, 'Offline bill')`,
      { customerId, totalAmount, billId }
    );

    if (paidAmount > 0) {
      await connection.query(
        `INSERT INTO customer_ledger
          (customer_id, transaction_date, transaction_type, debit_amount, credit_amount, reference_type, reference_id, remarks)
         VALUES (:customerId, CURDATE(), 'payment', 0, :paidAmount, 'bills', :billId, 'Payment received')`,
        { customerId, paidAmount, billId }
      );

      await connection.query(
        `INSERT INTO payments
          (bill_id, payment_method, payment_status, amount, paid_at, gateway_payment_id)
         VALUES (:billId, :paymentType, 'paid', :paidAmount, NOW(), :transactionId)`,
        {
          billId,
          paymentType: payload.paymentType,
          paidAmount,
          transactionId: payload.transactionId || null
        }
      );
    }

    await connection.commit();
    sendJson(res, 201, { billId, totalAmount, paidAmount, balanceAmount });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { createBill };
