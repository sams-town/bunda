import prisma from "../config/prisma.js";

class LaporanKerjaService {
    /**
     * Get all laporan kerjas with optional search
     */
    async getAll(query = {}) {
        const search = query.search || "";

        const where = {
            OR: search ? [
                { informasi_umum: { contains: search } },
                { pekerjaan_dilaksanakan: { contains: search } },
                { pekerjaan_belum_selesai: { contains: search } },
                { catatan: { contains: search } }
            ] : undefined
        };

        const data = await prisma.laporan_kerjas.findMany({
            where,
            orderBy: { id: "desc" },
        });

        // Attach user names
        const result = await this._attachRelations(data);

        // Name-based searching override
        let filteredResult = result;
        if (search) {
            const lowerSearch = search.toLowerCase();
            filteredResult = result.filter(item =>
                (item.nama_pegawai && item.nama_pegawai.toLowerCase().includes(lowerSearch)) ||
                (item.informasi_umum && item.informasi_umum.toLowerCase().includes(lowerSearch)) ||
                (item.pekerjaan_dilaksanakan && item.pekerjaan_dilaksanakan.toLowerCase().includes(lowerSearch)) ||
                (item.pekerjaan_belum_selesai && item.pekerjaan_belum_selesai.toLowerCase().includes(lowerSearch)) ||
                (item.catatan && item.catatan.toLowerCase().includes(lowerSearch))
            );
        }

        return {
            data: this.serializeList(filteredResult),
        };
    }

    /**
     * Attach relations (User names)
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
                acc[u.id.toString()] = u.name;
                return acc;
            }, {});
        }

        for (const item of data) {
            item.nama_pegawai = item.user_id ? (userMap[item.user_id.toString()] || 'Unknown') : 'Unknown';
        }

        return isArray ? data : data[0];
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

export default new LaporanKerjaService();
