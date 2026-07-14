import shiftService from "../services/ShiftService.js";

class ShiftController {
    /**
     * GET /api/shifts
     */
    async index(req, res) {
        try {
            const result = await shiftService.getAll(req.query);

            return res.status(200).json({
                success: true,
                message: "Data shift berhasil diambil",
                ...result,
            });
        } catch (error) {
            console.error("ShiftController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data shift",
                error: error.message,
            });
        }
    }

    /**
     * GET /api/shifts/:id
     */
    async show(req, res) {
        try {
            const shift = await shiftService.getById(req.params.id);

            if (!shift) {
                return res.status(404).json({
                    success: false,
                    message: "Shift tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Data shift berhasil diambil",
                data: shift,
            });
        } catch (error) {
            console.error("ShiftController.show error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data shift",
                error: error.message,
            });
        }
    }

    /**
     * POST /api/shifts
     */
    async store(req, res) {
        try {
            const { nama_shift, jam_masuk, jam_keluar, jam_mulai_istirahat, jam_selesai_istirahat } = req.body;

            if (!nama_shift || !jam_masuk || !jam_keluar) {
                return res.status(400).json({
                    success: false,
                    message: "Nama shift, jam masuk, dan jam keluar wajib diisi",
                });
            }

            const shift = await shiftService.create({
                nama_shift,
                jam_masuk,
                jam_keluar,
                jam_mulai_istirahat,
                jam_selesai_istirahat,
            });

            return res.status(201).json({
                success: true,
                message: "Shift berhasil dibuat",
                data: shift,
            });
        } catch (error) {
            console.error("ShiftController.store error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal membuat shift",
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/shifts/:id
     */
    async update(req, res) {
        try {
            const { nama_shift, jam_masuk, jam_keluar, jam_mulai_istirahat, jam_selesai_istirahat } = req.body;

            const shift = await shiftService.update(req.params.id, {
                nama_shift,
                jam_masuk,
                jam_keluar,
                jam_mulai_istirahat,
                jam_selesai_istirahat,
            });

            if (!shift) {
                return res.status(404).json({
                    success: false,
                    message: "Shift tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Shift berhasil diperbarui",
                data: shift,
            });
        } catch (error) {
            console.error("ShiftController.update error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal memperbarui shift",
                error: error.message,
            });
        }
    }

    /**
     * DELETE /api/shifts/:id
     */
    async destroy(req, res) {
        try {
            const success = await shiftService.delete(req.params.id);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: "Shift tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Shift berhasil dihapus",
            });
        } catch (error) {
            console.error("ShiftController.destroy error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus shift",
                error: error.message,
            });
        }
    }
}

export default new ShiftController();