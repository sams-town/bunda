import laporanKinerjaService from "../services/LaporanKinerjaService.js";

class LaporanKinerjaController {
    /**
     * GET /api/laporan-kinerjas
     */
    async index(req, res) {
        try {
            const result = await laporanKinerjaService.getAll(req.query);

            return res.status(200).json({
                success: true,
                message: "Data laporan kinerja berhasil diambil",
                ...result,
            });
        } catch (error) {
            console.error("LaporanKinerjaController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data laporan kinerja",
                error: error.message,
            });
        }
    }
}

export default new LaporanKinerjaController();
