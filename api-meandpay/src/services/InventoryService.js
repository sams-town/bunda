import prisma from "../config/prisma.js";

class InventoryService {
    async getAll(query = {}) {
        const where = {};
        if (query.lokasi_id) where.lokasi_id = BigInt(query.lokasi_id);
        if (query.jabatan_id) where.jabatan_id = BigInt(query.jabatan_id);
        if (query.search) {
            where.OR = [
                { nama_barang: { contains: query.search } },
                { kode_barang: { contains: query.search } }
            ];
        }

        const data = await prisma.inventories.findMany({
            where,
            orderBy: { id: "desc" }
        });

        // Manually attach relations because they might not be in the schema yet
        const enrichedData = await Promise.all(data.map(async (item) => {
            const enriched = this.serialize(item);

            if (item.lokasi_id) {
                const lokasi = await prisma.lokasis.findUnique({
                    where: { id: item.lokasi_id },
                    select: { id: true, nama_lokasi: true }
                });
                enriched.lokasi = lokasi ? { ...lokasi, id: lokasi.id.toString() } : null;
            }

            if (item.jabatan_id) {
                const jabatan = await prisma.jabatans.findUnique({
                    where: { id: item.jabatan_id },
                    select: { id: true, nama_jabatan: true }
                });
                enriched.jabatan = jabatan ? { ...jabatan, id: jabatan.id.toString() } : null;
            }

            return enriched;
        }));

        return { data: enrichedData };
    }

    async getById(id) {
        const item = await prisma.inventories.findUnique({
            where: { id: BigInt(id) }
        });
        if (!item) return null;

        const enriched = this.serialize(item);

        if (item.lokasi_id) {
            const lokasi = await prisma.lokasis.findUnique({
                where: { id: item.lokasi_id },
                select: { id: true, nama_lokasi: true }
            });
            enriched.lokasi = lokasi ? { ...lokasi, id: lokasi.id.toString() } : null;
        }

        if (item.jabatan_id) {
            const jabatan = await prisma.jabatans.findUnique({
                where: { id: item.jabatan_id },
                select: { id: true, nama_jabatan: true }
            });
            enriched.jabatan = jabatan ? { ...jabatan, id: jabatan.id.toString() } : null;
        }

        return enriched;
    }

    async create(data) {
        const payload = { ...data };

        // Mapping 'description' to 'desc' for database compatibility
        if (payload.description !== undefined) {
            payload.desc = payload.description;
            delete payload.description;
        }

        if (payload.lokasi_id) payload.lokasi_id = BigInt(payload.lokasi_id);
        if (payload.jabatan_id) payload.jabatan_id = BigInt(payload.jabatan_id);
        if (payload.stok) payload.stok = parseFloat(payload.stok);

        const record = await prisma.inventories.create({ data: payload });
        return this.getById(record.id);
    }

    async update(id, data) {
        const existing = await prisma.inventories.findUnique({ where: { id: BigInt(id) } });
        if (!existing) return null;

        const payload = { ...data };

        // Mapping 'description' to 'desc' for database compatibility
        if (payload.description !== undefined) {
            payload.desc = payload.description;
            delete payload.description;
        }

        if (payload.lokasi_id) payload.lokasi_id = BigInt(payload.lokasi_id);
        if (payload.jabatan_id) payload.jabatan_id = BigInt(payload.jabatan_id);
        if (payload.stok !== undefined) payload.stok = parseFloat(payload.stok);

        const record = await prisma.inventories.update({
            where: { id: BigInt(id) },
            data: payload
        });
        return this.getById(record.id);
    }

    async delete(id) {
        const existing = await prisma.inventories.findUnique({ where: { id: BigInt(id) } });
        if (!existing) return null;

        await prisma.inventories.delete({ where: { id: BigInt(id) } });
        return true;
    }

    serialize(obj) {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === "bigint") return obj.toString();
        if (obj instanceof Date) return obj.toISOString();
        if (Array.isArray(obj)) return obj.map((item) => this.serialize(item));
        if (typeof obj === "object") {
            const serialized = {};
            for (const [key, value] of Object.entries(obj)) {
                serialized[key] = this.serialize(value);
            }
            return serialized;
        }
        return obj;
    }
}

export default new InventoryService();
