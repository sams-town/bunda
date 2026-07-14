import mappingShiftService from "../services/MappingShiftService.js";

class MappingShiftController {
    async index(req, res) {
        try {
            const result = await mappingShiftService.getAll(req.query);
            return res.status(200).json({ success: true, message: "Data mapping shift berhasil diambil", ...result });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data mapping shift", error: error.message });
        }
    }

    async show(req, res) {
        try {
            const data = await mappingShiftService.getById(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Mapping shift tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Data mapping shift berhasil diambil", data });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data mapping shift", error: error.message });
        }
    }
     async showUser(req, res) {
        try {
            console.log("cekdata",req.params.id);
            const data = await mappingShiftService.getWhere({ user_id: BigInt(req.params.id) });
            if (!data || data.length === 0) return res.status(404).json({ success: false, message: "Mapping shift tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Data mapping shift berhasil diambil", data });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data mapping shift", error: error.message });
        }
    }

    async showUserFirst(req, res) {
        try {
            console.log("cekdata",req.params.id);
            const data = await mappingShiftService.getWhereFirst({ user_id: BigInt(req.params.id) });
            if (!data || data.length === 0) return res.status(404).json({ success: false, message: "Mapping shift tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Data mapping shift berhasil diambil", data });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data mapping shift", error: error.message });
        }
    }

    async bulkStore(req, res) {
        try {
            const { user_id, shift_id, start_date, end_date, lock_location } = req.body;

            if (!user_id || !start_date || !end_date) {
                return res.status(400).json({
                    success: false,
                    message: "user_id, start_date, dan end_date wajib diisi"
                });
            }

            const result = await mappingShiftService.bulkCreateRange(req.body);

            return res.status(201).json({
                success: true,
                message: "Mapping shift berhasil dibuat untuk rentang tanggal tersebut",
                ...result
            });
        } catch (error) {
            console.error("MappingShiftController.bulkStore error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal membuat mapping shift massal",
                error: error.message
            });
        }
    }

    async bulkUpdate(req, res) {
        try {
            const { user_id, start_date, end_date, shift_id, lock_location } = req.body;
            if (!user_id || !start_date || !end_date || !shift_id) {
                return res.status(400).json({ success: false, message: "user_id, start_date, end_date, dan shift_id wajib diisi" });
            }

            const result = await mappingShiftService.bulkUpdateRange(req.body);
            return res.status(200).json({ success: true, message: `${result.count} data mapping shift berhasil diupdate`, ...result });
        } catch (error) {
            console.error("MappingShiftController.bulkUpdate error:", error);
            return res.status(500).json({ success: false, message: "Gagal mengupdate massal mapping shift", error: error.message });
        }
    }

    async bulkDestroy(req, res) {
        try {
            const { user_id, start_date, end_date } = req.body;
            if (!user_id || !start_date || !end_date) {
                return res.status(400).json({ success: false, message: "user_id, start_date, dan end_date wajib diisi" });
            }

            const result = await mappingShiftService.bulkDeleteRange(req.body);
            return res.status(200).json({ success: true, message: `${result.count} data mapping shift berhasil dihapus`, ...result });
        } catch (error) {
            console.error("MappingShiftController.bulkDestroy error:", error);
            return res.status(500).json({ success: false, message: "Gagal menghapus massal mapping shift", error: error.message });
        }
    }
}

export default new MappingShiftController();
