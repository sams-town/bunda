import inventoryService from "../services/InventoryService.js";

class InventoryController {
    /**
     * GET /api/inventories
     */
    async index(req, res) {
        try {
            const result = await inventoryService.getAll(req.query);
            return res.status(200).json({
                success: true,
                message: "Data inventory berhasil diambil",
                ...result,
            });
        } catch (error) {
            console.error("InventoryController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data inventory",
                error: error.message,
            });
        }
    }

    /**
     * GET /api/inventories/:id
     */
    async show(req, res) {
        try {
            const data = await inventoryService.getById(req.params.id);
            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: "Data inventory tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Data inventory berhasil diambil",
                data,
            });
        } catch (error) {
            console.error("InventoryController.show error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data inventory",
                error: error.message,
            });
        }
    }

    /**
     * POST /api/inventories
     */
    async store(req, res) {
        try {
            const payload = { ...req.body };

            if (!payload.nama_barang || !payload.kode_barang) {
                return res.status(400).json({
                    success: false,
                    message: "nama_barang dan kode_barang wajib diisi",
                });
            }

            const data = await inventoryService.create(payload);
            return res.status(201).json({
                success: true,
                message: "Data inventory berhasil dibuat",
                data,
            });
        } catch (error) {
            console.error("InventoryController.store error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal membuat data inventory",
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/inventories/:id
     */
    async update(req, res) {
        try {
            const data = await inventoryService.update(req.params.id, req.body);
            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: "Data inventory tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Data inventory berhasil diperbarui",
                data,
            });
        } catch (error) {
            console.error("InventoryController.update error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal memperbarui data inventory",
                error: error.message,
            });
        }
    }

    /**
     * DELETE /api/inventories/:id
     */
    async destroy(req, res) {
        try {
            const ok = await inventoryService.delete(req.params.id);
            if (!ok) {
                return res.status(404).json({
                    success: false,
                    message: "Data inventory tidak ditemukan",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Data inventory berhasil dihapus",
            });
        } catch (error) {
            console.error("InventoryController.destroy error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus data inventory",
                error: error.message,
            });
        }
    }
}

export default new InventoryController();
