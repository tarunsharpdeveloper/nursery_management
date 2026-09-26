const { z } = require("zod");
const crypto = require("crypto");
const { pool } = require("../db");
const { permissionsForRole, signToken, verifyPassword, hashPassword, authenticate } = require("../auth");
const { sendPasswordResetEmail, sendAccountCreationEmail } = require("../email");

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
      WHERE u.email = :email AND u.is_active = TRUE AND u.is_deleted = 0
      LIMIT 1`,
    { email: payload.email }
  );

  const user = rows[0];

  if (!user || !verifyPassword(payload.password, user.password_hash)) {
    sendJson(res, 401, { message: "Invalid email or password" });
    return;
  }

  const permissions = await permissionsForRole(user.role);
  const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });

  sendJson(res, 200, {
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone || "", role: user.role, permissions }
  });
}

async function me(req, res, { sendJson }) {
  const user = req.user || authenticate(req);
  if (!user) {
    sendJson(res, 401, { message: "Unauthorized" });
    return;
  }
  sendJson(res, 200, { user, permissions: await permissionsForRole(user.role) });
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
      user: { id: userId, name: payload.name, email: payload.email, phone: payload.phone, role: 'customer', permissions: await permissionsForRole('customer') }
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
  email: z.string().email(),
  phone: z.string().optional()
});

async function updateProfile(req, res, { readJson, sendJson }) {
  const authUser = req.user || authenticate(req);
  const userId = authUser?.id || authUser?.userId;
  if (!userId) {
    sendJson(res, 401, { message: "Unauthorized" });
    return;
  }

  const payload = updateProfileSchema.parse(await readJson(req));
  
  // Get existing user record
  const [userRows] = await pool.query("SELECT email FROM users WHERE id = :id", { id: userId });
  if (!userRows.length) {
    sendJson(res, 404, { message: "User not found" });
    return;
  }
  const oldEmail = userRows[0].email;

  if (payload.email && payload.email !== oldEmail) {
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = :email AND id != :id",
      { email: payload.email, id: userId }
    );
    if (existing.length) {
      sendJson(res, 400, { message: "Email is already taken" });
      return;
    }
    await pool.query(
      "UPDATE users SET name = :name, email = :email WHERE id = :id",
      { name: payload.name, email: payload.email, id: userId }
    );
  } else {
    await pool.query(
      "UPDATE users SET name = :name WHERE id = :id",
      { name: payload.name, id: userId }
    );
  }

  // Also update matching customer table record if it exists
  await pool.query(
    "UPDATE customers SET name = :name, email = :newEmail, phone = COALESCE(NULLIF(:phone, ''), phone) WHERE email = :oldEmail",
    { name: payload.name, newEmail: payload.email, phone: payload.phone || "", oldEmail }
  );

  sendJson(res, 200, { message: "Profile updated successfully" });
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6)
});

async function updatePassword(req, res, { readJson, sendJson }) {
  const authUser = req.user || authenticate(req);
  const userId = authUser?.id || authUser?.userId;
  if (!userId) {
    sendJson(res, 401, { message: "Unauthorized" });
    return;
  }

  const payload = updatePasswordSchema.parse(await readJson(req));
  
  const [rows] = await pool.query(
    "SELECT password_hash FROM users WHERE id = :id",
    { id: userId }
  );
  const user = rows[0];

  if (!user || !verifyPassword(payload.currentPassword, user.password_hash)) {
    sendJson(res, 400, { message: "Incorrect current password" });
    return;
  }

  const newHash = hashPassword(payload.newPassword);
  await pool.query(
    "UPDATE users SET password_hash = :hash WHERE id = :id",
    { hash: newHash, id: userId }
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

// Generate random password
function generateRandomPassword(length = 12) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  const all = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

const autoCreateAccountSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits")
});

async function autoCreateAccount(req, res, { readJson, sendJson }) {
  const payload = autoCreateAccountSchema.parse(await readJson(req));
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Check if user already exists
    const [existingUsers] = await connection.query(
      "SELECT id, role FROM users WHERE email = :email LIMIT 1",
      { email: payload.email }
    );

    if (existingUsers.length) {
      // User already exists, just return success without creating duplicate
      await connection.commit();
      sendJson(res, 200, { 
        message: "Account already exists",
        accountExists: true
      });
      return;
    }

    // Get or create customer role
    let [customerRoles] = await connection.query("SELECT id FROM roles WHERE name = 'customer' LIMIT 1");
    if (!customerRoles.length) {
      const [insertRole] = await connection.query("INSERT INTO roles (name) VALUES ('customer')");
      customerRoles = [{ id: insertRole.insertId }];
    }
    const roleId = Number(customerRoles[0].id);

    // Generate random password
    const randomPassword = generateRandomPassword(12);
    const hashedPassword = hashPassword(randomPassword);

    // Create user account
    const [userResult] = await connection.query(
      `INSERT INTO users (role_id, role, name, email, password_hash)
       VALUES (:roleId, 'customer', :name, :email, :passwordHash)`,
      { roleId, name: payload.name, email: payload.email, passwordHash: hashedPassword }
    );
    
    const userId = userResult.insertId;

    // Create or update customer record
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

    // Send email with credentials (async, don't wait)
    sendAccountCreationEmail(payload.email, payload.name, randomPassword).catch(err => {
      console.error('Failed to send account creation email:', err);
    });

    sendJson(res, 201, {
      message: "Account created successfully. Login credentials have been sent to your email.",
      accountCreated: true
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const autoCreateAccountWithPhoneSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits")
});

async function autoCreateAccountWithPhone(req, res, { readJson, sendJson }) {
  const payload = autoCreateAccountWithPhoneSchema.parse(await readJson(req));
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Check if user already exists
    const [existingUsers] = await connection.query(
      "SELECT id, role FROM users WHERE email = :email LIMIT 1",
      { email: payload.email }
    );

    if (existingUsers.length) {
      // User already exists, just return success without creating duplicate
      await connection.commit();
      sendJson(res, 200, { 
        message: "Account already exists",
        accountExists: true
      });
      return;
    }

    // Get or create customer role
    let [customerRoles] = await connection.query("SELECT id FROM roles WHERE name = 'customer' LIMIT 1");
    if (!customerRoles.length) {
      const [insertRole] = await connection.query("INSERT INTO roles (name) VALUES ('customer')");
      customerRoles = [{ id: insertRole.insertId }];
    }
    const roleId = Number(customerRoles[0].id);

    // Use phone number as password (no random generation)
    const hashedPassword = hashPassword(payload.phone);

    // Create user account
    const [userResult] = await connection.query(
      `INSERT INTO users (role_id, role, name, email, password_hash)
       VALUES (:roleId, 'customer', :name, :email, :passwordHash)`,
      { roleId, name: payload.name, email: payload.email, passwordHash: hashedPassword }
    );
    
    const userId = userResult.insertId;

    // Create or update customer record
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

    // No email sent - phone is the password
    sendJson(res, 201, {
      message: "Account created successfully with phone as password.",
      accountCreated: true
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const checkEmailSchema = z.object({
  email: z.string().email()
});

async function checkEmailExists(req, res, { readJson, sendJson }) {
  const payload = checkEmailSchema.parse(await readJson(req));

  try {
    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = :email LIMIT 1",
      { email: payload.email }
    );

    sendJson(res, 200, {
      exists: existingUsers.length > 0,
      email: payload.email
    });
  } catch (error) {
    throw error;
  }
}

/**
 * SECURE ADMIN PASSWORD CHANGE
 * This endpoint requires a secret key from environment variable
 * Use this to change admin password via API call
 * 
 * POST /api/auth/admin-password-change
 * Body: { email, newPassword, secretKey }
 */
const adminPasswordChangeSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6),
  secretKey: z.string().min(1)
});

async function adminPasswordChange(req, res, { readJson, sendJson }) {
  const payload = adminPasswordChangeSchema.parse(await readJson(req));

  // Verify secret key from environment variable
  const ADMIN_SECRET_KEY = process.env.ADMIN_PASSWORD_CHANGE_SECRET || 'change-this-secret-key-in-production';
  
  if (payload.secretKey !== ADMIN_SECRET_KEY) {
    sendJson(res, 403, { message: "Invalid secret key" });
    return;
  }

  try {
    // Check if user exists
    const [users] = await pool.query(
      'SELECT id, name, email FROM users WHERE email = :email AND is_deleted = 0',
      { email: payload.email }
    );

    if (users.length === 0) {
      sendJson(res, 404, { message: `User with email "${payload.email}" not found` });
      return;
    }

    const user = users[0];

    // Hash the new password
    const passwordHash = hashPassword(payload.newPassword);

    // Update the password
    const [result] = await pool.query(
      'UPDATE users SET password_hash = :passwordHash WHERE id = :id',
      { passwordHash, id: user.id }
    );

    if (result.affectedRows > 0) {
      console.log(`[ADMIN PASSWORD CHANGE] Password changed for user: ${user.email} (ID: ${user.id})`);
      
      sendJson(res, 200, {
        message: "Password updated successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    } else {
      sendJson(res, 500, { message: "Failed to update password" });
    }

  } catch (error) {
    console.error('[ADMIN PASSWORD CHANGE] Error:', error);
    throw error;
  }
}

/**
 * SECURE ADMIN EMAIL & PASSWORD CHANGE
 * This endpoint requires a secret key from environment variable
 * Use this to change admin email and/or password via API call
 * 
 * POST /api/auth/admin-change-email-password
 * Body: { email, newEmail (optional), newPassword (optional), secretKey }
 */
const adminChangeEmailPasswordSchema = z.object({
  email: z.string().email(),
  newEmail: z.string().email().optional(),
  newPassword: z.string().min(6).optional(),
  secretKey: z.string().min(1)
});

async function adminChangeEmailPassword(req, res, { readJson, sendJson }) {
  const payload = adminChangeEmailPasswordSchema.parse(await readJson(req));

  // Verify secret key from environment variable
  const ADMIN_SECRET_KEY = process.env.ADMIN_PASSWORD_CHANGE_SECRET || 'change-this-secret-key-in-production';
  
  if (payload.secretKey !== ADMIN_SECRET_KEY) {
    sendJson(res, 403, { message: "Invalid secret key" });
    return;
  }

  // Check if at least one change is requested
  if (!payload.newEmail && !payload.newPassword) {
    sendJson(res, 400, { message: "At least one of newEmail or newPassword must be provided" });
    return;
  }

  try {
    // Check if user exists
    const [users] = await pool.query(
      'SELECT id, name, email FROM users WHERE email = :email AND is_deleted = 0',
      { email: payload.email }
    );

    if (users.length === 0) {
      sendJson(res, 404, { message: `User with email "${payload.email}" not found` });
      return;
    }

    const user = users[0];

    // Check if new email is already taken (if changing email)
    if (payload.newEmail && payload.newEmail !== payload.email) {
      const [existingEmail] = await pool.query(
        'SELECT id FROM users WHERE email = :email AND id != :id AND is_deleted = 0 LIMIT 1',
        { email: payload.newEmail, id: user.id }
      );

      if (existingEmail.length > 0) {
        sendJson(res, 400, { message: `Email "${payload.newEmail}" is already in use` });
        return;
      }
    }

    // Build update query dynamically
    const updates = [];
    const params = { id: user.id };

    if (payload.newEmail) {
      updates.push('email = :newEmail');
      params.newEmail = payload.newEmail;
    }

    if (payload.newPassword) {
      updates.push('password_hash = :passwordHash');
      params.passwordHash = hashPassword(payload.newPassword);
    }

    // Execute update
    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = :id`;
    const [result] = await pool.query(updateQuery, params);

    if (result.affectedRows > 0) {
      const changes = [];
      if (payload.newEmail) {
        changes.push(`email from ${user.email} to ${payload.newEmail}`);
        // Also update customer table if exists
        await pool.query(
          'UPDATE customers SET email = :newEmail WHERE email = :oldEmail',
          { newEmail: payload.newEmail, oldEmail: user.email }
        );
      }
      if (payload.newPassword) {
        changes.push('password');
      }

      console.log(`[ADMIN EMAIL/PASSWORD CHANGE] ${changes.join(' and ')} changed for user: ${user.email} (ID: ${user.id})`);
      
      sendJson(res, 200, {
        message: "User information updated successfully",
        user: {
          id: user.id,
          name: user.name,
          email: payload.newEmail || user.email
        },
        changes
      });
    } else {
      sendJson(res, 500, { message: "Failed to update user information" });
    }

  } catch (error) {
    console.error('[ADMIN EMAIL/PASSWORD CHANGE] Error:', error);
    throw error;
  }
}

module.exports = { login, me, registerCustomer, updateProfile, updatePassword, forgotPassword, resetPassword, verifyResetToken, autoCreateAccount, autoCreateAccountWithPhone, checkEmailExists, adminPasswordChange, adminChangeEmailPassword };
