const { z } = require("zod");
const { pool } = require("../db");

async function listProducts(_req, res, { sendJson }) {
  const [products] = await pool.query(
    `SELECT p.id, p.category_id, p.product_type, p.name, p.description, 
            p.selling_price, p.actual_price, p.available_quantity,
            p.unit, p.photo_url, p.media_urls, p.is_active, 
            p.created_at, p.updated_at,
            c.name AS category
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.is_deleted = 0
       ORDER BY p.created_at DESC`
  );

  const [variants] = await pool.query(
    `SELECT id, product_id, unit, unit_value, actual_price, selling_price, available_quantity 
     FROM product_variants`
  );

  const formattedRows = products.map(p => {
    const pVariants = variants.filter(v => v.product_id === p.id);
    return {
      ...p,
      variants: pVariants
    };
  });

  sendJson(res, 200, formattedRows);
}

const getProductSchema = z.object({
  productId: z.number().int().positive()
});

async function getProduct(req, res, { readJson, sendJson }) {
  const payload = getProductSchema.parse(await readJson(req));
  
  const [rows] = await pool.query(
    `SELECT p.id, p.category_id, p.product_type, p.name, p.description, 
            p.selling_price, p.actual_price, p.available_quantity,
            p.unit, p.photo_url, p.media_urls, p.is_active, 
            p.created_at, p.updated_at,
            c.name AS category
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = ? AND p.is_deleted = 0`,
    [payload.productId]
  );

  if (rows.length === 0) {
    throw new Error("Product not found");
  }

  const p = rows[0];

  const [variants] = await pool.query(
    `SELECT id, product_id, unit, unit_value, actual_price, selling_price, available_quantity 
     FROM product_variants
     WHERE product_id = ?`,
    [payload.productId]
  );

  p.variants = variants || [];

  sendJson(res, 200, p);
}

const variantSchema = z.object({
  unit: z.string().optional().nullable(),
  unitValue: z.string().optional().nullable(),
  actualPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  availableQuantity: z.number().int().min(0)
});

const productSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  sellingPrice: z.number().min(0),
  actualPrice: z.number().min(0),
  availableQuantity: z.number().int().min(0),
  unit: z.string().optional().nullable(),
  mediaUrls: z.string().min(2),
  variants: z.array(variantSchema).optional().default([])
});

async function createProduct(req, res, { readJson, sendJson }) {
  const payload = productSchema.parse(await readJson(req));
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO products
        (category_id, product_type, name, description, selling_price, actual_price, available_quantity, unit, media_urls)
       VALUES (:categoryId, 'plant', :name, :description, :sellingPrice, :actualPrice, :availableQuantity, :unit, :mediaUrls)`,
      {
        categoryId: payload.categoryId,
        name: payload.name,
        description: payload.description,
        sellingPrice: payload.sellingPrice,
        actualPrice: payload.actualPrice,
        availableQuantity: payload.availableQuantity,
        unit: payload.unit || null,
        mediaUrls: payload.mediaUrls
      }
    );

    const productId = result.insertId;

    for (const v of payload.variants) {
      await connection.query(
        `INSERT INTO product_variants
          (product_id, unit, unit_value, actual_price, selling_price, available_quantity)
         VALUES (:productId, :unit, :unitValue, :actualPrice, :sellingPrice, :availableQuantity)`,
        {
          productId,
          unit: v.unit || null,
          unitValue: v.unitValue || null,
          actualPrice: v.actualPrice,
          sellingPrice: v.sellingPrice,
          availableQuantity: v.availableQuantity
        }
      );
    }

    if (payload.availableQuantity > 0) {
      const today = new Date().toISOString().split("T")[0];
      const [entryResult] = await connection.query(
        `INSERT INTO production_entries
          (product_id, category_id, production_type, production_date, quantity_produced, remarks)
         VALUES (:productId, :categoryId, 'plant', :productionDate, :quantityProduced, 'Initial stock on product creation')`,
        {
          productId,
          categoryId: payload.categoryId,
          productionDate: today,
          quantityProduced: payload.availableQuantity
        }
      );

      const productionId = entryResult.insertId;

      await connection.query(
        `INSERT INTO stock_ledger
          (product_id, movement_type, quantity_change, reference_type, reference_id, remarks)
         VALUES (:productId, 'production', :quantityProduced, 'production_entries', :productionId, 'Initial stock on product creation')`,
        { 
          productId, 
          quantityProduced: payload.availableQuantity, 
          productionId 
        }
      );
    }

    await connection.commit();
    sendJson(res, 201, { productId: Number(productId) });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const editProductSchema = z.object({
  productId: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  sellingPrice: z.number().min(0),
  actualPrice: z.number().min(0),
  availableQuantity: z.number().int().min(0),
  unit: z.string().optional().nullable(),
  mediaUrls: z.string().min(2),
  variants: z.array(variantSchema).optional().default([])
});

async function editProduct(req, res, { readJson, sendJson }) {
  const payload = editProductSchema.parse(await readJson(req));
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE products 
          SET category_id = :categoryId,
              name = :name, 
              description = :description,
              selling_price = :sellingPrice,
              actual_price = :actualPrice,
              available_quantity = :availableQuantity,
              unit = :unit,
              media_urls = :mediaUrls
        WHERE id = :productId`,
      {
        productId: payload.productId,
        categoryId: payload.categoryId,
        name: payload.name,
        description: payload.description,
        sellingPrice: payload.sellingPrice,
        actualPrice: payload.actualPrice,
        availableQuantity: payload.availableQuantity,
        unit: payload.unit || null,
        mediaUrls: payload.mediaUrls
      }
    );

    // Delete existing variants and re-insert
    await connection.query("DELETE FROM product_variants WHERE product_id = :productId", { productId: payload.productId });

    for (const v of payload.variants) {
      await connection.query(
        `INSERT INTO product_variants
          (product_id, unit, unit_value, actual_price, selling_price, available_quantity)
         VALUES (:productId, :unit, :unitValue, :actualPrice, :sellingPrice, :availableQuantity)`,
        {
          productId: payload.productId,
          unit: v.unit || null,
          unitValue: v.unitValue || null,
          actualPrice: v.actualPrice,
          sellingPrice: v.sellingPrice,
          availableQuantity: v.availableQuantity
        }
      );
    }

    await connection.commit();
    sendJson(res, 200, { updated: true });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const toggleProductSchema = z.object({
  productId: z.number().int().positive(),
  isActive: z.boolean()
});

async function toggleProduct(req, res, { readJson, sendJson }) {
  const payload = toggleProductSchema.parse(await readJson(req));
  await pool.query(
    "UPDATE products SET is_active = :isActive WHERE id = :productId",
    payload
  );
  sendJson(res, 200, { updated: true });
}

const deleteProductSchema = z.object({
  productId: z.number().int().positive()
});

async function deleteProduct(req, res, { readJson, sendJson }) {
  const payload = deleteProductSchema.parse(await readJson(req));
  await pool.query(
    "UPDATE products SET is_deleted = 1 WHERE id = :productId",
    payload
  );
  sendJson(res, 200, { deleted: true });
}

module.exports = { listProducts, getProduct, createProduct, editProduct, toggleProduct, deleteProduct };
