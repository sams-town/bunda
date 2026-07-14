import prisma from "../config/prisma.js";

class StatusPajakService {
    async getAll(query = {}) {
        const search = query.search || "";
        const where = search ? {
            name: { contains: search }
        } : {};

        const data = await prisma.status_pajaks.findMany({
            where,
            orderBy: { id: "desc" }
        });

        return { data: this.serializeList(data) };
    }

    async getById(id) {
        const record = await prisma.status_pajaks.findUnique({
            where: { id: BigInt(id) }
        });
        if (!record) return null;
        return this.serialize(record);
    }

    async create(data) {
        const payload = { ...data };
        if (payload.ptkp) payload.ptkp = BigInt(payload.ptkp);

        const record = await prisma.status_pajaks.create({ data: payload });
        return this.serialize(record);
    }

    async update(id, data) {
        const existing = await prisma.status_pajaks.findUnique({ where: { id: BigInt(id) } });
        if (!existing) return null;

        const updateData = { ...data };
        if (updateData.ptkp) updateData.ptkp = BigInt(updateData.ptkp);

        const record = await prisma.status_pajaks.update({
            where: { id: BigInt(id) },
            data: updateData
        });
        return this.serialize(record);
    }

    async delete(id) {
        const existing = await prisma.status_pajaks.findUnique({ where: { id: BigInt(id) } });
        if (!existing) return null;

        await prisma.status_pajaks.delete({ where: { id: BigInt(id) } });
        return true;
    }

    serialize(record) {
        const serialized = {};
        for (const [key, value] of Object.entries(record)) {
            if (typeof value === "bigint") {
                serialized[key] = value.toString();
            } else if (value instanceof Date) {
                serialized[key] = value.toISOString();
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

export default new StatusPajakService();
