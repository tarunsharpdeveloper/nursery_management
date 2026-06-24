const { z } = require("zod");
const { pool } = require("../db");

const dispatchSchema = z.object({
  orderId: z.number().int().positive().optional().nullable(),
  advanceBookingId: z.number().int().positive().optional().nullable(),
  dispatchType: z.enum(["bus", "courier"]),
  dispatchDate: z.string().min(10),
  status: z.enum(["pending", "dispatched", "delivered"]),
  busNumber: z.string().optional(),
  driverName: z.string().optional(),
  driverMobile: z.string().optional(),
  busPhotoUrl: z.string().optional(),
  courierCompany: z.string().optional(),
  docketNumber: z.string().optional(),
  remarks: z.string().optional()
});

async function createDispatch(req, res, { readJson, sendJson }) {
  const payload = dispatchSchema.parse(await readJson(req));
  
  if (!payload.orderId && !payload.advanceBookingId) {
    throw new Error("Dispatch must be linked to either an Order or an Advance Booking");
  }

  const [result] = await pool.query(
    `INSERT INTO dispatches
      (order_id, advance_booking_id, dispatch_type, dispatch_date, status, bus_number, driver_name, driver_mobile,
       bus_photo_url, courier_company, docket_number, remarks)
     VALUES (:orderId, :advanceBookingId, :dispatchType, :dispatchDate, :status, :busNumber, :driverName, :driverMobile,
       :busPhotoUrl, :courierCompany, :docketNumber, :remarks)`,
    {
      orderId: payload.orderId || null,
      advanceBookingId: payload.advanceBookingId || null,
      dispatchType: payload.dispatchType,
      dispatchDate: payload.dispatchDate,
      status: payload.status,
      busNumber: payload.busNumber || null,
      driverName: payload.driverName || null,
      driverMobile: payload.driverMobile || null,
      busPhotoUrl: payload.busPhotoUrl || null,
      courierCompany: payload.courierCompany || null,
      docketNumber: payload.docketNumber || null,
      remarks: payload.remarks || null
    }
  );

  // Sync statuses
  if (payload.status === "dispatched" || payload.status === "delivered") {
    if (payload.orderId) {
      const newStatus = payload.status === "delivered" ? "delivered" : "shipped";
      await pool.query("UPDATE orders SET status = :newStatus WHERE id = :orderId", { newStatus, orderId: payload.orderId });
    } else if (payload.advanceBookingId) {
      const newStatus = payload.status === "delivered" ? "delivered" : "ready";
      await pool.query("UPDATE advance_bookings SET status = :newStatus WHERE id = :bookingId", { newStatus, bookingId: payload.advanceBookingId });
    }
  }

  sendJson(res, 201, { dispatchId: Number(result.insertId) });
}

module.exports = { createDispatch };
