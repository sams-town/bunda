import fileService from "../services/FileService.js";

class FileController {
    /**
     * GET /api/documents
     */
    async index(req, res) {
        try {
            const result = await fileService.getAll(req.query);
            return res.status(200).json({
                success: true,
                message: "Data dokumen berhasil diambil",
                ...result,
            });
        } catch (error) {
            console.error("FileController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data dokumen",
                error: error.message,
            });
        }
    }

    /**
     * POST /api/documents
     */
    async store(req, res) {
        try {
            if (!req.body.user_id || !req.body.nama_dokumen) {
                return res.status(400).json({
                    success: false,
                    message: "User ID dan Nama Dokumen wajib diisi",
                });
            }

            const data = await fileService.create(req.body, req.file);
            return res.status(201).json({
                success: true,
                message: "Dokumen berhasil diunggah",
                data,
            });
        } catch (error) {
            console.error("FileController.store error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengunggah dokumen",
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/documents/:id
     */
    async update(req, res) {
        try {
            const data = await fileService.update(req.params.id, req.body, req.file);
            return res.status(200).json({
                success: true,
                message: "Dokumen berhasil diperbarui",
                data,
            });
        } catch (error) {
            console.error("FileController.update error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal memperbarui dokumen",
                error: error.message,
            });
        }
    }

    /**
     * DELETE /api/documents/:id
     */
    async destroy(req, res) {
        try {
            const ok = await fileService.delete(req.params.id);
            if (!ok) {
                return res.status(404).json({
                    success: false,
                    message: "Dokumen tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Dokumen berhasil dihapus",
            });
        } catch (error) {
            console.error("FileController.destroy error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus dokumen",
                error: error.message,
            });
        }
    }
}

export default new FileController();
