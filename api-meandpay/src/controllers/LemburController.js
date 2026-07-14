import lemburService from "../services/LemburService.js";

class LemburController {
    /**
     * GET /api/lemburs
     */
    async index(req, res) {
        try {
            const result = await lemburService.getAll(req.query);
            return res.status(200).json({
                success: true,
                message: "Data lembur berhasil diambil",
                ...result,
            });
        } catch (error) {
            console.error("LemburController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data lembur",
                error: error.message,
            });
        }
    }

    /**
     * GET /api/lemburs/:id
     */
    async show(req, res) {
        try {
            const data = await lemburService.getById(req.params.id);
            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: "Data lembur tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Data lembur berhasil diambil",
                data,
            });
        } catch (error) {
            console.error("LemburController.show error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data lembur",
                error: error.message,
            });
        }
    }

    /**
     * GET /api/lemburs/:user_id
     */
    async showUser(req, res) {
        try {
            const data = await lemburService.getByUserId(req.params.user_id);
            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: "Data lembur tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Data lembur berhasil diambil",
                data,
            });
        } catch (error) {
            console.error("LemburController.showUser error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data lembur",
                error: error.message,
            });
        }
    }

    /**
     * POST /api/lemburs (Store start overtime)
     */
    async store(req, res) {
        try {
            const baseUrl = `${req.protocol}://${req.get("host")}`;
            const payload = { ...req.body };

            if (req.files) {
                if (req.files.foto_jam_masuk) {
                    payload.foto_jam_masuk = `/lemburs/${req.files.foto_jam_masuk[0].filename}`;
                }
                if (req.files.foto_jam_keluar) {
                    payload.foto_jam_keluar = `/lemburs/${req.files.foto_jam_keluar[0].filename}`;
                }
                if (req.files.file_lembur) {
                    payload.file_lembur = `/lemburs/${req.files.file_lembur[0].filename}`;
                }
            }

            if (!payload.user_id || !payload.lokasi_id || !payload.tanggal || !payload.jam_masuk) {
                return res.status(400).json({
                    success: false,
                    message: "Field user_id, lokasi_id, tanggal, dan jam_masuk wajib diisi",
                });
            }

            const data = await lemburService.create(payload, baseUrl);
            return res.status(201).json({
                success: true,
                message: "Data lembur berhasil dibuat",
                data,
            });
        } catch (error) {
            console.error("LemburController.store error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal membuat data lembur",
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/lemburs/:id (Update or finish overtime)
     */
    async update(req, res) {
        try {
            const baseUrl = `${req.protocol}://${req.get("host")}`;
            const payload = { ...req.body };

            if (req.files) {
                if (req.files.foto_jam_masuk) {
                    payload.foto_jam_masuk = `/lemburs/${req.files.foto_jam_masuk[0].filename}`;
                }
                if (req.files.foto_jam_keluar) {
                    payload.foto_jam_keluar = `/lemburs/${req.files.foto_jam_keluar[0].filename}`;
                }
                if (req.files.file_lembur) {
                    payload.file_lembur = `/lemburs/${req.files.file_lembur[0].filename}`;
                }
            }

            const data = await lemburService.update(req.params.id, payload, baseUrl);
            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: "Data lembur tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Data lembur berhasil diperbarui",
                data,
            });
        } catch (error) {
            console.error("LemburController.update error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal memperbarui data lembur",
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/lemburs/:id/approve
     */
    async approve(req, res) {
        try {
            // Priority: 1. req.body.approved_by, 2. req.user.id (from token)
            let { status, approved_by, notes } = req.body;

            if (!approved_by && req.user && req.user.id) {
                approved_by = req.user.id;
            }

            // approved_by is mandatory
            if (!approved_by) {
                return res.status(400).json({
                    success: false,
                    message: "Field 'approved_by' (ID admin/manager) wajib diisi atau sertakan token login",
                });
            }

            const data = await lemburService.approve(req.params.id, {
                status: status || "Approved",
                approved_by,
                notes
            });

            return res.status(200).json({
                success: true,
                message: `Lembur berhasil di-${(status || "Approved").toLowerCase()}`,
                data,
            });
        } catch (error) {
            console.error("LemburController.approve error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal memproses approval lembur",
                error: error.message,
            });
        }
    }

    /**
     * DELETE /api/lemburs/:id
     */
    async destroy(req, res) {
        try {
            const ok = await lemburService.delete(req.params.id);
            if (!ok) {
                return res.status(404).json({
                    success: false,
                    message: "Data lembur tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Data lembur berhasil dihapus",
            });
        } catch (error) {
            console.error("LemburController.destroy error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus data lembur",
                error: error.message,
            });
        }
    }
}

export default new LemburController();
