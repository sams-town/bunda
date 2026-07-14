import dinasLuarService from "../services/DinasLuarService.js";

class DinasLuarController {
    async index(req, res) {
        try {
            const result = await dinasLuarService.getAll(req.query);
            return res.status(200).json({ success: true, message: "Data dinas luar berhasil diambil", ...result });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data dinas luar", error: error.message });
        }
    }

    async show(req, res) {
        try {
            const data = await dinasLuarService.getById(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Dinas luar tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Data dinas luar berhasil diambil", data });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data dinas luar", error: error.message });
        }
    }
    async showUser(req, res) {
        try {
            const data = await dinasLuarService.getByUserId(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Dinas luar tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Data dinas luar berhasil diambil", data });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data dinas luar", error: error.message });
        }
    }

    async store(req, res) {
        try {
            const payload = { ...req.body };

            if (req.files && Array.isArray(req.files)) {
                const fotoAbsen = req.files.find(f => f.fieldname === "foto_jam_absen" || f.fieldname === "foto_masuk" || f.fieldname === "foto");
                if (fotoAbsen) {
                    payload.foto_jam_absen = `/uploads/dinasluar/${fotoAbsen.filename}`;
                }
                
                const fotoPulang = req.files.find(f => f.fieldname === "foto_jam_pulang" || f.fieldname === "foto_keluar");
                if (fotoPulang) {
                    payload.foto_jam_pulang = `/uploads/dinasluar/${fotoPulang.filename}`;
                }
            } else if (req.files) {
                 // Fallback if some other middleware format
                 if (req.files.foto_jam_absen && req.files.foto_jam_absen.length > 0) {
                    payload.foto_jam_absen = `/uploads/dinasluar/${req.files.foto_jam_absen[0].filename}`;
                }
                if (req.files.foto_jam_pulang && req.files.foto_jam_pulang.length > 0) {
                    payload.foto_jam_pulang = `/uploads/dinasluar/${req.files.foto_jam_pulang[0].filename}`;
                }
            }

            const data = await dinasLuarService.create(payload);
            return res.status(201).json({ success: true, message: "Dinas luar berhasil dibuat", data });
        } catch (error) {
            console.error("DinasLuarController.store error:", error);
            return res.status(500).json({ success: false, message: "Gagal membuat dinas luar", error: error.message });
        }
    }

    async bulkStore(req, res) {
        try {
            const { user_id, shift_id, start_date, end_date } = req.body;

            if (!user_id || !shift_id || !start_date || !end_date) {
                return res.status(400).json({
                    success: false,
                    message: "user_id, shift_id, start_date, dan end_date wajib diisi"
                });
            }

            const result = await dinasLuarService.bulkCreateRange(req.body);

            return res.status(201).json({
                success: true,
                message: "Dinas luar berhasil dibuat untuk rentang tanggal tersebut",
                ...result
            });
        } catch (error) {
            console.error("DinasLuarController.bulkStore error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal membuat dinas luar",
                error: error.message
            });
        }
    }

    async bulkUpdate(req, res) {
        try {
            const { user_id, start_date, end_date, shift_id } = req.body;
            if (!user_id || !start_date || !end_date || !shift_id) {
                return res.status(400).json({ success: false, message: "user_id, start_date, end_date, dan shift_id wajib diisi" });
            }

            const result = await dinasLuarService.bulkUpdateRange(req.body);
            return res.status(200).json({ success: true, message: `${result.count} data dinas luar berhasil diupdate`, ...result });
        } catch (error) {
            console.error("DinasLuarController.bulkUpdate error:", error);
            return res.status(500).json({ success: false, message: "Gagal mengupdate massal dinas luar", error: error.message });
        }
    }

    async bulkDestroy(req, res) {
        try {
            const { user_id, start_date, end_date } = req.body;
            if (!user_id || !start_date || !end_date) {
                return res.status(400).json({ success: false, message: "user_id, start_date, dan end_date wajib diisi" });
            }

            const result = await dinasLuarService.bulkDeleteRange(req.body);
            return res.status(200).json({ success: true, message: `${result.count} data dinas luar berhasil dihapus`, ...result });
        } catch (error) {
            console.error("DinasLuarController.bulkDestroy error:", error);
            return res.status(500).json({ success: false, message: "Gagal menghapus massal dinas luar", error: error.message });
        }
    }

    async update(req, res) {
        try {
            const baseUrl = `${req.protocol}://${req.get("host")}`;
            const payload = { ...req.body };

            // Handle Multipart Files if they exist
            if (req.files) {
                if (req.files.foto_jam_absen) {
                    payload.foto_jam_absen = `${baseUrl}/uploads/dinasluar/${req.files.foto_jam_absen[0].filename}`;
                }
                if (req.files.foto_jam_pulang) {
                    payload.foto_jam_pulang = `${baseUrl}/uploads/dinasluar/${req.files.foto_jam_pulang[0].filename}`;
                }
            }

            const data = await dinasLuarService.update(req.params.id, payload);
            if (!data) return res.status(404).json({ success: false, message: "Dinas luar tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Dinas luar berhasil diupdate", data });
        } catch (error) {
            console.error("DinasLuarController.update error:", error);
            return res.status(500).json({ success: false, message: "Gagal mengupdate dinas luar", error: error.message });
        }
    }

    async destroy(req, res) {
        try {
            const ok = await dinasLuarService.delete(req.params.id);
            if (!ok) return res.status(404).json({ success: false, message: "Dinas luar tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Dinas luar berhasil dihapus" });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal menghapus dinas luar", error: error.message });
        }
    }
}

export default new DinasLuarController();
