async function readJson(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, corsHeaders());
  res.end(JSON.stringify(payload));
}

function sendNoContent(res, statusCode = 204) {
  const headers = corsHeaders();
  delete headers["Content-Type"];
  res.writeHead(statusCode, headers);
  res.end();
}

function sendError(res, error, fallbackMessage = "Request failed") {
  const statusCode = error.name === "ZodError" ? 400 : 500;
  sendJson(res, statusCode, {
    message: statusCode === 400 ? "Validation failed" : (error.message || fallbackMessage),
    error: error.name === "ZodError" ? error.errors : error.message
  });
}

function notFound(res) {
  sendJson(res, 404, { message: "Route not found" });
}

module.exports = { readJson, sendJson, sendNoContent, sendError, notFound };
