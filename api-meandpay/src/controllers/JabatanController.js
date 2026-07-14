import jabatanService from "../services/JabatanService.js";

class JabatanController {
    /**
     * GET /api/jabatans
     */
    async index(req, res) {
        try {
            const result = await jabatanService.getAll(req.query);

            return res.status(200).json({
                success: true,
                message: "Data jabatan berhasil diambil",
                ...result,
            });
        } catch (error) {
            console.error("JabatanController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data jabatan",
                error: error.message,
            });
        }
    }

    /**
     * GET /api/jabatans/:id
     */
    async show(req, res) {
        try {
            const jabatan = await jabatanService.getById(req.params.id);

            if (!jabatan) {
                return res.status(404).json({
                    success: false,
                    message: "Jabatan tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Data jabatan berhasil diambil",
                data: jabatan,
            });
        } catch (error) {
            console.error("JabatanController.show error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data jabatan",
                error: error.message,
            });
        }
    }

    /**
     * POST /api/jabatans
     */
    async store(req, res) {
        try {
            if (!req.body.nama_jabatan) {
                return res.status(400).json({
                    success: false,
                    message: "Field 'nama_jabatan' wajib diisi",
                });
            }

            const jabatan = await jabatanService.create(req.body);

            return res.status(201).json({
                success: true,
                message: "Jabatan berhasil dibuat",
                data: jabatan,
            });
        } catch (error) {
            console.error("JabatanController.store error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal membuat jabatan",
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/jabatans/:id
     */
    async update(req, res) {
        try {
            const jabatan = await jabatanService.update(req.params.id, req.body);

            if (!jabatan) {
                return res.status(404).json({
                    success: false,
                    message: "Jabatan tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Jabatan berhasil diupdate",
                data: jabatan,
            });
        } catch (error) {
            console.error("JabatanController.update error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengupdate jabatan",
                error: error.message,
            });
        }
    }

    /**
     * DELETE /api/jabatans/:id
     */
    async destroy(req, res) {
        try {
            const result = await jabatanService.delete(req.params.id);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Jabatan tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Jabatan berhasil dihapus",
            });
        } catch (error) {
            console.error("JabatanController.destroy error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus jabatan",
                error: error.message,
            });
        }
    }
}

export default new JabatanController();
