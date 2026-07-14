import prisma from "../config/prisma.js";

class TargetDetailService {
    serialize(item) {
        if (!item) return null;

        const targetPribadi = Number(item.target_pribadi || 0);
        const jumlahPenjualan = Number(item.jumlah || 0);
        const sisa = targetPribadi - jumlahPenjualan;
        const sisaTargetPersen = targetPribadi > 0 ? (sisa / targetPribadi) * 100 : 0;
        const capaiPersen = targetPribadi > 0 ? (jumlahPenjualan / targetPribadi) * 100 : 0;

        return {
            ...item,
            id: item.id.toString(),
            target_kinerja_id: item.target_kinerja_id?.toString() || null,
            user_id: item.user_id?.toString() || null,
            jabatan_id: item.jabatan_id?.toString() || null,
            target_pribadi: item.target_pribadi?.toString() || "0",
            jumlah_persen_pribadi: item.jumlah_persen_pribadi?.toString() || "0",
            bonus_pribadi: item.bonus_pribadi?.toString() || "0",
            jumlah: item.jumlah?.toString() || "0",
            bonus_p: item.bonus_p?.toString() || "0",
            bonus_t: item.bonus_t?.toString() || "0",
            bonus_j: item.bonus_j?.toString() || "0",
            // Calculated fields
            sisa: sisa.toString(),
            sisa_target_persen: sisaTargetPersen.toFixed(2),
            capai_persen: capaiPersen.toFixed(2),
            // Nested relations
            users: item.users ? {
                ...item.users,
                id: item.users.id.toString()
            } : null,
            target_kinerjas: item.target_kinerjas ? {
                ...item.target_kinerjas,
                id: item.target_kinerjas.id.toString(),
                target_team: item.target_kinerjas.target_team?.toString() || "0",
                jumlah_persen_team: item.target_kinerjas.jumlah_persen_team?.toString() || "0",
                bonus_team: item.target_kinerjas.bonus_team?.toString() || "0"
            } : null,
            jabatans: item.jabatans ? {
                ...item.jabatans,
                id: item.jabatans.id.toString()
            } : null
        };
    }

    async getAll(query = {}) {
        const search = query.search || "";

        const where = {
            OR: search ? [
                { judul: { contains: search } },
                { keterangan: { contains: search } },
                { users: { name: { contains: search } } },
                { target_kinerjas: { nomor: { contains: search } } }
            ] : undefined
        };

        const result = await prisma.target_kinerja_teams.findMany({
            where,
            include: {
                users: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                target_kinerjas: {
                    select: {
                        id: true,
                        nomor: true,
                        tanggal_awal: true,
                        tanggal_akhir: true,
                        target_team: true,
                        jumlah_persen_team: true,
                        bonus_team: true
                    }
                },
                jabatans: {
                    select: {
                        id: true,
                        nama_jabatan: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return {
            success: true,
            message: "Berhasil mengambil data detail target kinerja",
            data: result.map(item => this.serialize(item))
        };
    }

    async getById(id) {
        const item = await prisma.target_kinerja_teams.findUnique({
            where: { id: BigInt(id) },
            include: {
                users: true,
                target_kinerjas: true,
                jabatans: true
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
            message: "Berhasil mengambil data detail target kinerja",
            data: this.serialize(item)
        };
    }

    async create(data) {
        const newItem = await prisma.target_kinerja_teams.create({
            data: {
                target_kinerja_id: data.target_kinerja_id ? BigInt(data.target_kinerja_id) : null,
                user_id: data.user_id ? BigInt(data.user_id) : null,
                jabatan_id: data.jabatan_id ? BigInt(data.jabatan_id) : null,
                target_pribadi: data.target_pribadi ? BigInt(data.target_pribadi) : 0n,
                jumlah_persen_pribadi: data.jumlah_persen_pribadi ? BigInt(data.jumlah_persen_pribadi) : 0n,
                bonus_pribadi: data.bonus_pribadi ? BigInt(data.bonus_pribadi) : 0n,
                judul: data.judul,
                jumlah: data.jumlah ? BigInt(data.jumlah) : 0n,
                capai: data.capai ? parseFloat(data.capai) : 0,
                nilai: data.nilai,
                bonus_p: data.bonus_p ? BigInt(data.bonus_p) : 0n,
                bonus_t: data.bonus_t ? BigInt(data.bonus_t) : 0n,
                bonus_j: data.bonus_j ? BigInt(data.bonus_j) : 0n,
                keterangan: data.keterangan,
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        return {
            success: true,
            message: "Berhasil menambahkan target kinerja detail",
            data: this.serialize(newItem)
        };
    }

    async update(id, data) {
        const updatedItem = await prisma.target_kinerja_teams.update({
            where: { id: BigInt(id) },
            data: {
                target_kinerja_id: data.target_kinerja_id ? BigInt(data.target_kinerja_id) : undefined,
                user_id: data.user_id ? BigInt(data.user_id) : undefined,
                jabatan_id: data.jabatan_id ? BigInt(data.jabatan_id) : undefined,
                target_pribadi: data.target_pribadi !== undefined ? BigInt(data.target_pribadi) : undefined,
                jumlah_persen_pribadi: data.jumlah_persen_pribadi !== undefined ? BigInt(data.jumlah_persen_pribadi) : undefined,
                bonus_pribadi: data.bonus_pribadi !== undefined ? BigInt(data.bonus_pribadi) : undefined,
                judul: data.judul,
                jumlah: data.jumlah !== undefined ? BigInt(data.jumlah) : undefined,
                capai: data.capai !== undefined ? parseFloat(data.capai) : undefined,
                nilai: data.nilai,
                bonus_p: data.bonus_p !== undefined ? BigInt(data.bonus_p) : undefined,
                bonus_t: data.bonus_t !== undefined ? BigInt(data.bonus_t) : undefined,
                bonus_j: data.bonus_j !== undefined ? BigInt(data.bonus_j) : undefined,
                keterangan: data.keterangan,
                updated_at: new Date()
            }
        });

        return {
            success: true,
            message: "Berhasil memperbarui target kinerja detail",
            data: this.serialize(updatedItem)
        };
    }

    async delete(id) {
        await prisma.target_kinerja_teams.delete({
            where: { id: BigInt(id) }
        });

        return {
            success: true,
            message: "Berhasil menghapus target kinerja detail"
        };
    }
}

export default new TargetDetailService();
