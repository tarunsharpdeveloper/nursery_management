const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMiddleware = multer({ storage: storage }).array("files");

function runMulter(req, res) {
  return new Promise((resolve, reject) => {
    uploadMiddleware(req, res, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function uploadFiles(req, res, { sendJson, sendError }) {
  try {
    await runMulter(req, res);
    
    if (!req.files || req.files.length === 0) {
      throw new Error("No files uploaded");
    }

    const urls = req.files.map(f => f.filename);
    sendJson(res, 200, { urls });
  } catch (error) {
    sendError(res, error, "File upload failed");
  }
}

module.exports = { uploadFiles };
