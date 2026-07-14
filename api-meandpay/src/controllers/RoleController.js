import roleService from "../services/RoleService.js";

class RoleController {
    /**
     * GET /api/roles
     */
    async index(req, res) {
        try {
            const result = await roleService.getAll(req.query);

            return res.status(200).json({
                success: true,
                message: "Data roles berhasil diambil",
                ...result,
            });
        } catch (error) {
            console.error("RoleController.index error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data roles",
                error: error.message,
            });
        }
    }

    /**
     * GET /api/roles/:id
     */
    async show(req, res) {
        try {
            const role = await roleService.getById(req.params.id);

            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: "Role tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Data role berhasil diambil",
                data: role,
            });
        } catch (error) {
            console.error("RoleController.show error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data role",
                error: error.message,
            });
        }
    }

    /**
     * POST /api/roles
     */
    async store(req, res) {
        try {
            if (!req.body.name) {
                return res.status(400).json({
                    success: false,
                    message: "Field 'name' wajib diisi",
                });
            }

            const role = await roleService.create(req.body);

            return res.status(201).json({
                success: true,
                message: "Role berhasil dibuat",
                data: role,
            });
        } catch (error) {
            console.error("RoleController.store error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal membuat role",
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/roles/:id
     */
    async update(req, res) {
        try {
            const role = await roleService.update(req.params.id, req.body);

            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: "Role tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Role berhasil diupdate",
                data: role,
            });
        } catch (error) {
            console.error("RoleController.update error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengupdate role",
                error: error.message,
            });
        }
    }

    /**
     * DELETE /api/roles/:id
     */
    async destroy(req, res) {
        try {
            const result = await roleService.delete(req.params.id);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: "Role tidak ditemukan",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Role berhasil dihapus",
            });
        } catch (error) {
            console.error("RoleController.destroy error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus role",
                error: error.message,
            });
        }
    }
}

export default new RoleController();
