import userService from "../services/UserService.js";
import faceRecognitionService from "../services/FaceRecognitionService.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../");

class UserController {
    /**
     * GET /api/users
     */
    async index(req, res) {
        try {
            const result = await userService.getAll(req.query, req.user);

            return res.status(200).json({
                success: true,
                message: "Data users berhasil diambil",
                ...result,
            });
        } catch (error) {
            console.error("UserController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data users",
                error: error.message,
            });
        }
    }

    /**
     * GET /api/users/all
     */
    async all(req, res) {
        try {
            const result = await userService.getAllNoPaginate(req.query, req.user);

            return res.status(200).json({
                success: true,
                message: "Semua data users berhasil diambil",
                ...result,
            });
        } catch (error) {
            console.error("UserController.all error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil semua data users",
                error: error.message,
            });
        }
    }

    /**
     * GET /api/users/subordinates
     * Gets users managed by the currently logged in manager
     */
    async subordinates(req, res) {
        try {
            // Check if user has manager role
            const userRoles = req.user.roles || [];
            // Remove strict check because manager could be determined by jabatan name or DB relation
            // The service getManagerReports will return empty if the user is not a manager of any jabatan.

            const result = await userService.getManagerReports(req.user.id);
            return res.status(200).json({
                success: true,
                message: "Data bawahan berhasil diambil",
                ...result,
            });
        } catch (error) {
            console.error("UserController.subordinates error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data bawahan",
                error: error.message,
            });
        }
    }

    /**
     * GET /api/users/:id
     */
    async show(req, res) {
        try {
            const user = await userService.getById(req.params.id, req.user);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Data user berhasil diambil",
                data: user,
            });
        } catch (error) {
            console.error("UserController.show error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data user",
                error: error.message,
            });
        }
    }

    /**
     * POST /api/users
     */
    async store(req, res) {
        try {
            if (!req.body.name) {
                return res.status(400).json({
                    success: false,
                    message: "Field 'name' wajib diisi",
                });
            }

            // Attach path foto jika ada
            const baseUrl = `${req.protocol}://${req.get("host")}`;
            const data = { ...req.body };
            if (req.file) {
                // Simpan URL lengkap foto karyawan
                data.foto_karyawan = `${baseUrl}/uploads/profile/${req.file.filename}`;
            }

            const user = await userService.create(data);

            return res.status(201).json({
                success: true,
                message: "User berhasil dibuat",
                data: user,
            });
        } catch (error) {
            console.error("UserController.store error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal membuat user",
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/users/:id
     */
    async update(req, res) {
        try {
            const baseUrl = `${req.protocol}://${req.get("host")}`;
            const data = { ...req.body };
            if (req.file) {
                // Simpan URL lengkap foto karyawan
                data.foto_karyawan = `${baseUrl}/uploads/profile/${req.file.filename}`;
            }

            const user = await userService.update(req.params.id, data, req.user);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "User berhasil diupdate",
                data: user,
            });
        } catch (error) {
            console.error("UserController.update error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengupdate user",
                error: error.message,
            });
        }
    }

    /**
     * POST /api/users/face-recognition
     * POST /api/users/:id/face-recognition
     *
     * Alur:
     * 1. Simpan file ke disk
     * 2. Validasi bahwa wajah benar-benar terdeteksi di foto
     * 3. Jika valid → update DB + invalidate cache
     * 4. Jika tidak valid → hapus file yang sudah diupload, return error
     */
    async faceRecognition(req, res) {
        let savedFilePath = null; // track file yang sudah disimpan agar bisa dihapus jika gagal

        try {
            const baseUrl = `${req.protocol}://${req.get("host")}`;
            let photoPath = null;
            let userId = req.params.id || req.body.user_id;

            console.log(`[FaceRegistration] Menerima request untuk user ID: ${userId}`);
            console.log(`[FaceRegistration] Method: ${req.method}, URL: ${req.originalUrl}`);
            console.log(`[FaceRegistration] Tipe upload: ${req.file ? 'multipart file' : (req.body.foto_face_recognition ? 'base64' : 'tidak ada')}`);

            // 1. Handle Multipart File Upload
            if (req.file) {
                savedFilePath = req.file.path;
                photoPath = `${baseUrl}/uploads/profile/${req.file.filename}`;
                console.log(`[FaceRegistration] File multipart tersimpan: ${savedFilePath}`);
            }
            // 2. Handle Base64 via JSON Body
            else if (req.body.foto_face_recognition && req.body.foto_face_recognition.startsWith("data:image")) {
                const { saveBase64Image } = await import("../middleware/uploadMiddleware.js");
                const relPath = saveBase64Image(req.body.foto_face_recognition, "profile", "face");
                photoPath = `${baseUrl}${relPath}`;
                // Dapatkan absolute path untuk validasi
                const cleanRel = relPath.startsWith('/') ? relPath.substring(1) : relPath;
                savedFilePath = path.join(ROOT_DIR, "public", cleanRel);
                console.log(`[FaceRegistration] File base64 tersimpan: ${savedFilePath}`);
            }

            if (!photoPath || !savedFilePath) {
                return res.status(400).json({
                    success: false,
                    message: "Foto face recognition (file atau base64) wajib diupload",
                });
            }

            if (!userId) {
                // Hapus file yang sudah disimpan
                if (savedFilePath && fs.existsSync(savedFilePath)) fs.unlinkSync(savedFilePath);
                return res.status(400).json({
                    success: false,
                    message: "user_id wajib disertakan dalam body atau URL parameter",
                });
            }

            // 3. VALIDASI WAJAH: Pastikan wajah terdeteksi di foto sebelum disimpan ke DB
            console.log(`[FaceRegistration] Memvalidasi wajah di foto untuk user ID: ${userId}`);
            const validation = await faceRecognitionService.validateFaceForRegistration(savedFilePath);

            if (!validation.valid) {
                console.error(`[FaceRegistration] ❌ Validasi wajah GAGAL untuk user ${userId}: ${validation.error}`);
                
                // Hapus file yang sudah diupload karena validasi gagal
                if (savedFilePath && fs.existsSync(savedFilePath)) {
                    fs.unlinkSync(savedFilePath);
                    console.log(`[FaceRegistration] File tidak valid dihapus: ${savedFilePath}`);
                }

                return res.status(400).json({
                    success: false,
                    message: validation.error || "Wajah tidak terdeteksi pada foto yang diupload.",
                    failReason: validation.failReason,
                    hint: "Pastikan: (1) pencahayaan cukup, (2) wajah menghadap langsung ke kamera, (3) wajah tidak tertutup, (4) jarak tidak terlalu jauh."
                });
            }

            console.log(`[FaceRegistration] ✅ Validasi wajah berhasil untuk user ID: ${userId}`);

            // 4. Update database dengan foto yang sudah divalidasi
            const user = await userService.updateFaceRecognition(userId, photoPath, req.user);

            // 5. Invalidate cache agar verifikasi berikutnya menggunakan foto baru
            faceRecognitionService.invalidateUserCache(userId);
            console.log(`[FaceRegistration] ✅ Database diperbarui dan cache di-invalidate untuk user ID: ${userId}`);

            return res.status(200).json({
                success: true,
                message: "Foto face recognition berhasil diperbarui. Wajah telah terverifikasi.",
                data: user,
            });

        } catch (error) {
            console.error("[FaceRegistration] ❌ Error:", error);
            // Hapus file jika ada error setelah upload
            if (savedFilePath && fs.existsSync(savedFilePath)) {
                try { fs.unlinkSync(savedFilePath); } catch (_) {}
            }
            return res.status(500).json({
                success: false,
                message: "Gagal memperbarui face recognition",
                error: error.message,
            });
        }
    }


    /**
     * DELETE /api/users/:id
     */
    async destroy(req, res) {
        try {
            const result = await userService.delete(req.params.id, req.user);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "User tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "User berhasil dihapus",
            });
        } catch (error) {
            console.error("UserController.destroy error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus user",
                error: error.message,
            });
        }
    }

    /**
     * DELETE /api/users/bulk
     */
    async bulkDestroy(req, res) {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Daftar ID user (array) wajib disertakan",
                });
            }

            const result = await userService.bulkDelete(ids, req.user);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Gagal menghapus beberapa user atau user tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: `${ids.length} user berhasil dihapus`,
            });
        } catch (error) {
            console.error("UserController.bulkDestroy error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus user secara massal",
                error: error.message,
            });
        }
    }

    /**
     * GET /api/users/:id/face-diagnostic
     * Endpoint untuk admin mendiagnosis status face recognition satu user.
     * Mengembalikan: URL foto di DB, apakah file fisik ada, apakah wajah terdeteksi, status cache.
     * TIDAK mengubah data apapun — read-only.
     */
    async faceDiagnostic(req, res) {
        try {
            const userId = req.params.id;
            const user = await userService.getById(userId);

            if (!user) {
                return res.status(404).json({ success: false, message: "User tidak ditemukan" });
            }

            const report = {
                user_id: user.id,
                user_name: user.name,
                foto_face_recognition_db: user.foto_face_recognition || null,
                file_exists_on_server: false,
                resolved_path: null,
                face_detectable: null,
                face_detection_detail: null,
                cache_status: null,
                timestamp: new Date().toISOString(),
            };

            const userIdStr = userId.toString();

            // Cek status cache
            const isCached = !!faceRecognitionService.userDescriptorsCache[userIdStr];
            report.cache_status = isCached ? "CACHED (akan digunakan saat verifikasi)" : "NOT_CACHED (akan load dari disk saat verifikasi)";

            if (!user.foto_face_recognition) {
                report.face_detectable = false;
                report.face_detection_detail = "foto_face_recognition kosong/null di database";
                return res.status(200).json({ success: true, data: report });
            }

            // Resolve path
            const referencePath = faceRecognitionService.resolveReferencePath(user.foto_face_recognition);
            report.resolved_path = referencePath;

            // Cek file di disk
            const fileExists = (await import("fs")).default.existsSync(referencePath);
            report.file_exists_on_server = fileExists;

            if (!fileExists) {
                report.face_detectable = false;
                report.face_detection_detail = `File TIDAK ditemukan di server path: ${referencePath}. URL di DB mungkin tidak cocok dengan lokasi file fisik.`;
                return res.status(200).json({ success: true, data: report });
            }

            // Coba ekstrak descriptor (tanpa menyimpan ke cache)
            const descriptor = await faceRecognitionService.getFaceDescriptor(referencePath, `diagnostic-user-${userId}`);

            if (!descriptor) {
                report.face_detectable = false;
                report.face_detection_detail = "getFaceDescriptor mengembalikan null — kemungkinan error membaca file atau file bukan gambar valid.";
            } else if (descriptor.error) {
                report.face_detectable = false;
                report.face_detection_detail = descriptor.error;
            } else {
                report.face_detectable = true;
                report.face_detection_detail = `Wajah berhasil terdeteksi. Descriptor length: ${descriptor.length}`;
            }

            return res.status(200).json({ success: true, data: report });

        } catch (error) {
            console.error("UserController.faceDiagnostic error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menjalankan diagnostik face recognition",
                error: error.message,
            });
        }
    }
}

export default new UserController();
