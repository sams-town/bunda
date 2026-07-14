import kunjunganService from "../services/KunjunganService.js";

class KunjunganController {
    /**
     * GET /api/kunjungan
     */
    async index(req, res) {
        try {
            const result = await kunjunganService.getAll(req.query);

            return res.status(200).json({
                success: true,
                message: "Data kunjungan berhasil diambil",
                ...result,
            });
        } catch (error) {
            console.error("KunjunganController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data kunjungan",
                error: error.message,
            });
        }
    }

    /**
     * GET /api/kunjungan/:id
     */
    async show(req, res) {
        try {
            const kunjungan = await kunjunganService.getById(req.params.id);

            if (!kunjungan) {
                return res.status(404).json({
                    success: false,
                    message: "Kunjungan tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Data kunjungan berhasil diambil",
                data: kunjungan,
            });
        } catch (error) {
            console.error("KunjunganController.show error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data kunjungan",
                error: error.message,
            });
        }
    }

    /**
     * POST /api/kunjungan
     */
    async store(req, res) {
        try {
            if (!req.body.user_id) {
                return res.status(400).json({
                    success: false,
                    message: "Field 'user_id' wajib diisi",
                });
            }

            // Map frontend fields to database schema for Visit In
            if (req.file) {
                const baseUrl = `${req.protocol}://${req.get("host")}`;
                req.body.foto_in = `${baseUrl}/uploads/kunjungans/${req.file.filename}`;
            }

            if (req.body.keterangan !== undefined) {
                req.body.keterangan_in = req.body.keterangan;
                delete req.body.keterangan; // Hapus biar Prisma tidak error Schema
            }

            const kunjungan = await kunjunganService.create(req.body);

            return res.status(201).json({
                success: true,
                message: "Kunjungan berhasil dibuat",
                data: kunjungan,
            });
        } catch (error) {
            console.error("KunjunganController.store error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal membuat kunjungan",
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/kunjungan/:id
     */
    async update(req, res) {
        try {
            // Map frontend fields to database schema for Visit Out (Or Edit)
            if (req.file) {
                // Determine if this is an update for 'foto_out' (Visit Out) or general edit. 
                // Assuming default is visit_out if file uploaded during update.
                const baseUrl = `${req.protocol}://${req.get("host")}`;
                req.body.foto_out = `${baseUrl}/uploads/kunjungans/${req.file.filename}`;
            }

            if (req.body.keterangan !== undefined) {
                req.body.keterangan_out = req.body.keterangan;
                delete req.body.keterangan; // Hapus biar Prisma tidak error Schema
            }

            const kunjungan = await kunjunganService.update(req.params.id, req.body);

            if (!kunjungan) {
                return res.status(404).json({
                    success: false,
                    message: "Kunjungan tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Kunjungan berhasil diupdate",
                data: kunjungan,
            });
        } catch (error) {
            console.error("KunjunganController.update error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengupdate kunjungan",
                error: error.message,
            });
        }
    }

    /**
     * DELETE /api/kunjungan/:id
     */
    async destroy(req, res) {
        try {
            const result = await kunjunganService.delete(req.params.id);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Kunjungan tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Kunjungan berhasil dihapus",
            });
        } catch (error) {
            console.error("KunjunganController.destroy error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus kunjungan",
                error: error.message,
            });
        }
    }
}

export default new KunjunganController();
