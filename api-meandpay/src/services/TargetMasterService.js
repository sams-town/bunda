import prisma from "../config/prisma.js";

class TargetMasterService {
    serialize(item) {
        if (!item) return null;
        const serialized = {
            ...item,
            id: item.id.toString(),
            target_team: item.target_team?.toString(),
            jumlah_persen_team: item.jumlah_persen_team?.toString(),
            bonus_team: item.bonus_team?.toString(),
            jackpot: item.jackpot?.toString()
        };

        if (item.target_kinerja_teams) {
            serialized.target_kinerja_teams = item.target_kinerja_teams.map(t => ({
                ...t,
                id: t.id.toString(),
                target_kinerja_id: t.target_kinerja_id?.toString(),
                user_id: t.user_id?.toString(),
                jabatan_id: t.jabatan_id?.toString(),
                target_pribadi: t.target_pribadi?.toString(),
                jumlah_persen_pribadi: t.jumlah_persen_pribadi?.toString(),
                bonus_pribadi: t.bonus_pribadi?.toString(),
                jumlah: t.jumlah?.toString(),
                bonus_p: t.bonus_p?.toString(),
                bonus_t: t.bonus_t?.toString(),
                bonus_j: t.bonus_j?.toString()
            }));
        }

        return serialized;
    }

    async getAll(query = {}) {
        const search = query.search || "";

        const where = {
            OR: search ? [
                { nomor: { contains: search } }
            ] : undefined
        };

        const result = await prisma.target_kinerjas.findMany({
            where,
            orderBy: {
                created_at: 'desc'
            }
        });

        return {
            success: true,
            message: "Berhasil mengambil data target kinerja",
            data: result.map(item => this.serialize(item))
        };
    }

    async getById(id) {
        const item = await prisma.target_kinerjas.findUnique({
            where: { id: BigInt(id) },
            include: {
                target_kinerja_teams: {
                    include: {
                        users: true,
                        jabatans: true
                    }
                }
            }
        });

        if (!item) {
            return {
                success: false,
                message: "Data tidak ditemukan"
            };
        }

        return {
            success: true,
            message: "Berhasil mengambil detail data target kinerja",
            data: this.serialize(item)
        };
    }

    async create(data) {
        const teams = data.teams || [];
        const newItem = await prisma.target_kinerjas.create({
            data: {
                nomor: data.nomor,
                target_team: data.target_team ? BigInt(data.target_team) : null,
                jumlah_persen_team: data.jumlah_persen_team ? BigInt(data.jumlah_persen_team) : null,
                bonus_team: data.bonus_team ? BigInt(data.bonus_team) : null,
                jackpot: data.jackpot ? BigInt(data.jackpot) : null,
                tanggal_awal: data.tanggal_awal ? new Date(data.tanggal_awal) : null,
                tanggal_akhir: data.tanggal_akhir ? new Date(data.tanggal_akhir) : null,
                created_at: new Date(),
                updated_at: new Date(),
                target_kinerja_teams: {
                    create: teams.map(t => ({
                        user_id: t.user_id ? BigInt(t.user_id) : null,
                        jabatan_id: t.jabatan_id ? BigInt(t.jabatan_id) : null,
                        target_pribadi: t.target_pribadi ? BigInt(t.target_pribadi) : null,
                        jumlah_persen_pribadi: t.jumlah_persen_pribadi ? BigInt(t.jumlah_persen_pribadi) : null,
                        bonus_pribadi: t.bonus_pribadi ? BigInt(t.bonus_pribadi) : null,
                        created_at: new Date(),
                        updated_at: new Date()
                    }))
                }
            },
            include: {
                target_kinerja_teams: true
            }
        });

        return {
            success: true,
            message: "Berhasil menambahkan target kinerja",
            data: this.serialize(newItem)
        };
    }

    async update(id, data) {
        const teams = data.teams || [];

        const result = await prisma.$transaction(async (tx) => {
            // Delete existing teams
            await tx.target_kinerja_teams.deleteMany({
                where: { target_kinerja_id: BigInt(id) }
            });

            // Update master and create new teams
            const updatedMaster = await tx.target_kinerjas.update({
                where: { id: BigInt(id) },
                data: {
                    nomor: data.nomor,
                    target_team: data.target_team ? BigInt(data.target_team) : null,
                    jumlah_persen_team: data.jumlah_persen_team ? BigInt(data.jumlah_persen_team) : null,
                    bonus_team: data.bonus_team ? BigInt(data.bonus_team) : null,
                    jackpot: data.jackpot ? BigInt(data.jackpot) : null,
                    tanggal_awal: data.tanggal_awal ? new Date(data.tanggal_awal) : null,
                    tanggal_akhir: data.tanggal_akhir ? new Date(data.tanggal_akhir) : null,
                    updated_at: new Date(),
                    target_kinerja_teams: {
                        create: teams.map(t => ({
                            user_id: t.user_id ? BigInt(t.user_id) : null,
                            jabatan_id: t.jabatan_id ? BigInt(t.jabatan_id) : null,
                            target_pribadi: t.target_pribadi ? BigInt(t.target_pribadi) : null,
                            jumlah_persen_pribadi: t.jumlah_persen_pribadi ? BigInt(t.jumlah_persen_pribadi) : null,
                            bonus_pribadi: t.bonus_pribadi ? BigInt(t.bonus_pribadi) : null,
                            created_at: new Date(),
                            updated_at: new Date()
                        }))
                    }
                },
                include: {
                    target_kinerja_teams: true
                }
            });

            return updatedMaster;
        });

        return {
            success: true,
            message: "Berhasil memperbarui target kinerja",
            data: this.serialize(result)
        };
    }

    async delete(id) {
        return await prisma.$transaction(async (tx) => {
            // Delete associated team details first
            await tx.target_kinerja_teams.deleteMany({
                where: { target_kinerja_id: BigInt(id) }
            });

            // Delete the parent master target
            await tx.target_kinerjas.delete({
                where: { id: BigInt(id) }
            });

            return {
                success: true,
                message: "Berhasil menghapus target kinerja beserta seluruh rinciannya"
            };
        });
    }
}

export default new TargetMasterService();
