import penugasanService from "../services/PenugasanService.js";

class PenugasanController {
    /**
     * GET /api/penugasans
     */
    async index(req, res) {
        try {
            const result = await penugasanService.getAll(req.query);

            return res.status(200).json({
                success: true,
                message: "Data penugasan berhasil diambil",
                ...result,
            });
        } catch (error) {
            console.error("PenugasanController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data penugasan",
                error: error.message,
            });
        }
    }

    /**
     * GET /api/penugasans/:id
     */
    async show(req, res) {
        try {
            const penugasan = await penugasanService.getById(req.params.id);

            if (!penugasan) {
                return res.status(404).json({
                    success: false,
                    message: "Penugasan tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Data penugasan berhasil diambil",
                data: penugasan,
            });
        } catch (error) {
            console.error("PenugasanController.show error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data penugasan",
                error: error.message,
            });
        }
    }

    /**
     * POST /api/penugasans
     */
    async store(req, res) {
        try {
            if (!req.body.user_id) {
                return res.status(400).json({
                    success: false,
                    message: "Field 'user_id' wajib diisi",
                });
            }

            if (!req.body.judul) {
                return res.status(400).json({
                    success: false,
                    message: "Field 'judul' wajib diisi",
                });
            }

            const penugasan = await penugasanService.create(req.body);

            return res.status(201).json({
                success: true,
                message: "Penugasan berhasil dibuat",
                data: penugasan,
            });
        } catch (error) {
            console.error("PenugasanController.store error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal membuat penugasan",
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/penugasans/:id
     */
    async update(req, res) {
        try {
            const penugasan = await penugasanService.update(req.params.id, req.body);

            if (!penugasan) {
                return res.status(404).json({
                    success: false,
                    message: "Penugasan tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Penugasan berhasil diupdate",
                data: penugasan,
            });
        } catch (error) {
            console.error("PenugasanController.update error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengupdate penugasan",
                error: error.message,
            });
        }
    }

    /**
     * DELETE /api/penugasans/:id
     */
    async destroy(req, res) {
        try {
            const result = await penugasanService.delete(req.params.id);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Penugasan tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Penugasan berhasil dihapus",
            });
        } catch (error) {
            console.error("PenugasanController.destroy error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus penugasan",
                error: error.message,
            });
        }
    }
}

export default new PenugasanController();
