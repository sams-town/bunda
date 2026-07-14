import PajakService from "../services/PajakService.js";

class PajakController {
    async index(req, res) {
        try {
            const result = await PajakService.getAll(req.query);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Gagal mengambil data laporan pajak",
                error: error.message
            });
        }
    }
}

export default new PajakController();
