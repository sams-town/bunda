import prisma from "../config/prisma.js";

class ShiftService {
    /**
     * Get all shifts with optional search
     */
    async getAll(query = {}) {
        const search = query.search || "";

        const where = search
            ? {
                nama_shift: { contains: search },
              }
            : {};

        const data = await prisma.shifts.findMany({
            where,
            orderBy: { id: "desc" },
        });

        return {
            data: this.serializeList(data),
        };
    }

    /**
     * Get single shift by ID
     */
    async getById(id) {
        const shift = await prisma.shifts.findUnique({
            where: { id: BigInt(id) },
        });

        if (!shift) return null;

        return this.serialize(shift);
    }

    /**
     * Create a new shift
     */
    async create(data) {
        const payload = {
            nama_shift: data.nama_shift,
            jam_masuk: data.jam_masuk,
            jam_keluar: data.jam_keluar,
            jam_mulai_istirahat: data.jam_mulai_istirahat || null,
            jam_selesai_istirahat: data.jam_selesai_istirahat || null,
            created_at: new Date(),
            updated_at: new Date(),
        };

        const shift = await prisma.shifts.create({
            data: payload,
        });

        return this.serialize(shift);
    }

    /**
     * Update shift by ID
     */
    async update(id, data) {
        const existing = await prisma.shifts.findUnique({
            where: { id: BigInt(id) },
        });

        if (!existing) return null;

        const updateData = {
            updated_at: new Date(),
        };

        if (data.nama_shift !== undefined) updateData.nama_shift = data.nama_shift;
        if (data.jam_masuk !== undefined) updateData.jam_masuk = data.jam_masuk;
        if (data.jam_keluar !== undefined) updateData.jam_keluar = data.jam_keluar;
        if (data.jam_mulai_istirahat !== undefined) updateData.jam_mulai_istirahat = data.jam_mulai_istirahat;
        if (data.jam_selesai_istirahat !== undefined) updateData.jam_selesai_istirahat = data.jam_selesai_istirahat;

        const shift = await prisma.shifts.update({
            where: { id: BigInt(id) },
            data: updateData,
        });

        return this.serialize(shift);
    }

    /**
     * Delete shift by ID
     */
    async delete(id) {
        const existing = await prisma.shifts.findUnique({
            where: { id: BigInt(id) },
        });

        if (!existing) return null;

        // Hapus semua relasi terlebih dahulu agar fitur delete berhasil
        await prisma.mapping_shifts.deleteMany({ where: { shift_id: BigInt(id) } });
        await prisma.auto_shifts.deleteMany({ where: { shift_id: BigInt(id) } });
        await prisma.dinas_luars.deleteMany({ where: { shift_id: BigInt(id) } });

        await prisma.shifts.delete({
            where: { id: BigInt(id) },
        });

        return true;
    }

    /**
     * Serialize a single shift — convert BigInt to string for JSON
     */
    serialize(shift) {
        const serialized = {};
        for (const [key, value] of Object.entries(shift)) {
            if (typeof value === "bigint") {
                serialized[key] = value.toString();
            } else {
                serialized[key] = value;
            }
        }
        return serialized;
    }

    /**
     * Serialize a list of shifts
     */
    serializeList(shifts) {
        return shifts.map(shift => this.serialize(shift));
    }
}

export default new ShiftService();