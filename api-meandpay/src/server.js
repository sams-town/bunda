// server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import multer from "multer";
import apiRoutes from "./routes/Api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve folder public/uploads agar bisa diakses public via url /uploads/...
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));
app.use("/lemburs", express.static(path.join(__dirname, "../public/lemburs")));
app.use("/beritas", express.static(path.join(__dirname, "../public/beritas")));

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));