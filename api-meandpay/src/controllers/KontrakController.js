import kontrakService from "../services/KontrakService.js";
import { createUploadMiddleware } from "../middleware/uploadMiddleware.js";

// Upload khusus kontrak/PKWT
const uploadKontrak = createUploadMiddleware(
    "pkwt",
    "kontrak",
    [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
        "image/jpg"
    ],
    5 * 1024 * 1024 // 5MB
);

class KontrakController {
    async index(req, res) {
        try {
            const result = await kontrakService.getAll(req.query);
            return res.status(200).json({
                success: true,
                message: "Data kontrak berhasil diambil",
                ...result,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data kontrak",
                error: error.message,
            });
        }
    }

    async showByUserId(req, res) {
        try {
            const data = await kontrakService.getByUserId(req.params.userId);
            return res.status(200).json({
                success: true,
                message: "Data kontrak berhasil diambil",
                data,
            });
        } catch (error) {
            console.error("KontrakController.showByUserId error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data kontrak",
                error: error.message,
            });
        }
    }

    async show(req, res) {
        try {
            const data = await kontrakService.getById(req.params.id);
            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: "Kontrak tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Data kontrak berhasil diambil",
                data,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data kontrak",
                error: error.message,
            });
        }
    }

    async store(req, res) {
        uploadKontrak.single("file")(req, res, async (err) => {
            try {
                if (err) {
                    console.error("Multer error:", err);
                    return res.status(400).json({
                        success: false,
                        message: err.message,
                    });
                }

                // Pastikan req.body terdefinisi
                if (!req.body) {
                    return res.status(400).json({
                        success: false,
                        message: "Request body is missing",
                    });
                }

                if (!req.body.user_id) {
                    return res.status(400).json({
                        success: false,
                        message: "Field 'user_id' wajib diisi",
                    });
                }

                const baseUrl = `${req.protocol}://${req.get("host")}`;
                const payload = { ...req.body };

                if (req.file) {
                    payload.kontrak_file_path = `${baseUrl}/uploads/pkwt/${req.file.filename}`;
                    payload.kontrak_file_name = req.file.originalname;
                }

                const data = await kontrakService.create(payload);
                return res.status(201).json({
                    success: true,
                    message: "Kontrak berhasil dibuat",
                    data,
                });
            } catch (error) {
                console.error("KontrakController.store error:", error);
                return res.status(500).json({
                    success: false,
                    message: "Gagal membuat kontrak",
                    error: error.message,
                });
            }
        });
    }

    async update(req, res) {
        uploadKontrak.single("file")(req, res, async (err) => {
            try {
                if (err) {
                    console.error("Multer error during update:", err);
                    return res.status(400).json({
                        success: false,
                        message: err.message,
                    });
                }

                // Pastikan req.body terdefinisi
                if (!req.body) {
                    return res.status(400).json({
                        success: false,
                        message: "Request body is missing",
                    });
                }

                const baseUrl = `${req.protocol}://${req.get("host")}`;
                const payload = { ...req.body };

                if (req.file) {
                    payload.kontrak_file_path = `${baseUrl}/uploads/pkwt/${req.file.filename}`;
                    payload.kontrak_file_name = req.file.originalname;
                }

                const data = await kontrakService.update(req.params.id, payload);
                if (!data) {
                    return res.status(404).json({
                        success: false,
                        message: "Kontrak tidak ditemukan",
                    });
                }
                return res.status(200).json({
                    success: true,
                    message: "Kontrak berhasil diupdate",
                    data,
                });
            } catch (error) {
                console.error("KontrakController.update error:", error);
                return res.status(500).json({
                    success: false,
                    message: "Gagal mengupdate kontrak",
                    error: error.message,
                });
            }
        });
    }

    async destroy(req, res) {
        try {
            const ok = await kontrakService.delete(req.params.id);
            if (!ok) {
                return res.status(404).json({
                    success: false,
                    message: "Kontrak tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Kontrak berhasil dihapus",
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus kontrak",
                error: error.message,
            });
        }
    }
}

export default new KontrakController();