const crypto = require("crypto");
const { pool } = require("./db");

function secret() {
  return process.env.AUTH_SECRET || "nursery-dev-secret-change-me";
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  if (storedHash === "change-me") return password === "admin123";

  const [algorithm, salt, hash] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !hash) return false;

  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && crypto.timingSafeEqual(expected, candidate);
}

function base64url(input) {
  return Buffer.from(JSON.stringify(input)).toString("base64url");
}

function signToken(payload) {
  const header = base64url({ alg: "HS256", typ: "JWT" });
  const body = base64url({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8 });
  const signature = crypto.createHmac("sha256", secret()).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  const [header, body, signature] = (token || "").split(".");
  if (!header || !body || !signature) return null;

  const expected = crypto.createHmac("sha256", secret()).update(`${header}.${body}`).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

async function permissionsForRole(role) {
  if (!role) return [];
  const [rows] = await pool.query("SELECT permissions FROM roles WHERE name = :role LIMIT 1", { role });
  if (rows.length && rows[0].permissions) {
    return typeof rows[0].permissions === "string" ? JSON.parse(rows[0].permissions) : rows[0].permissions;
  }
  return [];
}

async function hasPermission(user, permission) {
  if (!permission) return true;
  const permissions = await permissionsForRole(user?.role);
  return permissions.includes("*") || permissions.includes(permission);
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

function authenticate(req) {
  return verifyToken(getBearerToken(req));
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  authenticate,
  permissionsForRole,
  hasPermission
};
