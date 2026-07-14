import kinerjaPegawaiService from "../services/KinerjaPegawaiService.js";

class KinerjaPegawaiController {
    /**
     * GET /api/kinerja-pegawais
     */
    async index(req, res) {
        try {
            const result = await kinerjaPegawaiService.getSummary(req.query);
            return res.status(200).json(result);
        } catch (error) {
            console.error("KinerjaPegawaiController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil rekap kinerja pegawai",
                error: error.message,
            });
        }
    }
}

export default new KinerjaPegawaiController();
