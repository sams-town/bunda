import settingService from "../services/SettingService.js";

class SettingController {
    /**
     * GET /api/settings
     */
    async index(req, res) {
        try {
            const result = await settingService.getAll(req.query);
            return res.status(200).json({
                success: true,
                message: "Data settings berhasil diambil",
                ...result,
            });
        } catch (error) {
            console.error("SettingController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data settings",
                error: error.message,
            });
        }
    }

    /**
     * GET /api/settings/:id
     */
    async show(req, res) {
        try {
            const record = await settingService.getById(req.params.id);
            if (!record) {
                return res.status(404).json({
                    success: false,
                    message: "Setting tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Data setting berhasil diambil",
                data: record,
            });
        } catch (error) {
            console.error("SettingController.show error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data setting",
                error: error.message,
            });
        }
    }

    /**
     * POST /api/settings
     */
    async store(req, res) {
        try {
            const data = { ...req.body };
            if (req.files) {
                if (req.files.logo && req.files.logo.length > 0) {
                    data.logo = `/uploads/logos/${req.files.logo[0].filename}`;
                }
                if (req.files.form_cuti && req.files.form_cuti.length > 0) {
                    data.file_form_cuti = `/uploads/logos/${req.files.form_cuti[0].filename}`;
                }
                if (req.files.slip_gaji && req.files.slip_gaji.length > 0) {
                    data.file_slip_gaji = `/uploads/logos/${req.files.slip_gaji[0].filename}`;
                }
                if (req.files.form_lembur && req.files.form_lembur.length > 0) {
                    data.file_form_lembur = `/uploads/logos/${req.files.form_lembur[0].filename}`;
                }
            } else if (req.file) {
                 data.logo = `/uploads/logos/${req.file.filename}`;
            }

            const record = await settingService.create(data);
            return res.status(201).json({
                success: true,
                message: "Setting berhasil dibuat",
                data: record,
            });
        } catch (error) {
            console.error("SettingController.store error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal membuat setting",
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/settings/:id
     */
    async update(req, res) {
        try {
            const data = { ...req.body };
            if (req.files) {
                if (req.files.logo && req.files.logo.length > 0) {
                    data.logo = `/uploads/logos/${req.files.logo[0].filename}`;
                }
                if (req.files.form_cuti && req.files.form_cuti.length > 0) {
                    data.file_form_cuti = `/uploads/logos/${req.files.form_cuti[0].filename}`;
                }
                if (req.files.slip_gaji && req.files.slip_gaji.length > 0) {
                    data.file_slip_gaji = `/uploads/logos/${req.files.slip_gaji[0].filename}`;
                }
                if (req.files.form_lembur && req.files.form_lembur.length > 0) {
                    data.file_form_lembur = `/uploads/logos/${req.files.form_lembur[0].filename}`;
                }
            } else if (req.file) {
                 data.logo = `/uploads/logos/${req.file.filename}`;
            }

            const record = await settingService.update(req.params.id, data);
            if (!record) {
                return res.status(404).json({
                    success: false,
                    message: "Setting tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Setting berhasil diupdate",
                data: record,
            });
        } catch (error) {
            console.error("SettingController.update error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengupdate setting",
                error: error.message,
            });
        }
    }

    /**
     * DELETE /api/settings/:id
     */
    async destroy(req, res) {
        try {
            const result = await settingService.delete(req.params.id);
            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Setting tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Setting berhasil dihapus",
            });
        } catch (error) {
            console.error("SettingController.destroy error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus setting",
                error: error.message,
            });
        }
    }
}

export default new SettingController();
