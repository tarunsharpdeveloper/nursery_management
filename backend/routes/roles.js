const { z } = require("zod");
const { pool } = require("../db");

async function listRoles(req, res, { sendJson }) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const search = url.searchParams.get("search") || "";

  let whereClause = "WHERE is_deleted = 0";
  const params = {};

  if (search) {
    whereClause += " AND name LIKE :search";
    params.search = `%${search}%`;
  }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM roles ${whereClause}`,
    params
  );

  const offset = (page - 1) * limit;
  params.limit = limit;
  params.offset = offset;

  const [rows] = await pool.query(
    `SELECT id, name, permissions
       FROM roles
      ${whereClause}
      ORDER BY id ASC
      LIMIT :limit OFFSET :offset`,
    params
  );
  
  const roles = rows.map(r => ({
    ...r,
    permissions: r.permissions ? (typeof r.permissions === "string" ? JSON.parse(r.permissions) : r.permissions) : []
  }));
  
  if (url.searchParams.has("page")) {
    sendJson(res, 200, {
      data: roles,
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } else {
    sendJson(res, 200, roles);
  }
}

const roleSchema = z.object({
  name: z.string().min(2),
  permissions: z.array(z.string()).default([])
});

async function createRole(req, res, { readJson, sendJson }) {
  const payload = roleSchema.parse(await readJson(req));
  
  const [existing] = await pool.query("SELECT id FROM roles WHERE name = :name AND is_deleted = 0 LIMIT 1", { name: payload.name });
  if (existing.length > 0) {
    sendJson(res, 400, { message: "Role name already exists" });
    return;
  }

  const [result] = await pool.query(
    "INSERT INTO roles (name, permissions) VALUES (:name, :permissions)",
    { name: payload.name, permissions: JSON.stringify(payload.permissions) }
  );

  sendJson(res, 201, { id: result.insertId, message: "Role created successfully" });
}

const editRoleSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(2),
  permissions: z.array(z.string()).default([])
});

async function editRole(req, res, { readJson, sendJson }) {
  const payload = editRoleSchema.parse(await readJson(req));

  const [existing] = await pool.query("SELECT id FROM roles WHERE name = :name AND id != :id AND is_deleted = 0", { name: payload.name, id: payload.id });
  if (existing.length > 0) {
    sendJson(res, 400, { message: "Role name already exists" });
    return;
  }

  await pool.query(
    "UPDATE roles SET name = :name, permissions = :permissions WHERE id = :id",
    { name: payload.name, permissions: JSON.stringify(payload.permissions), id: payload.id }
  );

  sendJson(res, 200, { updated: true });
}

const deleteRoleSchema = z.object({
  roleId: z.number().int().positive()
});

async function deleteRole(req, res, { readJson, sendJson }) {
  const payload = deleteRoleSchema.parse(await readJson(req));
  
  // check if in use
  const [users] = await pool.query("SELECT id FROM users WHERE role_id = :roleId LIMIT 1", { roleId: payload.roleId });
  if (users.length > 0) {
    sendJson(res, 400, { message: "Cannot delete role because it is assigned to one or more users." });
    return;
  }

  await pool.query("UPDATE roles SET is_deleted = 1 WHERE id = :roleId", payload);
  sendJson(res, 200, { deleted: true });
}

module.exports = { listRoles, createRole, editRole, deleteRole };
