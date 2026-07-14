import userService from "../services/UserService.js";

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
     */
    async faceRecognition(req, res) {
        try {
            const baseUrl = `${req.protocol}://${req.get("host")}`;
            let photoPath = null;
            let userId = req.params.id || req.body.user_id;

            // 1. Handle Multipart File Upload
            if (req.file) {
                photoPath = `${baseUrl}/uploads/profile/${req.file.filename}`;
            }
            // 2. Handle Base64 via JSON Body
            else if (req.body.foto_face_recognition && req.body.foto_face_recognition.startsWith("data:image")) {
                const { saveBase64Image } = await import("../middleware/uploadMiddleware.js");
                const savedPath = saveBase64Image(req.body.foto_face_recognition, "profile", "face");
                photoPath = `${baseUrl}${savedPath}`;
            }

            if (!photoPath) {
                return res.status(400).json({
                    success: false,
                    message: "Foto face recognition (file atau base64) wajib diupload",
                });
            }

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "user_id wajib disertakan dalam body atau URL parameter",
                });
            }

            const user = await userService.updateFaceRecognition(userId, photoPath, req.user);

            return res.status(200).json({
                success: true,
                message: "Foto face recognition berhasil diperbarui",
                data: user,
            });
        } catch (error) {
            console.error("UserController.faceRecognition error:", error);
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
}

export default new UserController();
