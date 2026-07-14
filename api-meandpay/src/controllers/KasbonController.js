import KasbonService from "../services/KasbonService.js";

class KasbonController {
    async index(req, res) {
        try {
            const result = await KasbonService.getAll(req.query);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Gagal mengambil data kasbon",
                error: error.message
            });
        }
    }

    async show(req, res) {
        try {
            const result = await KasbonService.getById(req.params.id);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Gagal mengambil detail kasbon",
                error: error.message
            });
        }
    }

    async store(req, res) {
        try {
            const result = await KasbonService.create(req.body);
            res.status(201).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Gagal menambahkan data kasbon",
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const result = await KasbonService.update(req.params.id, req.body);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Gagal memperbarui data kasbon",
                error: error.message
            });
        }
    }

    async destroy(req, res) {
        try {
            const result = await KasbonService.delete(req.params.id);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Gagal menghapus data kasbon",
                error: error.message
            });
        }
    }
}

export default new KasbonController();
