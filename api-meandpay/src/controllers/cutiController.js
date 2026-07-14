import cutiService from "../services/CutiService.js";

class CutiController {
    async index(req, res) {
        try {
            const result = await cutiService.getAll(req.query);
            return res.status(200).json({ success: true, message: "Data cuti berhasil diambil", ...result });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data cuti", error: error.message });
        }
    }

    async show(req, res) {
        try {
            const cuti = await cutiService.getById(req.params.id);
            if (!cuti) return res.status(404).json({ success: false, message: "Cuti tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Data cuti berhasil diambil", data: cuti });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data cuti", error: error.message });
        }
    }

    async showByUserId(req, res) {
        try {
            const cuti = await cutiService.getByUserId(req.params.userId);
            if (!cuti) return res.status(404).json({ success: false, message: "Cuti tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Data cuti berhasil diambil", data: cuti });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data cuti", error: error.message });
        }
    }

    async store(req, res) {
        try {
            const roles = (req.user && req.user.roles) || [];
            const canActOnBehalf = Array.isArray(roles) && roles.some(r => String(r).toLowerCase() === "admin" || String(r).toLowerCase() === "manager");
            let effectiveUserId = req.user && req.user.id ? req.user.id : req.body.user_id;
            if (canActOnBehalf && req.body.user_id && /^\d+$/.test(String(req.body.user_id))) {
                effectiveUserId = req.body.user_id;
            }

            let fotoCuti = null;
            if (req.file) {
                const baseUrl = `${req.protocol}://${req.get("host")}`;
                fotoCuti = `${baseUrl}/uploads/cuti/${req.file.filename}`;
            }

            const payload = {
                ...req.body,
                user_id: effectiveUserId,
                foto_cuti: fotoCuti,
            };

            const cuti = await cutiService.create(payload);
            return res.status(201).json({ success: true, message: "Cuti berhasil dibuat", data: cuti });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal membuat cuti", error: error.message });
        }
    }

    async update(req, res) {
        try {
            // Handle file upload
            let fotoCuti = null;
            if (req.file) {
                const baseUrl = `${req.protocol}://${req.get("host")}`;
                fotoCuti = `${baseUrl}/uploads/cuti/${req.file.filename}`;
            }
            
            const payload = { 
                ...req.body,
                ...(req.file && { foto_cuti: fotoCuti })
            };
            
            const cuti = await cutiService.update(req.params.id, payload);
            if (!cuti) return res.status(404).json({ success: false, message: "Cuti tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Cuti berhasil diupdate", data: cuti });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengupdate cuti", error: error.message });
        }
    }

    async approve(req, res) {
        try {
            const { user_approval } = req.body || {};
            if (!user_approval) {
                return res.status(400).json({ success: false, message: "Field 'user_approval' wajib diisi" });
            }
            const cuti = await cutiService.approve(req.params.id, { user_approval });
            if (!cuti) return res.status(404).json({ success: false, message: "Cuti tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Cuti berhasil di-approve", data: cuti });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal meng-approve cuti", error: error.message });
        }
    }

    async destroy(req, res) {
        try {
            const result = await cutiService.delete(req.params.id);
            if (!result) return res.status(404).json({ success: false, message: "Cuti tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Cuti berhasil dihapus" });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal menghapus cuti", error: error.message });
        }
    }
}

export default new CutiController();