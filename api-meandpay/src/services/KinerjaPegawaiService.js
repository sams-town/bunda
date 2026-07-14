import prisma from "../config/prisma.js";

class KinerjaPegawaiService {
    async getSummary(query = {}) {
        const search = query.search || "";

        const where = {
            OR: search ? [
                { name: { contains: search } }
            ] : undefined
        };

        // Fetch users
        const users = await prisma.users.findMany({
            where,
            select: {
                id: true,
                name: true
            }
        });

        // Fetch all history for calculating aggregate sums
        const laporanKinerja = await prisma.laporan_kinerjas.findMany({
            select: {
                user_id: true,
                nilai: true,
                jenis_kinerja_id: true
            }
        });

        // Fetch masters to get weights dynamically
        const jenisKinerjas = await prisma.jenis_kinerjas.findMany();
        const jenisMap = jenisKinerjas.reduce((acc, j) => {
            acc[j.id.toString()] = j.bobot ? Number(j.bobot) : 0;
            return acc;
        }, {});

        // Compute scores for each user
        const userScores = {};
        for (const lap of laporanKinerja) {
            if (!lap.user_id) continue;
            const uid = lap.user_id.toString();
            const score = lap.nilai !== null ? Number(lap.nilai) : (lap.jenis_kinerja_id ? jenisMap[lap.jenis_kinerja_id.toString()] || 0 : 0);

            if (!userScores[uid]) {
                userScores[uid] = 0;
            }
            userScores[uid] += score;
        }

        const data = users.map(user => {
            const performance = userScores[user.id.toString()] || 0;
            let status = '';
            let color = '';

            if (performance >= 100) {
                status = 'Kinerja Baik';
                color = 'bg-blue-500';
            } else if (performance > 20) {
                status = 'Kinerja Cukup';
                color = 'bg-emerald-500';
            } else if (performance > 0) {
                status = 'Kinerja Cukup Buruk';
                color = 'bg-orange-500';
            } else {
                status = 'Kinerja Buruk';
                color = 'bg-red-500';
            }

            return {
                id: user.id.toString(),
                name: user.name,
                performance,
                status,
                color
            };
        });

        // Sort ascending by name for presentation
        data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        return {
            success: true,
            message: "Berhasil mengambil rekap kinerja pegawai",
            data
        };
    }
}

export default new KinerjaPegawaiService();
