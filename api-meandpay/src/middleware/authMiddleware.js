import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            // Verifikasi token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key");
            // Simpan data user (dari payload token) ke object request
            req.user = decoded;
        } else {
            // Default user (Super Admin) if no token is found
            req.user = { id: "1", username: "admin", roles: ["superadmin"] };
        }

        next();
    } catch (error) {
        // Fallback to default user even if token is invalid
        req.user = { id: "1", username: "admin", roles: ["superadmin"] };
        next();
    }
};
