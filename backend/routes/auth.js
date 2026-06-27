const { z } = require("zod");
const crypto = require("crypto");
const { pool } = require("../db");
const { permissionsForRole, signToken, verifyPassword, hashPassword } = require("../auth");
const { sendPasswordResetEmail } = require("../email");

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

const updateProfileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
});

async function updateProfile(req, res, { readJson, sendJson }) {
  const payload = updateProfileSchema.parse(await readJson(req));
  
  const [existing] = await pool.query(
    "SELECT id FROM users WHERE email = :email AND id != :id",
    { email: payload.email, id: req.user.id }
  );
  if (existing.length) {
    sendJson(res, 400, { message: "Email is already taken" });
    return;
  }

  await pool.query(
    "UPDATE users SET name = :name, email = :email WHERE id = :id",
    { name: payload.name, email: payload.email, id: req.user.id }
  );

  sendJson(res, 200, { message: "Profile updated successfully" });
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6)
});

async function updatePassword(req, res, { readJson, sendJson }) {
  const payload = updatePasswordSchema.parse(await readJson(req));
  
  const [rows] = await pool.query(
    "SELECT password_hash FROM users WHERE id = :id",
    { id: req.user.id }
  );
  const user = rows[0];

  if (!user || !verifyPassword(payload.currentPassword, user.password_hash)) {
    sendJson(res, 400, { message: "Incorrect current password" });
    return;
  }

  const newHash = hashPassword(payload.newPassword);
  await pool.query(
    "UPDATE users SET password_hash = :hash WHERE id = :id",
    { hash: newHash, id: req.user.id }
  );

  sendJson(res, 200, { message: "Password updated successfully" });
}

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

async function forgotPassword(req, res, { readJson, sendJson }) {
  const payload = forgotPasswordSchema.parse(await readJson(req));

  try {
    const [users] = await pool.query(
      "SELECT id, name, email FROM users WHERE email = :email AND is_active = TRUE LIMIT 1",
      { email: payload.email }
    );

    if (!users.length) {
      // For security, don't reveal if email exists or not
      sendJson(res, 200, { message: "If the email exists, a password reset link has been sent." });
      return;
    }

    const user = users[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + Number(process.env.RESET_TOKEN_EXPIRY || 3600) * 1000);

    // Save reset token to database
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, reset_token, expires_at)
       VALUES (:userId, :resetToken, :expiresAt)`,
      { userId: user.id, resetToken, expiresAt }
    );

    // Generate reset URL
    const resetUrl = `${process.env.CORS_ORIGIN || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    // Send email
    await sendPasswordResetEmail(user.email, user.name, resetToken, resetUrl);

    sendJson(res, 200, { message: "If the email exists, a password reset link has been sent." });
  } catch (error) {
    throw error;
  }
}

const resetPasswordSchema = z.object({
  resetToken: z.string().min(1),
  newPassword: z.string().min(6)
});

async function resetPassword(req, res, { readJson, sendJson }) {
  const payload = resetPasswordSchema.parse(await readJson(req));

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Find valid reset token
    const [tokens] = await connection.query(
      `SELECT id, user_id FROM password_reset_tokens 
       WHERE reset_token = :resetToken 
       AND is_used = FALSE 
       AND expires_at > NOW()
       LIMIT 1`,
      { resetToken: payload.resetToken }
    );

    if (!tokens.length) {
      sendJson(res, 400, { message: "Invalid or expired reset token" });
      return;
    }

    const token = tokens[0];

    // Update user password
    const newHash = hashPassword(payload.newPassword);
    await connection.query(
      "UPDATE users SET password_hash = :hash WHERE id = :id",
      { hash: newHash, id: token.user_id }
    );

    // Mark token as used
    await connection.query(
      `UPDATE password_reset_tokens 
       SET is_used = TRUE, used_at = NOW() 
       WHERE id = :tokenId`,
      { tokenId: token.id }
    );

    // Invalidate all other unused tokens for this user
    await connection.query(
      `UPDATE password_reset_tokens 
       SET is_used = TRUE 
       WHERE user_id = :userId AND id != :tokenId AND is_used = FALSE`,
      { userId: token.user_id, tokenId: token.id }
    );

    await connection.commit();
    sendJson(res, 200, { message: "Password reset successfully. Please login with your new password." });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const verifyResetTokenSchema = z.object({
  resetToken: z.string().min(1)
});

async function verifyResetToken(req, res, { readJson, sendJson }) {
  const payload = verifyResetTokenSchema.parse(await readJson(req));

  const [tokens] = await pool.query(
    `SELECT id FROM password_reset_tokens 
     WHERE reset_token = :resetToken 
     AND is_used = FALSE 
     AND expires_at > NOW()
     LIMIT 1`,
    { resetToken: payload.resetToken }
  );

  if (!tokens.length) {
    sendJson(res, 400, { message: "Invalid or expired reset token" });
    return;
  }

  sendJson(res, 200, { message: "Token is valid", valid: true });
}

module.exports = { login, me, registerCustomer, updateProfile, updatePassword, forgotPassword, resetPassword, verifyResetToken };
