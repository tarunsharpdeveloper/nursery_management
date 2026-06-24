const { z } = require("zod");
const { pool } = require("../db");
const { permissionsForRole, signToken, verifyPassword, hashPassword } = require("../auth");

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

async function login(req, res, { readJson, sendJson }) {
  const payload = loginSchema.parse(await readJson(req));
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.password_hash, COALESCE(u.role, r.name) AS role, c.phone
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN customers c ON c.email = u.email
      WHERE u.email = :email AND u.is_active = TRUE
      LIMIT 1`,
    { email: payload.email }
  );

  const user = rows[0];

  if (!user || !verifyPassword(payload.password, user.password_hash)) {
    sendJson(res, 401, { message: "Invalid email or password" });
    return;
  }

  const permissions = permissionsForRole(user.role);
  const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });

  sendJson(res, 200, {
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone || "", role: user.role, permissions }
  });
}

async function me(req, res, { sendJson }) {
  sendJson(res, 200, { user: req.user, permissions: permissionsForRole(req.user.role) });
}

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  password: z.string().min(6)
});

async function registerCustomer(req, res, { readJson, sendJson }) {
  const payload = registerSchema.parse(await readJson(req));
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let [customerRoles] = await connection.query("SELECT id FROM roles WHERE name = 'customer' LIMIT 1");
    if (!customerRoles.length) {
      const [insertRole] = await connection.query("INSERT INTO roles (name) VALUES ('customer')");
      customerRoles = [{ id: insertRole.insertId }];
    }
    const roleId = Number(customerRoles[0].id);

    const [existingUsers] = await connection.query(
      "SELECT id, role FROM users WHERE email = :email LIMIT 1",
      { email: payload.email }
    );

    if (existingUsers.length) {
      throw new Error("This email is already registered");
    }

    const hashedPassword = hashPassword(payload.password);

    const [userResult] = await connection.query(
      `INSERT INTO users (role_id, role, name, email, password_hash)
       VALUES (:roleId, 'customer', :name, :email, :passwordHash)`,
      { roleId, name: payload.name, email: payload.email, passwordHash: hashedPassword }
    );
    
    const userId = userResult.insertId;

    const [existingCustomers] = await connection.query(
      "SELECT id FROM customers WHERE email = :email OR phone = :phone ORDER BY id DESC LIMIT 1",
      { email: payload.email, phone: payload.phone }
    );

    if (!existingCustomers.length) {
      await connection.query(
        "INSERT INTO customers (name, phone, email, address) VALUES (:name, :phone, :email, '')",
        { name: payload.name, phone: payload.phone, email: payload.email }
      );
    } else {
      await connection.query(
        "UPDATE customers SET name = :name WHERE id = :id",
        { name: payload.name, id: existingCustomers[0].id }
      );
    }

    await connection.commit();

    const token = signToken({ id: userId, name: payload.name, email: payload.email, role: 'customer' });

    sendJson(res, 201, {
      token,
      user: { id: userId, name: payload.name, email: payload.email, phone: payload.phone, role: 'customer', permissions: permissionsForRole('customer') }
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { login, me, registerCustomer };
