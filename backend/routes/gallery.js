const { z } = require("zod");
const { pool } = require("../db");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

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

/**
 * Generate video thumbnail using ffmpeg
 * Extracts a frame from the video at 1 second mark
 */
async function generateVideoThumbnail(videoPath) {
  return new Promise((resolve, reject) => {
    // Check if ffmpeg is available
    const ffmpegCommand = process.platform === 'win32' ? 'ffmpeg' : 'ffmpeg';
    
    const timestamp = Date.now();
    const thumbnailFilename = `thumb-${timestamp}.jpg`;
    const thumbnailPath = path.join(__dirname, '../uploads', thumbnailFilename);
    
    // Extract frame at 1 second (00:00:01)
    const cmd = `${ffmpegCommand} -i "${videoPath}" -ss 00:00:01 -vf "scale=320:240" -vframes 1 "${thumbnailPath}" -y`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error('FFmpeg error:', error.message);
        // Return null if ffmpeg is not available or fails
        return resolve(null);
      }
      
      // Return just the filename (will be prefixed with /uploads/)
      resolve(thumbnailFilename);
    });
  });
}

/**
 * Generate Canvas-based video thumbnail (fallback for client-side)
 * This creates a simple placeholder if ffmpeg is not available
 */
function createFallbackThumbnail() {
  const timestamp = Date.now();
  const randomColor = Math.floor(Math.random()*16777215).toString(16);
  // Return a data URL that will be stored as a reference
  return `placeholder-${timestamp}`;
}

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

  let thumbnailUrl = payload.thumbnailUrl;

  // For videos, try to generate a thumbnail if none provided
  if (payload.mediaType === "video" && !thumbnailUrl) {
    const videoUrl = payload.mediaUrl;
    
    // If it's a local file path, try to generate thumbnail
    if (!videoUrl.startsWith('http')) {
      const videoPath = path.join(__dirname, '../', videoUrl);
      if (fs.existsSync(videoPath)) {
        try {
          const generatedThumb = await generateVideoThumbnail(videoPath);
          if (generatedThumb) {
            thumbnailUrl = generatedThumb;
            console.log('Generated video thumbnail:', thumbnailUrl);
          } else {
            thumbnailUrl = payload.mediaUrl; // Fallback to video itself
          }
        } catch (error) {
          console.error('Thumbnail generation failed:', error);
          thumbnailUrl = payload.mediaUrl;
        }
      } else {
        thumbnailUrl = payload.mediaUrl;
      }
    } else {
      // For YouTube or remote URLs, it will be handled in frontend
      thumbnailUrl = payload.mediaUrl;
    }
  }

  const [result] = await pool.query(
    `INSERT INTO gallery_items
      (media_type, title, description, media_url, thumbnail_url, category, is_active)
     VALUES (:mediaType, :title, :description, :mediaUrl, :thumbnailUrl, :category, :isActive)`,
    {
      mediaType: payload.mediaType,
      title: payload.title,
      description: payload.description || "",
      mediaUrl: payload.mediaUrl,
      thumbnailUrl: thumbnailUrl || payload.mediaUrl,
      category: payload.category || "General",
      isActive: payload.isActive ? 1 : 0
    }
  );

  sendJson(res, 201, {
    id: Number(result.insertId),
    success: true,
    message: `${payload.mediaType === "video" ? "Video" : "Image"} added to gallery successfully`,
    thumbnailGenerated: thumbnailUrl && thumbnailUrl !== payload.mediaUrl
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

async function updateVideoThumbnail(req, res, { readJson, sendJson }) {
  const { id, thumbnailUrl } = await readJson(req);
  
  if (!id) return sendJson(res, 400, { message: "Gallery item ID is required" });
  if (!thumbnailUrl) return sendJson(res, 400, { message: "Thumbnail URL is required" });

  // Verify the item exists and is a video
  const [items] = await pool.query(
    "SELECT media_type FROM gallery_items WHERE id = ? AND is_deleted = 0",
    [id]
  );

  if (!items.length) {
    return sendJson(res, 404, { message: "Gallery item not found" });
  }

  if (items[0].media_type !== 'video') {
    return sendJson(res, 400, { message: "Thumbnail update is only allowed for video items" });
  }

  // Update the thumbnail URL
  await pool.query(
    "UPDATE gallery_items SET thumbnail_url = ? WHERE id = ? AND is_deleted = 0",
    [thumbnailUrl, id]
  );

  sendJson(res, 200, { 
    success: true, 
    message: "Video thumbnail updated successfully",
    thumbnailUrl: thumbnailUrl
  });
}

module.exports = {
  listGalleryItems,
  createGalleryItem,
  editGalleryItem,
  toggleGalleryItem,
  deleteGalleryItem,
  updateVideoThumbnail
};
