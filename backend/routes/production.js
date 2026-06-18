const { z } = require("zod");
const { pool } = require("../db");

const productionSchema = z.object({
  productId: z.number().int().positive(),
  productionType: z.enum(["plant", "seed"]),
  productionDate: z.string().min(10),
  quantityProduced: z.number().int().positive(),
  remarks: z.string().optional(),
  createdBy: z.number().int().positive().optional()
});

async function createProduction(req, res, { readJson, sendJson }) {
  const payload = productionSchema.parse(await readJson(req));
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [entryResult] = await connection.query(
      `INSERT INTO production_entries
        (product_id, production_type, production_date, quantity_produced, remarks, created_by)
       VALUES (:productId, :productionType, :productionDate, :quantityProduced, :remarks, :createdBy)`,
      { ...payload, remarks: payload.remarks || null, createdBy: payload.createdBy || null }
    );
    const productionId = Number(entryResult.insertId);

    await connection.query(
      "UPDATE products SET available_quantity = available_quantity + :quantityProduced WHERE id = :productId",
      payload
    );
    await connection.query(
      `INSERT INTO stock_ledger
        (product_id, movement_type, quantity_change, reference_type, reference_id, remarks, created_by)
       VALUES (:productId, 'production', :quantityProduced, 'production_entries', :productionId, :remarks, :createdBy)`,
      { ...payload, productionId, remarks: payload.remarks || null, createdBy: payload.createdBy || null }
    );

    await connection.commit();
    sendJson(res, 201, { productionId });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { createProduction };
