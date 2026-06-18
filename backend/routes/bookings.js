const { z } = require("zod");
const { pool } = require("../db");

const bookingSchema = z.object({
  bookingNumber: z.string().min(3),
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(8)
  }),
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  advanceAmount: z.number().min(0),
  totalBillAmount: z.number().min(0),
  deliveryDate: z.string().min(10),
  remarks: z.string().optional()
});

async function createAdvanceBooking(req, res, { readJson, sendJson }) {
  const payload = bookingSchema.parse(await readJson(req));
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [customerResult] = await connection.query(
      "INSERT INTO customers (name, phone) VALUES (:name, :phone)",
      payload.customer
    );
    const customerId = Number(customerResult.insertId);
    const balancePayable = payload.totalBillAmount - payload.advanceAmount;

    const [bookingResult] = await connection.query(
      `INSERT INTO advance_bookings
        (booking_number, customer_id, product_id, quantity, advance_amount, total_bill_amount,
         balance_payable, booking_date, delivery_date, remarks, status)
       VALUES (:bookingNumber, :customerId, :productId, :quantity, :advanceAmount, :totalBillAmount,
         :balancePayable, CURDATE(), :deliveryDate, :remarks, 'booked')`,
      { ...payload, customerId, balancePayable, remarks: payload.remarks || null }
    );
    const bookingId = Number(bookingResult.insertId);

    await connection.query(
      `INSERT INTO customer_ledger
        (customer_id, transaction_date, transaction_type, debit_amount, credit_amount, reference_type, reference_id, remarks)
       VALUES (:customerId, CURDATE(), 'advance', 0, :advanceAmount, 'advance_bookings', :bookingId, 'Advance booking amount')`,
      { customerId, advanceAmount: payload.advanceAmount, bookingId }
    );

    await connection.commit();
    sendJson(res, 201, { bookingId, balancePayable });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { createAdvanceBooking };
