import prisma from "../config/prisma.js";

class TargetKinerjaService {
    serialize(item) {
        if (!item) return null;
        return {
            ...item,
            id: item.id.toString(),
            target_team: item.target_team?.toString() || "0",
            jumlah_persen_team: item.jumlah_persen_team?.toString() || "0",
            bonus_team: item.bonus_team?.toString() || "0",
            jackpot: item.jackpot?.toString() || "0"
        };
    }

    async getAll() {
        const result = await prisma.target_kinerjas.findMany({
            orderBy: { id: 'desc' }
        });
        return {
            success: true,
            data: result.map(item => this.serialize(item))
        };
    }

    async create(data) {
        const newItem = await prisma.target_kinerjas.create({
            data: {
                nomor: data.nomor,
                target_team: data.target_team ? BigInt(data.target_team) : 0n,
                jumlah_persen_team: data.jumlah_persen_team ? BigInt(data.jumlah_persen_team) : 0n,
                bonus_team: data.bonus_team ? BigInt(data.bonus_team) : 0n,
                jackpot: data.jackpot ? BigInt(data.jackpot) : 0n,
                tanggal_awal: data.tanggal_awal ? new Date(data.tanggal_awal) : null,
                tanggal_akhir: data.tanggal_akhir ? new Date(data.tanggal_akhir) : null
            }
        });
        return {
            success: true,
            message: "Berhasil menambahkan master target kienrja",
            data: this.serialize(newItem)
        };
    }
}

export default new TargetKinerjaService();
