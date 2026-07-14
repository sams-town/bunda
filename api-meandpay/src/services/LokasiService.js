import prisma from "../config/prisma.js";

class LokasiService {
    /**
     * Get all lokasi with optional search
     */
    async getAll(query = {}) {
        const search = query.search || "";

        const where = search
            ? {
                OR: [
                    { nama_lokasi: { contains: search } },
                    { keterangan: { contains: search } },
                ],
                status: { not: "PENDING" },
            }
            : { status: { not: "PENDING" } };

        const data = await prisma.lokasis.findMany({
            where,
            orderBy: { id: "asc" },
            include: {
                users_lokasis_created_byTousers: {
                    select: { id: true, name: true },
                },
                users_lokasis_approved_byTousers: {
                    select: { id: true, name: true },
                },
            },
        });

        return {
            data: this.serializeList(data),
        };
    }

    /**
     * Get single lokasi by ID
     */
    async getById(id) {
        const lokasi = await prisma.lokasis.findUnique({
            where: { id: BigInt(id) },
            include: {
                users_lokasis_created_byTousers: {
                    select: { id: true, name: true },
                },
                users_lokasis_approved_byTousers: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!lokasi) return null;

        return this.serialize(lokasi);
    }

    /**
     * Create a new lokasi
     */
    async create(data) {
        const now = new Date();
        const lokasi = await prisma.lokasis.create({
            data: { ...this.sanitizeInput(data), status: "PENDING", created_at: now, updated_at: now },
        });

        return this.serialize(lokasi);
    }

    /**
     * Update lokasi by ID
     */
    async update(id, data) {
        const existing = await prisma.lokasis.findUnique({
            where: { id: BigInt(id) },
        });

        if (!existing) return null;

        const lokasi = await prisma.lokasis.update({
            where: { id: BigInt(id) },
            data: this.sanitizeInput(data),
        });

        return this.getById(id);
    }

    /**
     * Delete lokasi by ID
     */
    async delete(id) {
        const lokasiId = BigInt(id);
        const existing = await prisma.lokasis.findUnique({
            where: { id: lokasiId },
        });

        if (!existing) return null;

        return await prisma.$transaction(async (tx) => {
            // 1. Nullify references (optional fields)
            await tx.cutis.updateMany({
                where: { lokasi_id: lokasiId },
                data: { lokasi_id: null }
            });

            await tx.inventories.updateMany({
                where: { lokasi_id: lokasiId },
                data: { lokasi_id: null }
            });

            await tx.patrolis.updateMany({
                where: { lokasi_id: lokasiId },
                data: { lokasi_id: null }
            });

            await tx.users.updateMany({
                where: { lokasi_id: lokasiId },
                data: { lokasi_id: null }
            });

            // 2. Delete data that belongs to the lokasi (required fields)
            await tx.lemburs.deleteMany({
                where: { lokasi_id: lokasiId }
            });

            // 3. Delete the lokasi
            await tx.lokasis.delete({
                where: { id: lokasiId },
            });

            return true;
        });
    }

    /**
     * Sanitize input
     */
    sanitizeInput(data) {
        const bigIntFields = ["created_by", "approved_by"];

        // Exclude relasi objects
        const excludeFields = [
            "users_lokasis_created_byTousers",
            "users_lokasis_approved_byTousers",
            "user_lokasis",
        ];

        const sanitized = {};

        for (const [key, value] of Object.entries(data)) {
            if (value === undefined) continue;
            if (excludeFields.includes(key)) continue;

            if (bigIntFields.includes(key)) {
                sanitized[key] = value !== null && value !== "" ? BigInt(value) : null;
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * Serialize — convert BigInt to string for JSON
     */
    serialize(lokasi) {
        const serialized = {};
        for (const [key, value] of Object.entries(lokasi)) {
            if (typeof value === "bigint") {
                serialized[key] = value.toString();
            } else if (value !== null && typeof value === "object" && !(value instanceof Date)) {
                const nested = {};
                for (const [k, v] of Object.entries(value)) {
                    nested[k] = typeof v === "bigint" ? v.toString() : v;
                }
                serialized[key] = nested;
            } else {
                serialized[key] = value;
            }
        }
        return serialized;
    }

    /**
     * Serialize a list
     */
    serializeList(list) {
        return list.map((item) => this.serialize(item));
    }

    async getPending(query = {}) {
        const search = query.search || "";
        const whereBase = { status: "PENDING" };
        const where = search
            ? {
                ...whereBase,
                OR: [
                    { nama_lokasi: { contains: search } },
                    { keterangan: { contains: search } },
                ],
            }
            : whereBase;

        const data = await prisma.lokasis.findMany({
            where,
            orderBy: { id: "asc" },
            include: {
                users_lokasis_created_byTousers: { select: { id: true, name: true } },
                users_lokasis_approved_byTousers: { select: { id: true, name: true } },
            },
        });

        return { data: this.serializeList(data) };
    }

    async approve(id, body = {}) {
        const existing = await prisma.lokasis.findUnique({ where: { id: BigInt(id) } });
        if (!existing) return null;

        let approvedBy = null;
        if (body.approved_by !== undefined && body.approved_by !== null) {
            const val = String(body.approved_by).trim();
            if (val !== "" && /^\d+$/.test(val)) {
                approvedBy = BigInt(val);
            } else {
                throw new Error("approved_by harus berupa angka");
            }
        }

        const lokasi = await prisma.lokasis.update({
            where: { id: BigInt(id) },
            data: { approved_by: approvedBy, status: "APPROVED" },
            include: {
                users_lokasis_created_byTousers: { select: { id: true, name: true } },
                users_lokasis_approved_byTousers: { select: { id: true, name: true } },
            },
        });

        return this.serialize(lokasi);
    }
}

export default new LokasiService();
