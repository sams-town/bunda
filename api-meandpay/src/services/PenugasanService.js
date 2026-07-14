import prisma from "../config/prisma.js";

class PenugasanService {
    /**
     * Get all penugasans with optional search & filters
     */
    async getAll(query = {}) {
        const search = query.search || "";

        // Optional date filters for Tanggal Mulai dan Tanggal Akhir
        const startDate = query.start_date ? new Date(query.start_date) : undefined;
        const endDate = query.end_date ? new Date(query.end_date) : undefined;

        const where = {
            OR: search ? [
                { nomor_penugasan: { contains: search } },
                { judul: { contains: search } },
                { rincian: { contains: search } },
                { status: { contains: search } }
            ] : undefined,
        };

        if (startDate || endDate) {
            where.tanggal = {};
            if (startDate) where.tanggal.gte = startDate;
            if (endDate) where.tanggal.lte = endDate;
        }

        const data = await prisma.penugasans.findMany({
            where,
            orderBy: { id: "desc" },
        });

        // Attach users and calculate progress percentage mapping
        const result = await this._attachRelations(data);

        return {
            data: this.serializeList(result),
        };
    }

    /**
     * Get single penugasan by ID
     */
    async getById(id) {
        const penugasan = await prisma.penugasans.findUnique({
            where: { id: BigInt(id) },
        });

        if (!penugasan) return null;

        const result = await this._attachRelations(penugasan);
        return this.serialize(result);
    }

    /**
     * Create a new penugasan
     */
    async create(data) {
        const payload = { ...data };
        if (payload.user_id) payload.user_id = BigInt(payload.user_id);
        if (payload.tanggal) payload.tanggal = new Date(payload.tanggal);
        // Default values
        payload.status = payload.status || "In Progress";
        payload.progress = payload.progress || "0%";

        // Auto-generate Nomor Penugasan jika belum ada
        if (!payload.nomor_penugasan) {
            const count = await prisma.penugasans.count();
            const year = new Date().getFullYear();
            payload.nomor_penugasan = `PK-${year}-${String(count + 1).padStart(3, '0')}`;
        }

        // Remove virtual fields from frontend
        delete payload.nomor;

        const penugasan = await prisma.penugasans.create({
            data: payload,
        });

        const result = await this._attachRelations(penugasan);
        return this.serialize(result);
    }

    /**
     * Update penugasan by ID
     */
    async update(id, data) {
        const existing = await prisma.penugasans.findUnique({
            where: { id: BigInt(id) },
        });

        if (!existing) return null;

        const updateData = { ...data };
        if (updateData.user_id) updateData.user_id = BigInt(updateData.user_id);
        if (updateData.tanggal) updateData.tanggal = new Date(updateData.tanggal);

        // Remove virtual fields from frontend
        delete updateData.nomor;
        delete updateData.users;
        delete updateData.nama_pegawai;

        // Remove auto-managed DB columns from being forcibly updated
        delete updateData.id;
        delete updateData.created_at;
        delete updateData.updated_at;

        const penugasan = await prisma.penugasans.update({
            where: { id: BigInt(id) },
            data: updateData,
        });

        const result = await this._attachRelations(penugasan);
        return this.serialize(result);
    }

    /**
     * Delete penugasan by ID
     */
    async delete(id) {
        const existing = await prisma.penugasans.findUnique({
            where: { id: BigInt(id) },
        });

        if (!existing) return null;

        await prisma.penugasans.delete({
            where: { id: BigInt(id) },
        });

        return true;
    }

    /**
     * Helper Method: Attach user details and calculate progress
     */
    async _attachRelations(records) {
        if (!records) return records;
        const isArray = Array.isArray(records);
        const data = isArray ? records : [records];

        const userIds = [...new Set(data.map(k => k.user_id).filter(id => id != null))];
        let userMap = {};

        if (userIds.length > 0) {
            const users = await prisma.users.findMany({
                where: { id: { in: userIds } },
                select: { id: true, name: true }
            });
            userMap = users.reduce((acc, u) => {
                acc[u.id.toString()] = u;
                return acc;
            }, {});
        }

        for (const item of data) {
            // Attach User Detail
            if (item.user_id) {
                item.users = userMap[item.user_id.toString()] || null;
                item.nama_pegawai = item.users?.name || 'Unknown';
            }

            // Map status ke persentase "Progress" untuk kemudahan di frontend
            let progress = item.progress || "0%";
            if (!item.progress) {
                if (item.status === 'Completed' || item.status === 'Selesai') progress = "100%";
                else if (item.status === 'In Progress' || item.status === 'Berlangsung') progress = "50%";
            }

            item.progress = progress;
        }

        return isArray ? data : data[0];
    }

    /**
     * Serialize a single penugasan — convert BigInt to string for JSON
     */
    serialize(penugasan) {
        const serialized = {};
        for (const [key, value] of Object.entries(penugasan)) {
            if (typeof value === "bigint") {
                serialized[key] = value.toString();
            } else if (value && typeof value === 'object' && value.id !== undefined && typeof value.id === 'bigint') {
                const nested = {};
                for (const [k, v] of Object.entries(value)) {
                    if (typeof v === "bigint") {
                        nested[k] = v.toString();
                    } else {
                        nested[k] = v;
                    }
                }
                serialized[key] = nested;
            } else {
                serialized[key] = value;
            }
        }
        return serialized;
    }

    /**
     * Serialize a list of penugasans
     */
    serializeList(penugasans) {
        return penugasans.map((penugasan) => this.serialize(penugasan));
    }
}

export default new PenugasanService();
