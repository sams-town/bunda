import pegawaiKeluarService from "../services/PegawaiKeluarService.js";
import { createUploadMiddleware } from "../middleware/uploadMiddleware.js";

// Upload khusus pegawai keluar
const uploadPegawaiKeluar = createUploadMiddleware(
    "pkwt", // folder yang sama dengan kontrak
    "pegawai-keluar",
    ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    5 * 1024 * 1024 // 5MB
);

class PegawaiKeluarController {
    async index(req, res) {
        try {
            const result = await pegawaiKeluarService.getAll(req.query);
            return res.status(200).json({
                success: true,
                message: "Data pegawai keluar berhasil diambil",
                ...result,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data pegawai keluar",
                error: error.message,
            });
        }
    }

    async show(req, res) {
        try {
            const data = await pegawaiKeluarService.getById(req.params.id);
            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: "Pegawai keluar tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Data pegawai keluar berhasil diambil",
                data,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data pegawai keluar",
                error: error.message,
            });
        }
    }

    async store(req, res) {
        uploadPegawaiKeluar.single("file")(req, res, async (err) => {
            try {
                if (err) {
                    return res.status(400).json({
                        success: false,
                        message: err.message,
                    });
                }
                if (!req.body.user_id) {
                    return res.status(400).json({
                        success: false,
                        message: "Field 'user_id' wajib diisi",
                    });
                }
                const baseUrl = `${req.protocol}://${req.get("host")}`;
                const payload = { ...req.body };
                if (req.file) {
                    payload.pegawai_keluar_file_path = `${baseUrl}/uploads/pkwt/${req.file.filename}`;
                    payload.pegawai_keluar_file_name = req.file.originalname;
                }
                const data = await pegawaiKeluarService.create(payload);
                return res.status(201).json({
                    success: true,
                    message: "Pegawai keluar berhasil dibuat",
                    data,
                });
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: "Gagal membuat pegawai keluar",
                    error: error.message,
                });
            }
        });
    }

    async update(req, res) {
        uploadPegawaiKeluar.single("file")(req, res, async (err) => {
            try {
                if (err) {
                    return res.status(400).json({
                        success: false,
                        message: err.message,
                    });
                }
                const baseUrl = `${req.protocol}://${req.get("host")}`;
                const payload = { ...req.body };
                if (req.file) {
                    payload.pegawai_keluar_file_path = `${baseUrl}/uploads/pkwt/${req.file.filename}`;
                    payload.pegawai_keluar_file_name = req.file.originalname;
                }
                const data = await pegawaiKeluarService.update(req.params.id, payload);
                if (!data) {
                    return res.status(404).json({
                        success: false,
                        message: "Pegawai keluar tidak ditemukan",
                    });
                }
                return res.status(200).json({
                    success: true,
                    message: "Pegawai keluar berhasil diupdate",
                    data,
                });
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: "Gagal mengupdate pegawai keluar",
                    error: error.message,
                });
            }
        });
    }

    async approve(req, res) {
        try {
            const { approved_by, notes } = req.body || {};
            if (!approved_by) {
                return res.status(400).json({
                    success: false,
                    message: "Field 'approved_by' wajib diisi",
                });
            }
            const data = await pegawaiKeluarService.approve(req.params.id, {
                approved_by,
                notes,
            });
            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: "Pegawai keluar tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Pegawai keluar berhasil di-approve",
                data,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Gagal meng-approve pegawai keluar",
                error: error.message,
            });
        }
    }

    async destroy(req, res) {
        try {
            const ok = await pegawaiKeluarService.delete(req.params.id);
            if (!ok) {
                return res.status(404).json({
                    success: false,
                    message: "Pegawai keluar tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Pegawai keluar berhasil dihapus",
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus pegawai keluar",
                error: error.message,
            });
        }
    }

    async restore(req, res) {
        try {
            const ok = await pegawaiKeluarService.restore(req.params.id);
            if (!ok) {
                return res.status(404).json({
                    success: false,
                    message: "Pegawai keluar tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Pegawai berhasil dipulangkan ke pegawai aktif",
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Gagal memulangkan pegawai keluar",
                error: error.message,
            });
        }
    }
}

export default new PegawaiKeluarController();