import prisma from "../config/prisma.js";

class JenisKinerjaService {
    /**
     * Get all jenis kinerjas
     */
    async getAll(query = {}) {
        const search = query.search || "";

        const where = {
            OR: search ? [
                { nama: { contains: search } },
                { detail: { contains: search } }
            ] : undefined,
        };

        const data = await prisma.jenis_kinerjas.findMany({
            where,
            orderBy: { id: "desc" },
        });

        return {
            data: this.serializeList(data),
        };
    }

    /**
     * Get single jenis kinerja by ID
     */
    async getById(id) {
        const data = await prisma.jenis_kinerjas.findUnique({
            where: { id: BigInt(id) },
        });

        if (!data) return null;

        return this.serialize(data);
    }

    /**
     * Create a new jenis kinerja
     */
    async create(data) {
        const payload = { ...data };
        if (payload.bobot) payload.bobot = BigInt(payload.bobot);

        const created = await prisma.jenis_kinerjas.create({
            data: payload,
        });

        return this.serialize(created);
    }

    /**
     * Update jenis kinerja by ID
     */
    async update(id, data) {
        const existing = await prisma.jenis_kinerjas.findUnique({
            where: { id: BigInt(id) },
        });

        if (!existing) return null;

        const updateData = { ...data };
        if (updateData.bobot) updateData.bobot = BigInt(updateData.bobot);

        delete updateData.id;
        delete updateData.created_at;
        delete updateData.updated_at;

        const updated = await prisma.jenis_kinerjas.update({
            where: { id: BigInt(id) },
            data: updateData,
        });

        return this.serialize(updated);
    }

    /**
     * Delete jenis kinerja by ID
     */
    async delete(id) {
        const existing = await prisma.jenis_kinerjas.findUnique({
            where: { id: BigInt(id) },
        });

        if (!existing) return null;

        await prisma.jenis_kinerjas.delete({
            where: { id: BigInt(id) },
        });

        return true;
    }

    serialize(item) {
        const serialized = {};
        for (const [key, value] of Object.entries(item)) {
            if (typeof value === "bigint") {
                serialized[key] = value.toString();
            } else {
                serialized[key] = value;
            }
        }
        return serialized;
    }

    serializeList(items) {
        return items.map((item) => this.serialize(item));
    }
}

export default new JenisKinerjaService();
