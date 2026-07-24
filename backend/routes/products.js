const { z } = require("zod");
const { pool } = require("../db");

async function listProducts(req, res, { sendJson }) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "100", 10); // Default 100 if unspecified
  const search = url.searchParams.get("search") || "";
  const category = url.searchParams.get("category") || "";
  const type = url.searchParams.get("type") || url.searchParams.get("product_type") || "";
  const sort = url.searchParams.get("sort") || url.searchParams.get("sortBy") || "";
  const filterKey = url.searchParams.get("filterKey");
  const filterValue = url.searchParams.get("filterValue");

  let whereClause = "WHERE p.is_deleted = 0";
  const params = {};

  if (search) {
    whereClause += " AND (p.name LIKE :search OR p.description LIKE :search OR c.name LIKE :search OR p_cat.name LIKE :search)";
    params.search = `%${search}%`;
  }

  if (category) {
    whereClause += " AND (LOWER(c.name) = LOWER(:category) OR c.id = :categoryId OR LOWER(p_cat.name) = LOWER(:category) OR p_cat.id = :categoryId)";
    params.category = category;
    params.categoryId = isNaN(Number(category)) ? -1 : Number(category);
  }

  if (type && type !== "all") {
    const cleanType = type.trim().toLowerCase();
    whereClause += " AND (LOWER(p.product_type) LIKE :typePattern OR LOWER(c.category_type) LIKE :typePattern OR LOWER(c.name) LIKE :typePattern OR LOWER(p_cat.name) LIKE :typePattern)";
    params.typePattern = `%${cleanType}%`;
  }

  if (filterKey === "stock_status" && filterValue) {
    if (filterValue === "in_stock") {
      whereClause += " AND p.available_quantity > 0";
    } else if (filterValue === "out_of_stock") {
      whereClause += " AND p.available_quantity <= 0";
    }
  } else if (filterKey === "status" && filterValue) {
    whereClause += " AND p.is_active = :isActive";
    params.isActive = filterValue === "active" ? 1 : 0;
  }

  let orderClause = "ORDER BY p.created_at DESC";
  if (sort === "price-low") {
    orderClause = "ORDER BY p.selling_price ASC";
  } else if (sort === "price-high") {
    orderClause = "ORDER BY p.selling_price DESC";
  } else if (sort === "stock") {
    orderClause = "ORDER BY p.available_quantity DESC";
  } else if (sort === "name") {
    orderClause = "ORDER BY p.name ASC";
  } else if (sort === "rating") {
    orderClause = "ORDER BY average_rating DESC";
  }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total 
       FROM products p 
       JOIN categories c ON c.id = p.category_id 
       LEFT JOIN categories p_cat ON p_cat.id = c.parent_id
       ${whereClause}`,
    params
  );

  const offset = (page - 1) * limit;
  params.limit = limit;
  params.offset = offset;

  const [products] = await pool.query(
    `SELECT p.id, p.category_id, p.product_type, p.name, p.description, 
            p.selling_price, p.actual_price, p.available_quantity,
            p.unit, p.photo_url, p.media_urls, p.is_active, 
            p.created_at, p.updated_at,
            c.name AS category,
            COALESCE(r.total_reviews, 0) AS total_reviews,
            COALESCE(r.average_rating, 0) AS average_rating
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN categories p_cat ON p_cat.id = c.parent_id
       LEFT JOIN (
         SELECT product_id,
                COUNT(*) AS total_reviews,
                ROUND(AVG(rating), 1) AS average_rating
           FROM reviews
          WHERE is_approved = 1
          GROUP BY product_id
       ) r ON r.product_id = p.id
       ${whereClause}
       ${orderClause}
       LIMIT :limit OFFSET :offset`,
    params
  );

  let formattedRows = products.map(p => ({
    ...p,
    total_reviews: Number(p.total_reviews || 0),
    average_rating: Number(p.average_rating || 0)
  }));

  if (products.length > 0) {
    const productIds = products.map(p => p.id);
    const [variants] = await pool.query(
      `SELECT id, product_id, unit, unit_value, actual_price, selling_price, available_quantity 
       FROM product_variants
       WHERE product_id IN (?)`,
      [productIds]
    );

    formattedRows = formattedRows.map(p => {
      const pVariants = variants.filter(v => v.product_id === p.id);
      return {
        ...p,
        variants: pVariants
      };
    });
  }

  if (url.searchParams.has("page") || url.searchParams.has("limit")) {
    const totalPages = Math.ceil(total / limit) || 1;
    sendJson(res, 200, {
      data: formattedRows,
      totalRecords: total,
      totalPages: totalPages,
      currentPage: page,
      hasMore: page < totalPages
    });
  } else {
    sendJson(res, 200, formattedRows);
  }
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
            c.name AS category,
            COALESCE(r.total_reviews, 0) AS total_reviews,
            COALESCE(r.average_rating, 0) AS average_rating
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN (
         SELECT product_id,
                COUNT(*) AS total_reviews,
                ROUND(AVG(rating), 1) AS average_rating
           FROM reviews
          WHERE is_approved = 1
          GROUP BY product_id
       ) r ON r.product_id = p.id
       WHERE p.id = ? AND p.is_deleted = 0`,
    [payload.productId]
  );

  if (rows.length === 0) {
    throw new Error("Product not found");
  }

  const p = {
    ...rows[0],
    total_reviews: Number(rows[0].total_reviews || 0),
    average_rating: Number(rows[0].average_rating || 0)
  };

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

    const [[catRow]] = await connection.query(
      `SELECT category_type FROM categories WHERE id = :categoryId`,
      { categoryId: payload.categoryId }
    );
    const resolvedProductType = catRow?.category_type || 'plant';

    const [result] = await connection.query(
      `INSERT INTO products
        (category_id, product_type, name, description, selling_price, actual_price, available_quantity, unit, media_urls)
       VALUES (:categoryId, :productType, :name, :description, :sellingPrice, :actualPrice, :availableQuantity, :unit, :mediaUrls)`,
      {
        categoryId: payload.categoryId,
        productType: resolvedProductType,
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
