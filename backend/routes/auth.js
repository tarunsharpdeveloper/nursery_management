const { z } = require("zod");
const { pool } = require("../db");
const { permissionsForRole, signToken, verifyPassword } = require("../auth");

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

async function login(req, res, { readJson, sendJson }) {
  const payload = loginSchema.parse(await readJson(req));
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.password_hash, r.name AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
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
    user: { id: user.id, name: user.name, email: user.email, role: user.role, permissions }
  });
}

async function me(req, res, { sendJson }) {
  sendJson(res, 200, { user: req.user, permissions: permissionsForRole(req.user.role) });
}

module.exports = { login, me };
