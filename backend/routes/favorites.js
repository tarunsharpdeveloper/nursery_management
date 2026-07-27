const { pool } = require("../db");
const { authenticate } = require("../auth");

async function getFavorites(req, res, { sendJson }) {
  const user = req.user || authenticate(req);
  const userId = user?.id || user?.userId;
  console.log("GET /api/favorites called for userId:", userId || "Guest");
  if (!userId) {
    sendJson(res, 200, { favoriteIds: [], favorites: [] });
    return;
  }

  try {
    // Fetch product details for user's favorites
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.product_type, c.name AS category, p.description, 
              p.selling_price, p.actual_price, p.available_quantity, p.unit, 
              p.photo_url, p.media_urls, p.is_active, f.created_at AS favorited_at,
              COALESCE(r.total_reviews, 0) AS total_reviews,
              COALESCE(r.average_rating, 0) AS average_rating
         FROM favorites f
         JOIN products p ON p.id = f.product_id
         JOIN categories c ON c.id = p.category_id
         LEFT JOIN (
           SELECT product_id,
                  COUNT(*) AS total_reviews,
                  ROUND(AVG(rating), 1) AS average_rating
             FROM reviews
            WHERE is_approved = 1
            GROUP BY product_id
         ) r ON r.product_id = p.id
        WHERE f.user_id = :userId AND p.is_active = TRUE AND p.is_deleted = 0
        ORDER BY f.created_at DESC`,
      { userId: userId }
    );

    const favoriteIds = rows.map((row) => row.id);

    sendJson(res, 200, {
      favoriteIds,
      favorites: rows
    });
  } catch (error) {
    sendJson(res, 500, { message: "Failed to fetch favorites", error: error.message });
  }
}

async function toggleFavorite(req, res, { readJson, sendJson }) {
  const body = await readJson(req).catch(() => ({}));
  const user = req.user || authenticate(req);
  const userId = user?.id || user?.userId;
  const productId = body?.productId;

  console.log("POST /api/favorites/toggle called for userId:", userId || "Guest", "productId:", productId);

  if (!userId) {
    sendJson(res, 200, {
      isFavorite: false,
      message: "Please login to add items to your favourites!",
      favoriteIds: []
    });
    return;
  }

  if (!productId) {
    sendJson(res, 400, { message: "productId is required" });
    return;
  }

  try {
    const numProductId = Number(productId);
    
    // Check if favorite exists
    const [existing] = await pool.query(
      "SELECT id FROM favorites WHERE user_id = :userId AND product_id = :productId LIMIT 1",
      { userId: userId, productId: numProductId }
    );

    if (existing.length > 0) {
      // Remove from favorites
      await pool.query(
        "DELETE FROM favorites WHERE user_id = :userId AND product_id = :productId",
        { userId: userId, productId: numProductId }
      );

      const [remaining] = await pool.query(
        "SELECT product_id FROM favorites WHERE user_id = :userId",
        { userId: userId }
      );
      const favoriteIds = remaining.map((r) => r.product_id);

      sendJson(res, 200, {
        isFavorite: false,
        message: "Removed from favorites",
        favoriteIds
      });
    } else {
      // Add to favorites
      await pool.query(
        "INSERT INTO favorites (user_id, product_id) VALUES (:userId, :productId)",
        { userId: userId, productId: numProductId }
      );

      const [remaining] = await pool.query(
        "SELECT product_id FROM favorites WHERE user_id = :userId",
        { userId: userId }
      );
      const favoriteIds = remaining.map((r) => r.product_id);

      sendJson(res, 200, {
        isFavorite: true,
        message: "Added to favorites",
        favoriteIds
      });
    }
  } catch (error) {
    sendJson(res, 500, { message: "Failed to toggle favorite", error: error.message });
  }
}

module.exports = {
  getFavorites,
  toggleFavorite
};
