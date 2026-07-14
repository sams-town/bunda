import kategoriReimbursementService from "../services/KategoriReimbursementService.js";

class KategoriReimbursementController {
    /**
     * GET /api/kategori-reimbursement
     */
    async index(req, res) {
        try {
            const data = await kategoriReimbursementService.getAll(req.query);
            return res.status(200).json({
                success: true,
                message: "Data kategori reimbursement berhasil diambil",
                data
            });
        } catch (error) {
            console.error("KategoriReimbursementController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data kategori reimbursement",
                error: error.message
            });
        }
    }

    /**
     * POST /api/kategori-reimbursement
     */
    async store(req, res) {
        try {
            const data = await kategoriReimbursementService.create(req.body);
            return res.status(201).json({
                success: true,
                message: "Kategori reimbursement berhasil ditambahkan",
                data
            });
        } catch (error) {
            console.error("KategoriReimbursementController.store error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menambahkan kategori reimbursement",
                error: error.message
            });
        }
    }

    /**
     * PUT /api/kategori-reimbursement/:id
     */
    async update(req, res) {
        try {
            const data = await kategoriReimbursementService.update(req.params.id, req.body);
            return res.status(200).json({
                success: true,
                message: "Kategori reimbursement berhasil diperbarui",
                data
            });
        } catch (error) {
            console.error("KategoriReimbursementController.update error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal memperbarui kategori reimbursement",
                error: error.message
            });
        }
    }

    /**
     * DELETE /api/kategori-reimbursement/:id
     */
    async destroy(req, res) {
        try {
            const success = await kategoriReimbursementService.delete(req.params.id);
            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: "Kategori reimbursement tidak ditemukan"
                });
            }
            return res.status(200).json({
                success: true,
                message: "Kategori reimbursement berhasil dihapus"
            });
        } catch (error) {
            console.error("KategoriReimbursementController.destroy error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus kategori reimbursement",
                error: error.message
            });
        }
    }
}

export default new KategoriReimbursementController();
