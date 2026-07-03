const { z } = require("zod");
const { pool } = require("../db");
const { hashPassword } = require("../auth");

async function listUsers(req, res, { sendJson }) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const search = url.searchParams.get("search") || "";
  const filterKey = url.searchParams.get("filterKey");
  const filterValue = url.searchParams.get("filterValue");

  let whereClause = "WHERE is_deleted = 0";
  const params = {};

  if (search) {
    whereClause += " AND (name LIKE :search OR email LIKE :search)";
    params.search = `%${search}%`;
  }

  if (filterKey === "role" && filterValue) {
    whereClause += " AND role = :role";
    params.role = filterValue;
  } else if (filterKey === "status" && filterValue) {
    whereClause += " AND is_active = :isActive";
    params.isActive = filterValue === "active" ? 1 : 0;
  }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM users ${whereClause}`,
    params
  );

  const offset = (page - 1) * limit;
  params.limit = limit;
  params.offset = offset;

  const [rows] = await pool.query(
    `SELECT id, name, email, role, is_active, created_at
       FROM users
      ${whereClause}
      ORDER BY id DESC
      LIMIT :limit OFFSET :offset`,
    params
  );

  if (url.searchParams.has("page")) {
    sendJson(res, 200, {
      data: rows,
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } else {
    sendJson(res, 200, rows);
  }
}

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().min(1)
});

async function createUser(req, res, { readJson, sendJson }) {
  const payload = createUserSchema.parse(await readJson(req));
  
  const [existing] = await pool.query("SELECT id FROM users WHERE email = :email LIMIT 1", { email: payload.email });
  if (existing.length > 0) {
    sendJson(res, 400, { message: "Email is already in use" });
    return;
  }

  const [roles] = await pool.query("SELECT id FROM roles WHERE name = :role LIMIT 1", { role: payload.role });
  const roleId = roles.length ? roles[0].id : null;

  if (!roleId) {
    sendJson(res, 400, { message: "Invalid role specified" });
    return;
  }

  const hashedPassword = hashPassword(payload.password);

  const [result] = await pool.query(
    `INSERT INTO users (role_id, role, name, email, password_hash)
     VALUES (:roleId, :role, :name, :email, :passwordHash)`,
    { roleId, role: payload.role, name: payload.name, email: payload.email, passwordHash: hashedPassword }
  );

  if (payload.role.toLowerCase() === "customer") {
    const [existingCustomers] = await pool.query(
      "SELECT id FROM customers WHERE email = :email ORDER BY id DESC LIMIT 1",
      { email: payload.email }
    );
    if (!existingCustomers.length) {
      await pool.query(
        "INSERT INTO customers (name, phone, email, address) VALUES (:name, '', :email, '')",
        { name: payload.name, email: payload.email }
      );
    } else {
      await pool.query(
        "UPDATE customers SET name = :name WHERE id = :id",
        { name: payload.name, id: existingCustomers[0].id }
      );
    }
  }

  sendJson(res, 201, { id: result.insertId, message: "User created successfully" });
}

const editUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(2),
  email: z.string().email(),
  role: z.string().min(1)
});

async function editUser(req, res, { readJson, sendJson }) {
  const payload = editUserSchema.parse(await readJson(req));

  const [existing] = await pool.query("SELECT id FROM users WHERE email = :email AND id != :id", { email: payload.email, id: payload.id });
  if (existing.length > 0) {
    sendJson(res, 400, { message: "Email is already in use by another user" });
    return;
  }

  const [roles] = await pool.query("SELECT id FROM roles WHERE name = :role LIMIT 1", { role: payload.role });
  const roleId = roles.length ? roles[0].id : null;

  await pool.query(
    `UPDATE users
        SET role_id = :roleId,
            role = :role,
            name = :name,
            email = :email
      WHERE id = :id`,
    { roleId, role: payload.role, name: payload.name, email: payload.email, id: payload.id }
  );

  if (payload.role.toLowerCase() === "customer") {
    const [existingCustomers] = await pool.query(
      "SELECT id FROM customers WHERE email = :email ORDER BY id DESC LIMIT 1",
      { email: payload.email }
    );
    if (!existingCustomers.length) {
      await pool.query(
        "INSERT INTO customers (name, phone, email, address) VALUES (:name, '', :email, '')",
        { name: payload.name, email: payload.email }
      );
    } else {
      await pool.query(
        "UPDATE customers SET name = :name WHERE id = :id",
        { name: payload.name, id: existingCustomers[0].id }
      );
    }
  }

  sendJson(res, 200, { updated: true });
}

const toggleUserSchema = z.object({
  userId: z.number().int().positive(),
  isActive: z.boolean()
});

async function toggleUser(req, res, { readJson, sendJson }) {
  const payload = toggleUserSchema.parse(await readJson(req));
  await pool.query("UPDATE users SET is_active = :isActive WHERE id = :userId", payload);
  sendJson(res, 200, { updated: true });
}

const deleteUserSchema = z.object({
  userId: z.number().int().positive()
});

async function deleteUser(req, res, { readJson, sendJson }) {
  const payload = deleteUserSchema.parse(await readJson(req));
  await pool.query("UPDATE users SET is_deleted = 1 WHERE id = :userId", payload);
  sendJson(res, 200, { deleted: true });
}

module.exports = { listUsers, createUser, editUser, toggleUser, deleteUser };
