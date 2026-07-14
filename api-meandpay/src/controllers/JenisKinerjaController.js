import jenisKinerjaService from "../services/JenisKinerjaService.js";

class JenisKinerjaController {
    /**
     * GET /api/jenis-kinerjas
     */
    async index(req, res) {
        try {
            const result = await jenisKinerjaService.getAll(req.query);

            return res.status(200).json({
                success: true,
                message: "Data jenis kinerja berhasil diambil",
                ...result,
            });
        } catch (error) {
            console.error("JenisKinerjaController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data jenis kinerja",
                error: error.message,
            });
        }
    }

    /**
     * GET /api/jenis-kinerjas/:id
     */
    async show(req, res) {
        try {
            const data = await jenisKinerjaService.getById(req.params.id);

            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: "Jenis Kinerja tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Data jenis kinerja berhasil diambil",
                data,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data jenis kinerja",
                error: error.message,
            });
        }
    }

    /**
     * POST /api/jenis-kinerjas
     */
    async store(req, res) {
        try {
            if (!req.body.nama || !req.body.bobot) {
                return res.status(400).json({
                    success: false,
                    message: "Field 'nama' dan 'bobot' wajib diisi",
                });
            }

            const created = await jenisKinerjaService.create(req.body);

            return res.status(201).json({
                success: true,
                message: "Jenis Kinerja berhasil dibuat",
                data: created,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Gagal membuat jenis kinerja",
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/jenis-kinerjas/:id
     */
    async update(req, res) {
        try {
            const updated = await jenisKinerjaService.update(req.params.id, req.body);

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: "Jenis Kinerja tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Jenis Kinerja berhasil diupdate",
                data: updated,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Gagal mengupdate jenis kinerja",
                error: error.message,
            });
        }
    }

    /**
     * DELETE /api/jenis-kinerjas/:id
     */
    async destroy(req, res) {
        try {
            const result = await jenisKinerjaService.delete(req.params.id);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Jenis Kinerja tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Jenis Kinerja berhasil dihapus",
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus jenis kinerja",
                error: error.message,
            });
        }
    }
}

export default new JenisKinerjaController();
