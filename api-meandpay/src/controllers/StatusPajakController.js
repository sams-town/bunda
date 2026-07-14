import statusPajakService from "../services/StatusPajakService.js";

class StatusPajakController {
    async index(req, res) {
        try {
            const result = await statusPajakService.getAll(req.query);
            return res.status(200).json({
                success: true,
                message: "Data status pajak berhasil diambil",
                ...result,
            });
        } catch (error) {
            console.error("StatusPajakController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data status pajak",
                error: error.message,
            });
        }
    }

    async show(req, res) {
        try {
            const data = await statusPajakService.getById(req.params.id);
            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: "Status pajak tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Data status pajak berhasil diambil",
                data,
            });
        } catch (error) {
            console.error("StatusPajakController.show error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data status pajak",
                error: error.message,
            });
        }
    }

    async store(req, res) {
        try {
            if (!req.body.name) {
                return res.status(400).json({
                    success: false,
                    message: "Field 'name' wajib diisi",
                });
            }
            const data = await statusPajakService.create(req.body);
            return res.status(201).json({
                success: true,
                message: "Status pajak berhasil dibuat",
                data,
            });
        } catch (error) {
            console.error("StatusPajakController.store error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal membuat status pajak",
                error: error.message,
            });
        }
    }

    async update(req, res) {
        try {
            const data = await statusPajakService.update(req.params.id, req.body);
            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: "Status pajak tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Status pajak berhasil diupdate",
                data,
            });
        } catch (error) {
            console.error("StatusPajakController.update error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengupdate status pajak",
                error: error.message,
            });
        }
    }

    async destroy(req, res) {
        try {
            const result = await statusPajakService.delete(req.params.id);
            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Status pajak tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Status pajak berhasil dihapus",
            });
        } catch (error) {
            console.error("StatusPajakController.destroy error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus status pajak",
                error: error.message,
            });
        }
    }
}

export default new StatusPajakController();
