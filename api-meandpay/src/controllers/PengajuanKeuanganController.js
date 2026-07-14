import PengajuanKeuanganService from "../services/PengajuanKeuanganService.js";

class PengajuanKeuanganController {
    async index(req, res) {
        try {
            const result = await PengajuanKeuanganService.getAll(req.query);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Gagal mengambil data pengajuan keuangan",
                error: error.message
            });
        }
    }

    async show(req, res) {
        try {
            const result = await PengajuanKeuanganService.getById(req.params.id);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Gagal mengambil detail pengajuan keuangan",
                error: error.message
            });
        }
    }

    async store(req, res) {
        try {
            const result = await PengajuanKeuanganService.create(req.body, req.files || {});
            res.status(201).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Gagal menambahkan pengajuan keuangan",
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            // Some forms post to update, handle files
            const result = await PengajuanKeuanganService.update(req.params.id, req.body, req.files || {});
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Gagal memperbarui pengajuan keuangan",
                error: error.message
            });
        }
    }

    async destroy(req, res) {
        try {
            const result = await PengajuanKeuanganService.delete(req.params.id);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Gagal menghapus pengajuan keuangan",
                error: error.message
            });
        }
    }
}

export default new PengajuanKeuanganController();
