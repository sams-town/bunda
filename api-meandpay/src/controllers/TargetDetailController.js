import TargetDetailService from "../services/TargetDetailService.js";

class TargetDetailController {
    async index(req, res) {
        try {
            const result = await TargetDetailService.getAll(req.query);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Gagal mengambil data",
                error: error.message
            });
        }
    }

    async show(req, res) {
        try {
            const result = await TargetDetailService.getById(req.params.id);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Gagal mengambil detail data",
                error: error.message
            });
        }
    }

    async store(req, res) {
        try {
            const result = await TargetDetailService.create(req.body);
            res.status(201).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Gagal menambahkan data",
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const result = await TargetDetailService.update(req.params.id, req.body);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Gagal memperbarui data",
                error: error.message
            });
        }
    }

    async destroy(req, res) {
        try {
            const result = await TargetDetailService.delete(req.params.id);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Gagal menghapus data",
                error: error.message
            });
        }
    }
}

export default new TargetDetailController();
