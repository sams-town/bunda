import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

class AuthService {
    /**
     * Authenticate user and return JWT token
     * @param {string} username
     * @param {string} password
     */
    async login(username, password) {
        // Find user by username
        const user = await prisma.users.findFirst({
            where: { username },
        });

        if (!user) {
            throw new Error("Username tidak ditemukan");
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password || "");
        if (!isPasswordValid) {
            throw new Error("Password salah");
        }

        // Get User Roles
        // Assuming model_type from previous Laravel app is 'App\\Models\\User'
        // If not, we can adjust the model_type query or just query by model_id.
        const userRoles = await prisma.model_has_roles.findMany({
            where: {
                model_id: user.id,
                // model_type: "App\\Models\\User", // Opsional: Disesuaikan jika perlu
            },
            include: {
                roles: true,
            },
        });

        const roles = userRoles.map((ur) => ur.roles.name);

        // Generate JWT Token
        const token = jwt.sign(
            {
                id: user.id.toString(),
                username: user.username,
                roles,
            }, // serialize BigInt id to string
            process.env.JWT_SECRET || "default_secret_key",
            { expiresIn: "24h" }
        );

        return {
            user: { ...this.serialize(user), roles },
            token,
        };
    }

    /**
     * Get authenticated user profile by ID
     */
    async getProfile(id) {
        const user = await prisma.users.findUnique({
            where: { id: BigInt(id) },
        });

        if (!user) {
            throw new Error("User tidak ditemukan");
        }

        const userRoles = await prisma.model_has_roles.findMany({
            where: {
                model_id: BigInt(id),
            },
            include: {
                roles: true,
            },
        });

        const roles = userRoles.map((ur) => ur.roles.name);

        return { ...this.serialize(user), roles };
    }

    /**
     * Update authenticated user profile
     * Note: Only updates specific fields allowed for users to update themselves
     */
    async updateProfile(id, data) {
        // Cek apakah user exist
        const existing = await prisma.users.findUnique({
            where: { id: BigInt(id) },
        });

        if (!existing) {
            throw new Error("User tidak ditemukan");
        }

        const updateData = {};

        // Daftar properti yang boleh di-update oleh user itu sendiri (bukan oleh admin)
        const allowedUpdates = [
            "name",
            "email",
            "telepon",
            "tgl_lahir",
            "gender",
            "alamat",
            "ktp",
            "kartu_keluarga",
            "bpjs_kesehatan",
            "bpjs_ketenagakerjaan",
            "npwp",
            "sim",
            "rekening",
            "nama_rekening",
            "username",
        ];

        // Memfilter data yang hanya diizinkan
        for (const field of allowedUpdates) {
            if (data[field] !== undefined) {
                updateData[field] = data[field];
            }
        }

        // Jika mengupdate password
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        // Lakukan update apabila ada field yang relevan untuk diubah
        if (Object.keys(updateData).length > 0) {
            const updatedUser = await prisma.users.update({
                where: { id: BigInt(id) },
                data: updateData,
            });
            return this.serialize(updatedUser);
        }

        return this.serialize(existing);
    }

    /**
     * Serialize a single user (Remove password & convert BigInt to string)
     */
    serialize(user) {
        const serialized = {};
        for (const [key, value] of Object.entries(user)) {
            if (key === "password") continue; // Exclude password from response

            if (typeof value === "bigint") {
                serialized[key] = value.toString();
            } else {
                serialized[key] = value;
            }
        }
        return serialized;
    }
}

export default new AuthService();
