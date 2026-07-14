import prisma from "../config/prisma.js";

class KategoriReimbursementService {
    /**
     * Get all categories
     */
    async getAll(query = {}) {
        const { search } = query;

        const where = search ? {
            name: {
                contains: search
            }
        } : {};

        const categories = await prisma.kategoris.findMany({
            where,
            orderBy: {
                id: 'desc'
            }
        });

        return this.serializeList(categories);
    }

    /**
     * Get category by ID
     */
    async getById(id) {
        const category = await prisma.kategoris.findUnique({
            where: { id: BigInt(id) }
        });
        return category ? this.serialize(category) : null;
    }

    /**
     * Create new category
     */
    async create(data) {
        const created = await prisma.kategoris.create({
            data: {
                name: data.name,
                jumlah: data.jumlah ? BigInt(data.jumlah) : null,
                active: data.status === 'Aktif' ? 1 : 0
            }
        });
        return this.serialize(created);
    }

    /**
     * Update category
     */
    async update(id, data) {
        const updated = await prisma.kategoris.update({
            where: { id: BigInt(id) },
            data: {
                name: data.name,
                jumlah: data.jumlah ? BigInt(data.jumlah) : null,
                active: data.status === 'Aktif' ? 1 : 0
            }
        });
        return this.serialize(updated);
    }

    /**
     * Delete category
     */
    async delete(id) {
        try {
            await prisma.kategoris.delete({
                where: { id: BigInt(id) }
            });
            return true;
        } catch (error) {
            console.error("KategoriReimbursementService.delete error:", error);
            return false;
        }
    }

    /**
     * Convert BigInt to String for JSON serialization
     */
    serialize(category) {
        return {
            ...category,
            id: category.id.toString(),
            jumlah: category.jumlah ? category.jumlah.toString() : null,
            status: category.active === 1 ? 'Aktif' : 'Non-Aktif'
        };
    }

    serializeList(categories) {
        return categories.map(cat => this.serialize(cat));
    }
}

export default new KategoriReimbursementService();
