const crypto = require("crypto");

const rolePermissions = {
  super_admin: ["*"],
  staff_user: [
    "dashboard:read",
    "products:read",
    "products:write",
    "inventory:read",
    "production:write",
    "orders:read",
    "orders:write",
    "attendance:read",
    "attendance:write",
    "employees:read"
  ],
  billing_user: [
    "dashboard:read",
    "orders:read",
    "payments:read",
    "payments:write",
    "billing:read",
    "billing:write",
    "ledger:read"
  ],
  customer: []
};

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

function permissionsForRole(role) {
  return rolePermissions[role] || [];
}

function hasPermission(user, permission) {
  if (!permission) return true;
  const permissions = permissionsForRole(user?.role);
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
  hasPermission,
  rolePermissions
};
