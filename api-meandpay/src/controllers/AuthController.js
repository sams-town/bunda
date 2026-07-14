import authService from "../services/AuthService.js";

class AuthController {
    /**
     * POST /api/login
     */
    async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Username dan password wajib diisi",
                });
            }

            const result = await authService.login(username, password);

            return res.status(200).json({
                success: true,
                message: "Login berhasil",
                data: result.user,
                token: result.token,
            });
        } catch (error) {
            console.error("AuthController.login error:", error);

            // Check for specific error messages thrown from the service
            const statusCode = error.message === "Username tidak ditemukan" || error.message === "Password salah" ? 401 : 500;

            return res.status(statusCode).json({
                success: false,
                message: error.message || "Terjadi kesalahan saat login",
            });
        }
    }

    /**
     * GET /api/me
     * Get authenticated user profile
     */
    async getProfile(req, res) {
        try {
            // req.user diset dari authMiddleware
            const userId = req.user.id;

            // Ambil data user beserta rules nya dari AuthService
            const result = await authService.getProfile(userId);

            return res.status(200).json({
                success: true,
                message: "Data profil berhasil diambil",
                data: result
            });
        } catch (error) {
            console.error("AuthController.getProfile error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data profil",
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/me
     * Update authenticated user profile
     */
    async updateProfile(req, res) {
        try {
            // req.user diset dari authMiddleware
            const userId = req.user.id;

            // Lakukan update profil menggunakan authService
            const result = await authService.updateProfile(userId, req.body);

            return res.status(200).json({
                success: true,
                message: "Profil berhasil diperbarui",
                data: result
            });
        } catch (error) {
            console.error("AuthController.updateProfile error:", error);

            const statusCode = error.message === "User tidak ditemukan" ? 404 : 500;

            return res.status(statusCode).json({
                success: false,
                message: "Gagal memperbarui profil",
                error: error.message,
            });
        }
    }
}

export default new AuthController();
