const { z } = require("zod");
const { pool } = require("../db");
const { sendJson } = require("../http");
const { sendContactConfirmationEmail, sendContactToAdminEmail, sendContactReplyEmail } = require("../email");

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000, "Message must be less than 5000 characters")
});

const replySchema = z.object({
  messageId: z.number().int(),
  reply: z.string().min(5, "Reply must be at least 5 characters")
});

const statusUpdateSchema = z.object({
  messageId: z.number().int(),
  status: z.enum(['new', 'read', 'replied', 'closed'])
});

/**
 * Submit a contact form
 */
async function submitContact(req, res, { readJson, sendJson }) {
  try {
    const payload = contactSchema.parse(await readJson(req));
    
    const [result] = await pool.query(
      `INSERT INTO contact_messages (name, email, phone, message, status) 
       VALUES (:name, :email, :phone, :message, 'new')`,
      {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        message: payload.message
      }
    );

    const messageId = result.insertId;

    // Send confirmation email to customer
    try {
      await sendContactConfirmationEmail({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        messageId
      });
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Continue even if email fails - message is saved in DB
    }

    // Send notification to admin
    try {
      await sendContactToAdminEmail({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        message: payload.message,
        messageId
      });
    } catch (emailError) {
      console.error("Error sending admin notification:", emailError);
      // Continue even if email fails
    }

    sendJson(res, 201, {
      message: "Thank you for contacting us! We will get back to you soon.",
      messageId
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.reduce((acc, err) => {
        acc[err.path[0] || 'form'] = err.message;
        return acc;
      }, {});
      sendJson(res, 400, { error: "Validation failed", fieldErrors });
    } else {
      console.error("Contact submission error:", error);
      sendJson(res, 500, { error: "Failed to submit contact form" });
    }
  }
}

/**
 * Get all contact messages (admin only)
 */
async function listContactMessages(req, res, { sendJson }) {
  try {
    // Extract query parameters from URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 20;
    const offset = (page - 1) * limit;
    const status = url.searchParams.get('status'); // Optional filter

    let query = `SELECT id, name, email, phone, message, status, admin_reply, replied_by, created_at, updated_at FROM contact_messages`;
    let countQuery = `SELECT COUNT(*) as total FROM contact_messages`;
    const params = {};

    if (status && ['new', 'read', 'replied', 'closed'].includes(status)) {
      query += ` WHERE status = :status`;
      countQuery += ` WHERE status = :status`;
      params.status = status;
    }

    query += ` ORDER BY created_at DESC LIMIT :limit OFFSET :offset`;
    params.limit = limit;
    params.offset = offset;

    const [messages] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, status ? { status } : {});
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    sendJson(res, 200, {
      data: messages,
      totalRecords: total,
      totalPages,
      currentPage: page,
      hasMore: page < totalPages
    });
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    sendJson(res, 500, { error: "Failed to fetch contact messages" });
  }
}

/**
 * Get a single contact message
 */
async function getContactMessage(req, res, { readJson, sendJson }) {
  try {
    const { messageId } = await readJson(req);

    if (!messageId) {
      sendJson(res, 400, { error: "Message ID is required" });
      return;
    }

    const [messages] = await pool.query(
      `SELECT id, name, email, phone, message, status, admin_reply, replied_by, created_at, updated_at 
       FROM contact_messages WHERE id = :id`,
      { id: messageId }
    );

    if (!messages.length) {
      sendJson(res, 404, { error: "Message not found" });
      return;
    }

    const message = messages[0];

    // Mark as read if status is new
    if (message.status === 'new') {
      await pool.query(
        `UPDATE contact_messages SET status = 'read', updated_at = NOW() WHERE id = :id`,
        { id: messageId }
      );
      message.status = 'read';
    }

    sendJson(res, 200, { data: message });
  } catch (error) {
    console.error("Error fetching contact message:", error);
    sendJson(res, 500, { error: "Failed to fetch contact message" });
  }
}

/**
 * Reply to a contact message
 */
async function replyToContact(req, res, { readJson, sendJson }) {
  try {
    const user = req.user;
    if (!user) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    const payload = replySchema.parse(await readJson(req));

    // Get the contact message
    const [messages] = await pool.query(
      `SELECT email, name FROM contact_messages WHERE id = :id`,
      { id: payload.messageId }
    );

    if (!messages.length) {
      sendJson(res, 404, { error: "Message not found" });
      return;
    }

    const contactMessage = messages[0];

    // Update with reply
    await pool.query(
      `UPDATE contact_messages 
       SET admin_reply = :reply, status = 'replied', replied_by = :userId, updated_at = NOW()
       WHERE id = :id`,
      {
        reply: payload.reply,
        userId: user.id,
        id: payload.messageId
      }
    );

    // Send reply email to customer
    try {
      await sendContactReplyEmail({
        name: contactMessage.name,
        email: contactMessage.email,
        reply: payload.reply
      });
    } catch (emailError) {
      console.error("Error sending reply email:", emailError);
      // Continue even if email fails
    }

    sendJson(res, 200, { message: "Reply sent successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.reduce((acc, err) => {
        acc[err.path[0] || 'form'] = err.message;
        return acc;
      }, {});
      sendJson(res, 400, { error: "Validation failed", fieldErrors });
    } else {
      console.error("Error replying to contact:", error);
      sendJson(res, 500, { error: "Failed to send reply" });
    }
  }
}

/**
 * Update contact message status
 */
async function updateContactStatus(req, res, { readJson, sendJson }) {
  try {
    const payload = statusUpdateSchema.parse(await readJson(req));

    const [result] = await pool.query(
      `UPDATE contact_messages SET status = :status, updated_at = NOW() WHERE id = :id`,
      {
        status: payload.status,
        id: payload.messageId
      }
    );

    if (result.affectedRows === 0) {
      sendJson(res, 404, { error: "Message not found" });
      return;
    }

    sendJson(res, 200, { message: "Status updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.reduce((acc, err) => {
        acc[err.path[0] || 'form'] = err.message;
        return acc;
      }, {});
      sendJson(res, 400, { error: "Validation failed", fieldErrors });
    } else {
      console.error("Error updating contact status:", error);
      sendJson(res, 500, { error: "Failed to update status" });
    }
  }
}

/**
 * Delete a contact message
 */
async function deleteContact(req, res, { readJson, sendJson }) {
  try {
    const { messageId } = await readJson(req);

    if (!messageId) {
      sendJson(res, 400, { error: "Message ID is required" });
      return;
    }

    const [result] = await pool.query(
      `DELETE FROM contact_messages WHERE id = :id`,
      { id: messageId }
    );

    if (result.affectedRows === 0) {
      sendJson(res, 404, { error: "Message not found" });
      return;
    }

    sendJson(res, 200, { message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact message:", error);
    sendJson(res, 500, { error: "Failed to delete message" });
  }
}

/**
 * Get contact message statistics
 */
async function getContactStats(req, res, { sendJson }) {
  try {
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied_count,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count
       FROM contact_messages`
    );

    sendJson(res, 200, { data: stats[0] });
  } catch (error) {
    console.error("Error fetching contact stats:", error);
    sendJson(res, 500, { error: "Failed to fetch contact statistics" });
  }
}

module.exports = {
  submitContact,
  listContactMessages,
  getContactMessage,
  replyToContact,
  updateContactStatus,
  deleteContact,
  getContactStats
};
