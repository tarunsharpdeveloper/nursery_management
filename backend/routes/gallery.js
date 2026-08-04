const { z } = require("zod");
const { pool } = require("../db");

const gallerySchema = z.object({
  mediaType: z.enum(["image", "video"]).default("image"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  mediaUrl: z.string().min(1, "Media URL is required"),
  thumbnailUrl: z.string().optional(),
  category: z.string().optional().default("General"),
  isActive: z.boolean().optional().default(true)
});

const editGallerySchema = gallerySchema.extend({
  id: z.number().int().positive()
});

async function listGalleryItems(req, res, { sendJson }) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const mediaType = url.searchParams.get("mediaType");
  const category = url.searchParams.get("category");
  const publicOnly = url.searchParams.get("public") === "true";
  const search = url.searchParams.get("search") || "";

  let whereClauses = ["is_deleted = 0"];
  const params = {};

  if (publicOnly) {
    whereClauses.push("is_active = 1");
  }

  if (mediaType && (mediaType === "image" || mediaType === "video")) {
    whereClauses.push("media_type = :mediaType");
    params.mediaType = mediaType;
  }

  if (category) {
    whereClauses.push("category = :category");
    params.category = category;
  }

  if (search) {
    whereClauses.push("(title LIKE :search OR description LIKE :search OR category LIKE :search)");
    params.search = `%${search}%`;
  }

  const whereSql = "WHERE " + whereClauses.join(" AND ");

  const [rows] = await pool.query(
    `SELECT id, media_type, title, description, media_url, thumbnail_url, category, is_active, created_at
       FROM gallery_items
      ${whereSql}
      ORDER BY created_at DESC`,
    params
  );

  sendJson(res, 200, rows);
}

async function createGalleryItem(req, res, { readJson, sendJson }) {
  const payload = gallerySchema.parse(await readJson(req));

  const [result] = await pool.query(
    `INSERT INTO gallery_items
      (media_type, title, description, media_url, thumbnail_url, category, is_active)
     VALUES (:mediaType, :title, :description, :mediaUrl, :thumbnailUrl, :category, :isActive)`,
    {
      mediaType: payload.mediaType,
      title: payload.title,
      description: payload.description || "",
      mediaUrl: payload.mediaUrl,
      thumbnailUrl: payload.thumbnailUrl || payload.mediaUrl,
      category: payload.category || "General",
      isActive: payload.isActive ? 1 : 0
    }
  );

  sendJson(res, 201, {
    id: Number(result.insertId),
    success: true,
    message: `${payload.mediaType === "video" ? "Video" : "Image"} added to gallery successfully`
  });
}

async function editGalleryItem(req, res, { readJson, sendJson }) {
  const payload = editGallerySchema.parse(await readJson(req));

  await pool.query(
    `UPDATE gallery_items
        SET media_type = :mediaType,
            title = :title,
            description = :description,
            media_url = :mediaUrl,
            thumbnail_url = :thumbnailUrl,
            category = :category,
            is_active = :isActive
      WHERE id = :id AND is_deleted = 0`,
    {
      id: payload.id,
      mediaType: payload.mediaType,
      title: payload.title,
      description: payload.description || "",
      mediaUrl: payload.mediaUrl,
      thumbnailUrl: payload.thumbnailUrl || payload.mediaUrl,
      category: payload.category || "General",
      isActive: payload.isActive ? 1 : 0
    }
  );

  sendJson(res, 200, { success: true, message: "Gallery item updated successfully" });
}

async function toggleGalleryItem(req, res, { readJson, sendJson }) {
  const { id } = await readJson(req);
  if (!id) return sendJson(res, 400, { message: "ID is required" });

  await pool.query(
    "UPDATE gallery_items SET is_active = NOT is_active WHERE id = ?",
    [id]
  );

  sendJson(res, 200, { success: true, message: "Gallery item status toggled successfully" });
}

async function deleteGalleryItem(req, res, { readJson, sendJson }) {
  const { id } = await readJson(req);
  if (!id) return sendJson(res, 400, { message: "ID is required" });

  await pool.query(
    "UPDATE gallery_items SET is_deleted = 1 WHERE id = ?",
    [id]
  );

  sendJson(res, 200, { success: true, message: "Gallery item deleted successfully" });
}

module.exports = {
  listGalleryItems,
  createGalleryItem,
  editGalleryItem,
  toggleGalleryItem,
  deleteGalleryItem
};
