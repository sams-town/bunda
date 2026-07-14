import prisma from "../config/prisma.js";

class LaporanKinerjaService {
    /**
     * Get all laporan kinerjas with optional search & filters
     */
    async getAll(query = {}) {
        const search = query.search || "";
        const startDate = query.start_date ? new Date(query.start_date) : undefined;
        const endDate = query.end_date ? new Date(query.end_date) : undefined;

        const where = {};
        if (startDate || endDate) {
            where.tanggal = {};
            if (startDate) where.tanggal.gte = startDate;
            if (endDate) where.tanggal.lte = endDate;
        }

        const data = await prisma.laporan_kinerjas.findMany({
            where,
            orderBy: { id: "desc" },
        });

        // Map relations to fetch User names and Jenis names
        const result = await this._attachRelations(data);

        // Optional runtime search filter targeting nested values if needed
        let filteredResult = result;
        if (search) {
            const lowerSearch = search.toLowerCase();
            filteredResult = result.filter(item =>
                (item.nama_pegawai && item.nama_pegawai.toLowerCase().includes(lowerSearch)) ||
                (item.nama_jenis && item.nama_jenis.toLowerCase().includes(lowerSearch))
            );
        }

        return {
            data: this.serializeList(filteredResult),
        };
    }

    /**
     * Helper Method: Attach Users and Jenis Kinerja
     */
    async _attachRelations(records) {
        if (!records) return records;
        const isArray = Array.isArray(records);
        const data = isArray ? records : [records];

        const userIds = [...new Set(data.map(k => k.user_id).filter(id => id != null))];
        const jenisIds = [...new Set(data.map(k => k.jenis_kinerja_id).filter(id => id != null))];

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

        let jenisMap = {};
        if (jenisIds.length > 0) {
            const jenis = await prisma.jenis_kinerjas.findMany({
                where: { id: { in: jenisIds } }
            });
            jenisMap = jenis.reduce((acc, j) => {
                acc[j.id.toString()] = j;
                return acc;
            }, {});
        }

        for (const item of data) {
            if (item.user_id) item.users = userMap[item.user_id.toString()] || null;
            if (item.jenis_kinerja_id) item.jenis_kinerja = jenisMap[item.jenis_kinerja_id.toString()] || null;

            item.nama_pegawai = item.users?.name || 'Unknown';
            item.nama_jenis = item.jenis_kinerja?.nama || '-';
            // Prefer explicit nilai inside history, otherwise fallback to bobot master
            item.bobot = item.nilai !== null ? item.nilai : (item.jenis_kinerja?.bobot || 0);
        }

        return isArray ? data : data[0];
    }

    serialize(item) {
        const serialized = {};
        for (const [key, value] of Object.entries(item)) {
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

    serializeList(items) {
        return items.map((item) => this.serialize(item));
    }
}

export default new LaporanKinerjaService();
