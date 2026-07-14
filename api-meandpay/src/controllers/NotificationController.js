import notificationService from "../services/NotificationService.js";

class NotificationController {
    async index(req, res) {
        try {
            const result = await notificationService.getAll(req.query);
            return res.status(200).json({ success: true, message: "Data notifications berhasil diambil", ...result });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data notifications", error: error.message });
        }
    }

    async show(req, res) {
        try {
            const data = await notificationService.getById(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Notification tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Data notification berhasil diambil", data });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data notification", error: error.message });
        }
    }

    async store(req, res) {
        try {
            const data = await notificationService.create(req.body);
            return res.status(201).json({ success: true, message: "Notification berhasil dibuat", data });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal membuat notification", error: error.message });
        }
    }

    async update(req, res) {
        try {
            const data = await notificationService.update(req.params.id, req.body);
            if (!data) return res.status(404).json({ success: false, message: "Notification tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Notification berhasil diupdate", data });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengupdate notification", error: error.message });
        }
    }

    async markRead(req, res) {
        try {
            const data = await notificationService.markRead(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Notification tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Notification ditandai sebagai terbaca", data });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal menandai notification", error: error.message });
        }
    }

    async destroy(req, res) {
        try {
            const ok = await notificationService.delete(req.params.id);
            if (!ok) return res.status(404).json({ success: false, message: "Notification tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Notification berhasil dihapus" });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal menghapus notification", error: error.message });
        }
    }

    async clear(req, res) {
        try {
            const id = req.params.id;
            if (id) {
                const result = await notificationService.clearById(id);
                return res.status(200).json({ 
                    success: true, 
                    message: `Notification ID ${id} berhasil di-clear (notifiable_id set to 0)`, 
                    data: result 
                });
            } else {
                const notifiableId = req.query.notifiable_id || req.body.notifiable_id;
                const result = await notificationService.clearByNotifiableId(notifiableId);
                return res.status(200).json({ 
                    success: true, 
                    message: "Semua notification berhasil di-clear (notifiable_id set to 0)", 
                    count: result.count 
                });
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal meng-clear notification", error: error.message });
        }
    }
}

export default new NotificationController();