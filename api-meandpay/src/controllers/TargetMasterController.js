import TargetMasterService from "../services/TargetMasterService.js";

class TargetMasterController {
    async index(req, res) {
        try {
            const result = await TargetMasterService.getAll(req.query);
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
            const result = await TargetMasterService.getById(req.params.id);
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
            const result = await TargetMasterService.create(req.body);
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
            const result = await TargetMasterService.update(req.params.id, req.body);
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
            const result = await TargetMasterService.delete(req.params.id);
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

export default new TargetMasterController();
