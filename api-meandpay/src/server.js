import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import multer from "multer";
import apiRoutes from "./routes/Api.js";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Compression middleware — mengurangi ukuran response hingga 70%
try {
  const compression = require('compression');
  app.use(compression({ threshold: 1024 })); // compress response > 1KB
  console.log('[Server] Compression middleware aktif.');
} catch (e) {
  console.warn('[Server] compression package tidak tersedia, skip.');
}

// CORS — manual middleware, compatible dengan semua Express version
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Limit 10mb cukup untuk foto selfie (sebelumnya 50mb — boros memory)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve folder public/uploads agar bisa diakses public via url /uploads/...
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));
app.use("/lemburs", express.static(path.join(__dirname, "../public/lemburs")));
app.use("/beritas", express.static(path.join(__dirname, "../public/beritas")));

// Mount under /api as well, so Nginx proxy passes these correctly
app.use("/api/uploads", express.static(path.join(__dirname, "../public/uploads")));
app.use("/api/lemburs", express.static(path.join(__dirname, "../public/lemburs")));
app.use("/api/beritas", express.static(path.join(__dirname, "../public/beritas")));

app.use("/api", apiRoutes);

// Error handling middleware for Multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error("Multer Error:", err.message);
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            console.error("Unexpected field name:", err.field);
        }
        return res.status(400).json({
            success: false,
            message: `File upload error: ${err.message}`,
            field: err.field
        });
    }
    if (err) {
        console.error("General Error:", err.message);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
    next();
});

app.get("/", (req, res) => res.send("MeanPay API Running 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));