import reimbursementService from "../services/ReimbursementService.js";

class ReimbursementController {
    /**
     * GET /api/reimbursements
     */
    async index(req, res) {
        try {
            const data = await reimbursementService.getAll(req.query);
            return res.status(200).json({
                success: true,
                message: "Data reimbursement berhasil diambil",
                data
            });
        } catch (error) {
            console.error("ReimbursementController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data reimbursement",
                error: error.message
            });
        }
    }

    /**
     * POST /api/reimbursements
     */
    async store(req, res) {
        try {
            const body = req.body;

            // Handle file upload
            if (req.file) {
                // Formatting the URL as requested: localhost:4000/uploads/reimbursement/...
                const baseUrl = process.env.BASE_URL || "http://localhost:4000";
                body.file_path = `${baseUrl}/uploads/reimbursement/${req.file.filename}`;
                body.file_name = req.file.originalname;
            }

            // Handle items from stringified JSON if sent via FormData
            if (typeof body.items === 'string') {
                body.items = JSON.parse(body.items);
            }

            const data = await reimbursementService.create(body);
            return res.status(201).json({
                success: true,
                message: "Reimbursement berhasil ditambahkan",
                data
            });
        } catch (error) {
            console.error("ReimbursementController.store error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menambahkan reimbursement",
                error: error.message
            });
        }
    }

    /**
     * GET /api/reimbursements/:id
     */
    async show(req, res) {
        try {
            const data = await reimbursementService.getById(req.params.id);
            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: "Reimbursement tidak ditemukan"
                });
            }
            return res.status(200).json({
                success: true,
                message: "Detail reimbursement berhasil diambil",
                data
            });
        } catch (error) {
            console.error("ReimbursementController.show error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil detail reimbursement",
                error: error.message
            });
        }
    }

    /**
     * PUT /api/reimbursements/:id
     */
    async update(req, res) {
        try {
            const body = req.body;

            // Handle file upload
            if (req.file) {
                const baseUrl = process.env.BASE_URL || "http://localhost:4000";
                body.file_path = `${baseUrl}/uploads/reimbursement/${req.file.filename}`;
                body.file_name = req.file.originalname;
            }

            // Handle items from stringified JSON if sent via FormData
            if (typeof body.items === 'string') {
                body.items = JSON.parse(body.items);
            }

            const data = await reimbursementService.update(req.params.id, body);
            return res.status(200).json({
                success: true,
                message: "Reimbursement berhasil diperbarui",
                data
            });
        } catch (error) {
            console.error("ReimbursementController.update error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal memperbarui reimbursement",
                error: error.message
            });
        }
    }

    /**
     * DELETE /api/reimbursements/:id
     */
    async destroy(req, res) {
        try {
            const success = await reimbursementService.delete(req.params.id);
            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: "Reimbursement tidak ditemukan"
                });
            }
            return res.status(200).json({
                success: true,
                message: "Reimbursement berhasil dihapus"
            });
        } catch (error) {
            console.error("ReimbursementController.destroy error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus reimbursement",
                error: error.message
            });
        }
    }
}

export default new ReimbursementController();
