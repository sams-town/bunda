import targetKinerjaService from "../services/TargetKinerjaService.js";

class TargetKinerjaController {
    async index(req, res) {
        try {
            const result = await targetKinerjaService.getAll();
            return res.status(200).json(result);
        } catch (error) {
            console.error("TargetKinerjaController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data master target",
                error: error.message
            });
        }
    }

    async store(req, res) {
        try {
            const result = await targetKinerjaService.create(req.body);
            return res.status(201).json(result);
        } catch (error) {
            console.error("TargetKinerjaController.store error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menambahkan master target",
                error: error.message
            });
        }
    }
}

export default new TargetKinerjaController();
