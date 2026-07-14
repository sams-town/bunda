import prisma from "../config/prisma.js";

class KontrakService {
    async getAll(query = {}) {
        const search = query.search || "";
        const where = {
            ... (search ? {
                OR: [
                    { jenis_kontrak: { contains: search } },
                    { keterangan: { contains: search } },
                ],
            } : {})
        };
        if (query.user_id) where.user_id = BigInt(query.user_id);
        const data = await prisma.kontraks.findMany({
            where,
            orderBy: { id: "desc" },
        });
        return { data: this.serializeList(data) };
    }

    async getByUserId(userId) {
        const contracts = await prisma.kontraks.findMany({
            where: { user_id: BigInt(userId) },
            orderBy: { id: "desc" },
        });
        return this.serializeList(contracts);
    }

    async getById(id) {
        const kontrak = await prisma.kontraks.findUnique({
            where: { id: BigInt(id) },
        });
        if (!kontrak) return null;
        return this.serialize(kontrak);
    }

    async create(data) {
        const payload = {};
        // tanggal default hari ini, bisa diubah
        payload.tanggal = data.tanggal ? new Date(data.tanggal) : new Date();
        if (data.user_id) payload.user_id = BigInt(data.user_id);
        if (data.jenis_kontrak !== undefined) payload.jenis_kontrak = data.jenis_kontrak;
        if (data.tanggal_mulai) payload.tanggal_mulai = new Date(data.tanggal_mulai);
        if (data.tanggal_selesai) payload.tanggal_selesai = new Date(data.tanggal_selesai);
        if (data.keterangan !== undefined) payload.keterangan = data.keterangan;
        if (data.kontrak_file_path !== undefined) payload.kontrak_file_path = data.kontrak_file_path;
        if (data.kontrak_file_name !== undefined) payload.kontrak_file_name = data.kontrak_file_name;

        const kontrak = await prisma.kontraks.create({ data: payload });
        return this.serialize(kontrak);
    }

    async update(id, data) {
        const existing = await prisma.kontraks.findUnique({
            where: { id: BigInt(id) },
        });
        if (!existing) return null;

        const updateData = {};
        if (data.user_id !== undefined) updateData.user_id = data.user_id ? BigInt(data.user_id) : null;
        if (data.tanggal !== undefined) updateData.tanggal = data.tanggal ? new Date(data.tanggal) : null;
        if (data.jenis_kontrak !== undefined) updateData.jenis_kontrak = data.jenis_kontrak;
        if (data.tanggal_mulai !== undefined) updateData.tanggal_mulai = data.tanggal_mulai ? new Date(data.tanggal_mulai) : null;
        if (data.tanggal_selesai !== undefined) updateData.tanggal_selesai = data.tanggal_selesai ? new Date(data.tanggal_selesai) : null;

        if (data.keterangan !== undefined) updateData.keterangan = data.keterangan;
        if (data.kontrak_file_path !== undefined) updateData.kontrak_file_path = data.kontrak_file_path;
        if (data.kontrak_file_name !== undefined) updateData.kontrak_file_name = data.kontrak_file_name;

        const kontrak = await prisma.kontraks.update({
            where: { id: BigInt(id) },
            data: updateData,
        });
        return this.serialize(kontrak);
    }

    async delete(id) {
        const existing = await prisma.kontraks.findUnique({
            where: { id: BigInt(id) },
        });
        if (!existing) return null;

        await prisma.kontraks.delete({ where: { id: BigInt(id) } });
        return true;
    }

    serialize(kontrak) {
        const serialized = {};
        for (const [key, value] of Object.entries(kontrak)) {
            if (typeof value === "bigint") {
                serialized[key] = value.toString();
            } else {
                serialized[key] = value;
            }
        }
        return serialized;
    }

    serializeList(items) {
        return items.map((i) => this.serialize(i));
    }
}

export default new KontrakService();