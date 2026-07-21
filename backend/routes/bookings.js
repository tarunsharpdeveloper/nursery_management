const { z } = require("zod");
const { pool } = require("../db");

// Schema for individual booking item
const bookingItemSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().optional().nullable(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
  lineTotal: z.number().min(0)
});

// Main booking schema with items array
const bookingSchema = z.object({
  bookingNumber: z.string().min(3),
  customerId: z.number().int().positive().optional().nullable(),
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(8)
  }).optional().nullable(),
  items: z.array(bookingItemSchema).min(1, "At least one product is required"),
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
    
    // 1. Create or get customer
    let customerId = payload.customerId;
    if (!customerId && payload.customer) {
      const [customerResult] = await connection.query(
        "INSERT INTO customers (name, phone) VALUES (:name, :phone)",
        payload.customer
      );
      customerId = Number(customerResult.insertId);
    }
    
    const balancePayable = payload.totalBillAmount - payload.advanceAmount;

    // 2. Create main booking record
    const [bookingResult] = await connection.query(
      `INSERT INTO advance_bookings
        (booking_number, customer_id, advance_amount, total_bill_amount,
         balance_payable, booking_date, delivery_date, remarks, status)
       VALUES (:bookingNumber, :customerId, :advanceAmount, :totalBillAmount,
         :balancePayable, CURDATE(), :deliveryDate, :remarks, 'booked')`,
      { 
        bookingNumber: payload.bookingNumber,
        customerId, 
        advanceAmount: payload.advanceAmount,
        totalBillAmount: payload.totalBillAmount,
        balancePayable, 
        deliveryDate: payload.deliveryDate, 
        remarks: payload.remarks || null 
      }
    );
    const bookingId = Number(bookingResult.insertId);

    // 3. Insert booking items and update stock
    for (const item of payload.items) {
      // Insert booking item
      await connection.query(
        `INSERT INTO advance_booking_items
          (booking_id, product_id, variant_id, quantity, unit_price, line_total)
         VALUES (:bookingId, :productId, :variantId, :quantity, :unitPrice, :lineTotal)`,
        {
          bookingId,
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal
        }
      );

      // Update product stock
      if (item.variantId) {
        // Update variant stock
        const [variantStockResult] = await connection.query(
          `UPDATE product_variants
              SET available_quantity = available_quantity - :quantity
            WHERE id = :variantId AND available_quantity >= :quantity`,
          { variantId: item.variantId, quantity: item.quantity }
        );
        
        if (variantStockResult.affectedRows === 0) {
          const [variant] = await connection.query(
            "SELECT pv.*, p.name as product_name FROM product_variants pv JOIN products p ON p.id = pv.product_id WHERE pv.id = :variantId",
            { variantId: item.variantId }
          );
          const variantInfo = variant[0];
          throw new Error(`Not enough stock for ${variantInfo?.product_name} (${variantInfo?.unit_value} ${variantInfo?.unit}). Available: ${variantInfo?.available_quantity || 0}`);
        }
      } else {
        // Update main product stock
        const [stockResult] = await connection.query(
          `UPDATE products
              SET available_quantity = available_quantity - :quantity
            WHERE id = :productId AND available_quantity >= :quantity`,
          { productId: item.productId, quantity: item.quantity }
        );

        if (stockResult.affectedRows === 0) {
          const [product] = await connection.query(
            "SELECT name, available_quantity FROM products WHERE id = :productId",
            { productId: item.productId }
          );
          const productInfo = product[0];
          throw new Error(`Not enough stock for ${productInfo?.name}. Available: ${productInfo?.available_quantity || 0}`);
        }
      }

      // Record in stock ledger
      await connection.query(
        `INSERT INTO stock_ledger (product_id, movement_type, quantity_change, reference_type, reference_id, remarks)
         VALUES (:productId, 'advance_booking', :quantityChange, 'advance_bookings', :bookingId, 'Stock reserved for advance booking')`,
        { productId: item.productId, quantityChange: -item.quantity, bookingId }
      );
    }

    // 4. Record advance payment in customer ledger
    await connection.query(
      `INSERT INTO customer_ledger
        (customer_id, transaction_date, transaction_type, debit_amount, credit_amount, reference_type, reference_id, remarks)
       VALUES (:customerId, CURDATE(), 'advance', 0, :advanceAmount, 'advance_bookings', :bookingId, 'Advance booking payment')`,
      { customerId, advanceAmount: payload.advanceAmount, bookingId }
    );

    await connection.commit();
    sendJson(res, 201, { bookingId, balancePayable, itemsCount: payload.items.length });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { createAdvanceBooking };
