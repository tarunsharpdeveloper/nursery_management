const { z } = require("zod");
const { pool } = require("../db");

const dispatchSchema = z.object({
  orderId: z.number().int().positive().optional(),
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
  const [result] = await pool.query(
    `INSERT INTO dispatches
      (order_id, dispatch_type, dispatch_date, status, bus_number, driver_name, driver_mobile,
       bus_photo_url, courier_company, docket_number, remarks)
     VALUES (:orderId, :dispatchType, :dispatchDate, :status, :busNumber, :driverName, :driverMobile,
       :busPhotoUrl, :courierCompany, :docketNumber, :remarks)`,
    {
      orderId: payload.orderId || null,
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

  sendJson(res, 201, { dispatchId: Number(result.insertId) });
}

module.exports = { createDispatch };
