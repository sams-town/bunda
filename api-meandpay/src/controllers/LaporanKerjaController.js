import laporanKerjaService from "../services/LaporanKerjaService.js";

class LaporanKerjaController {
    /**
     * GET /api/laporan-kerjas
     */
    async index(req, res) {
        try {
            const result = await laporanKerjaService.getAll(req.query);

            return res.status(200).json({
                success: true,
                message: "Data laporan kerja berhasil diambil",
                ...result,
            });
        } catch (error) {
            console.error("LaporanKerjaController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data laporan kerja",
                error: error.message,
            });
        }
    }
}

export default new LaporanKerjaController();
