import rapatService from "../services/RapatService.js";

class RapatController {
    /**
     * GET /api/rapats
     */
    async index(req, res) {
        try {
            const result = await rapatService.getAll(req.query);

            return res.status(200).json({
                success: true,
                message: "Data rapat berhasil diambil",
                ...result,
            });
        } catch (error) {
            console.error("RapatController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data rapat",
                error: error.message,
            });
        }
    }

    /**
     * GET /api/rapats/:id
     */
    async show(req, res) {
        try {
            const rapat = await rapatService.getById(req.params.id);

            if (!rapat) {
                return res.status(404).json({
                    success: false,
                    message: "Rapat tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Data rapat berhasil diambil",
                data: rapat,
            });
        } catch (error) {
            console.error("RapatController.show error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data rapat",
                error: error.message,
            });
        }
    }

    /**
     * POST /api/rapats
     */
    async store(req, res) {
        try {
            if (!req.body.nama) {
                return res.status(400).json({
                    success: false,
                    message: "Field 'nama' (Nama Pertemuan) wajib diisi",
                });
            }

            if (!req.body.tanggal) {
                return res.status(400).json({
                    success: false,
                    message: "Field 'tanggal' wajib diisi",
                });
            }

            const rapat = await rapatService.create(req.body);

            return res.status(201).json({
                success: true,
                message: "Rapat berhasil dibuat",
                data: rapat,
            });
        } catch (error) {
            console.error("RapatController.store error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal membuat rapat",
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/rapats/:id
     */
    async update(req, res) {
        try {
            const rapat = await rapatService.update(req.params.id, req.body);

            if (!rapat) {
                return res.status(404).json({
                    success: false,
                    message: "Rapat tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Rapat berhasil diupdate",
                data: rapat,
            });
        } catch (error) {
            console.error("RapatController.update error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengupdate rapat",
                error: error.message,
            });
        }
    }

    /**
     * DELETE /api/rapats/:id
     */
    async destroy(req, res) {
        try {
            const result = await rapatService.delete(req.params.id);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Rapat tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Rapat berhasil dihapus",
            });
        } catch (error) {
            console.error("RapatController.destroy error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus rapat",
                error: error.message,
            });
        }
    }
}

export default new RapatController();
