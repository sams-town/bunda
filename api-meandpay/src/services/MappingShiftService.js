import prisma from "../config/prisma.js";

class MappingShiftService {
    async getAll(query = {}) {
        const search = query.search || "";
        const where = {
            ... (search ? {
                OR: [
                    { status_pengajuan: { contains: search } },
                    { deskripsi: { contains: search } },
                ]
            } : {})
        };

        if (query.user_id) where.user_id = BigInt(query.user_id);
        if (query.start_date && query.end_date) {
            where.tanggal = {
                gte: new Date(query.start_date),
                lte: new Date(query.end_date)
            };
        }

        const data = await prisma.mapping_shifts.findMany({
            where,
            orderBy: { tanggal: "desc" },
            include: {
                users: true,
                shifts: true
            }
        });

        return { data: this.serializeList(data) };
    }

    async getWhere(where) {
        const records = await prisma.mapping_shifts.findMany({
            where,
            include: {
                users: true,
                shifts: true
            },
            orderBy: { tanggal: "desc" }
        });
        return this.serialize(records);
    }
    async getWhereFirst(where) {
        const records = await prisma.mapping_shifts.findFirst({
            where,
            include: {
                users: true,
                shifts: true
            },
            orderBy: { id: "desc" }
        });
        return this.serialize(records);
    }

    async getById(id) {
        const record = await prisma.mapping_shifts.findUnique({
            where: { id: BigInt(id) },
            include: {
                users: true,
                shifts: true
            }
        });
        if (!record) return null;
        return this.serialize(record);
    }

    async bulkCreateRange(data) {
        const { user_id, shift_id, start_date, end_date, lock_location } = data;
        
        // Buat objek date dengan jam 00:00:00 agar gte/lte di prisma tepat
        const start = new Date(start_date);
        const end = new Date(end_date);
        const createdRecords = [];

        // Hapus data lama di rentang tersebut agar 'disesuaikan'
        await prisma.mapping_shifts.deleteMany({
            where: {
                user_id: BigInt(user_id),
                tanggal: {
                    gte: start,
                    lte: end
                }
            }
        });

        let current = new Date(start);
        while (current <= end) {
            // Gunakan UTC agar tidak bergeser karena timezone server (Vercel/DigitalOcean dll)
            const y = current.getUTCFullYear();
            const m = String(current.getUTCMonth() + 1).padStart(2, '0');
            const d = String(current.getUTCDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;

            const record = await prisma.mapping_shifts.create({
                data: {
                    user_id: BigInt(user_id),
                    shift_id: shift_id ? BigInt(shift_id) : null,
                    tanggal: new Date(dateStr),
                    lock_location: lock_location ? lock_location.toString() : "0"
                }
            });

            createdRecords.push(this.serialize(record));
            current.setUTCDate(current.getUTCDate() + 1);
        }

        return { data: createdRecords };
    }

    async bulkUpdateRange(data) {
        const { user_id, start_date, end_date, shift_id, lock_location } = data;

        const result = await prisma.mapping_shifts.updateMany({
            where: {
                user_id: BigInt(user_id),
                tanggal: {
                    gte: new Date(start_date),
                    lte: new Date(end_date)
                }
            },
            data: {
                shift_id: shift_id ? BigInt(shift_id) : null,
                lock_location: lock_location !== undefined ? lock_location.toString() : undefined
            }
        });

        return { count: result.count };
    }

    async bulkDeleteRange(data) {
        const { user_id, start_date, end_date } = data;

        const result = await prisma.mapping_shifts.deleteMany({
            where: {
                user_id: BigInt(user_id),
                tanggal: {
                    gte: new Date(start_date),
                    lte: new Date(end_date)
                }
            }
        });

        return { count: result.count };
    }

    serialize(record) {
        if (record === null || record === undefined) return record;
        if (typeof record === "bigint") return record.toString();
        if (record instanceof Date) return record.toISOString();
        if (Array.isArray(record)) return record.map(i => this.serialize(i));
        if (typeof record === "object") {
            const serialized = {};
            for (const [key, value] of Object.entries(record)) {
                serialized[key] = this.serialize(value);
            }
            return serialized;
        }
        return record;
    }

    serializeList(items) {
        return items.map((i) => this.serialize(i));
    }
}

export default new MappingShiftService();
