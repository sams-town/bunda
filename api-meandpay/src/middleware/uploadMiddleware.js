import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Factory untuk membuat middleware upload dinamis.
 * @param {string} subfolder - nama subfolder di public/uploads (profile, pkwt, dll)
 * @param {string} prefix - prefix nama file (profile, kontrak, dsb)
 * @param {string[]} allowedMimes - array MIME type yang diizinkan
 * @param {number} maxSize - ukuran maksimal file (byte)
 * @param {boolean} useUploads - jika true, simpan di public/uploads, jika false di public/
 * @returns {multer.Multer} - instance multer
 */
export function createUploadMiddleware(subfolder = "profile", prefix = "file", allowedMimes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"], maxSize = 5 * 1024 * 1024, useUploads = true) {
    const baseDir = useUploads ? "../../public/uploads" : "../../public";
    const uploadDir = path.join(__dirname, baseDir, subfolder);
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const baseName = path.basename(file.originalname, ext)
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-');
            const uniqueSuffix = Date.now();
            cb(null, `${prefix}-${baseName}-${uniqueSuffix}${ext.toLowerCase()}`);
        },
    });

    const fileFilter = (req, file, cb) => {
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipe file tidak diizinkan. Izin: ${allowedMimes.join(", ")}`), false);
        }
    };

    return multer({
        storage,
        fileFilter,
        limits: { fileSize: maxSize },
    });
}

// Default untuk backward compatibility
export const upload = createUploadMiddleware("profile", "profile");

export function saveBase64Image(base64String, subfolder, prefix, useUploads = true) {
    if (!base64String || typeof base64String !== 'string') return base64String;
    
    // Support both data:image and data:application (for PDF)
    if (!base64String.startsWith("data:image") && !base64String.startsWith("data:application")) return base64String;

    const matches = base64String.match(/^data:(image|application)\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 4) return base64String;

    let extension = matches[2];
    if (extension === 'jpeg') extension = 'jpg';
    if (extension.includes('officedocument')) extension = 'docx'; // Rough handling for docx
    
    const base64Data = matches[3];
    const buffer = Buffer.from(base64Data, 'base64');

    const filename = `${prefix}-base64-${Date.now()}.${extension}`;
    const baseDir = useUploads ? "../../public/uploads" : "../../public";
    const uploadDir = path.join(__dirname, baseDir, subfolder);

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fullPath = path.join(uploadDir, filename);
    fs.writeFileSync(fullPath, buffer);
    return useUploads ? `/uploads/${subfolder}/${filename}` : `/${subfolder}/${filename}`;
}
