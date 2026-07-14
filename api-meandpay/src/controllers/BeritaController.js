import beritaService from "../services/BeritaService.js";

class BeritaController {
    /**
     * GET /api/beritas
     */
    async index(req, res) {
        try {
            const result = await beritaService.getAll(req.query);
            return res.status(200).json({
                success: true,
                message: "Data berita berhasil diambil",
                ...result,
            });
        } catch (error) {
            console.error("BeritaController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data berita",
                error: error.message,
            });
        }
    }

    /**
     * GET /api/beritas/:id
     */
    async show(req, res) {
        try {
            const record = await beritaService.getById(req.params.id);
            if (!record) {
                return res.status(404).json({
                    success: false,
                    message: "Berita tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Data berita berhasil diambil",
                data: record,
            });
        } catch (error) {
            console.error("BeritaController.show error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data berita",
                error: error.message,
            });
        }
    }

    /**
     * POST /api/beritas
     */
    async store(req, res) {
        try {
            const baseUrl = `${req.protocol}://${req.get("host")}`;
            const record = await beritaService.create(req.body, req.file, baseUrl);
            return res.status(201).json({
                success: true,
                message: "Berita berhasil dibuat",
                data: record,
            });
        } catch (error) {
            console.error("BeritaController.store error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal membuat berita",
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/beritas/:id
     */
    async update(req, res) {
        try {
            const baseUrl = `${req.protocol}://${req.get("host")}`;
            const record = await beritaService.update(req.params.id, req.body, req.file, baseUrl);
            if (!record) {
                return res.status(404).json({
                    success: false,
                    message: "Berita tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Berita berhasil diupdate",
                data: record,
            });
        } catch (error) {
            console.error("BeritaController.update error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengupdate berita",
                error: error.message,
            });
        }
    }

    /**
     * DELETE /api/beritas/:id
     */
    async destroy(req, res) {
        try {
            const result = await beritaService.delete(req.params.id);
            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Berita tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Berita berhasil dihapus",
            });
        } catch (error) {
            console.error("BeritaController.destroy error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus berita",
                error: error.message,
            });
        }
    }
}

export default new BeritaController();
