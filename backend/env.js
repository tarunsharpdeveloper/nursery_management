const fs = require("fs");
const path = require("path");

function loadEnv() {
  const candidates = [
    path.join(__dirname, ".env"),
    path.join(__dirname, "..", ".env"),
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "..", ".env")
  ];
  console.log("Checking .env file candidates:");
  candidates.forEach(c => {
    console.log(` - ${c} (exists: ${fs.existsSync(c)})`);
  });

  const envPath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!envPath) {
    console.log("CRITICAL: No .env file found in any candidate path!");
    return;
  }

  console.log("Loading environment from:", envPath);
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
      if (key.startsWith("MYSQL_")) {
        console.log(`Set ${key} = ${key === "MYSQL_PASSWORD" ? "[REDACTED]" : value}`);
      }
    } else {
      if (key.startsWith("MYSQL_")) {
        console.log(`Skipped ${key} (already set in system env to: ${key === "MYSQL_PASSWORD" ? "[REDACTED]" : process.env[key]})`);
      }
    }
  }
}

module.exports = { loadEnv };
