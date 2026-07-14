import prisma from "../config/prisma.js";

class ReimbursementService {
    async getAll(query = {}) {
        const { search, user_id, status } = query;

        const where = {};
        if (user_id) where.user_id = BigInt(user_id);
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { event: { contains: search } },
                { user: { name: { contains: search } } }
            ];
        }

        const reimbursements = await prisma.reimbursements.findMany({
            where,
            include: {
                user: true,
                kategori: true,
                reimbursements_items: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: { id: 'desc' }
        });

        return this.serializeList(reimbursements);
    }

    async getById(id) {
        const reimbursement = await prisma.reimbursements.findUnique({
            where: { id: BigInt(id) },
            include: {
                user: true,
                kategori: true,
                reimbursements_items: {
                    include: {
                        user: true
                    }
                }
            }
        });
        return reimbursement ? this.serialize(reimbursement) : null;
    }

    async create(data) {
        const { items, ...reimbursementData } = data;

        const created = await prisma.$transaction(async (tx) => {
            const reimbursement = await tx.reimbursements.create({
                data: {
                    user_id: reimbursementData.user_id ? BigInt(reimbursementData.user_id) : null,
                    kategori_id: reimbursementData.kategori_id ? BigInt(reimbursementData.kategori_id) : null,
                    tanggal: reimbursementData.tanggal ? new Date(reimbursementData.tanggal) : null,
                    event: reimbursementData.event,
                    status: reimbursementData.status || 'Pending',
                    jumlah: reimbursementData.jumlah ? BigInt(reimbursementData.jumlah) : 0n,
                    qty: parseInt(reimbursementData.qty) || 1,
                    total: reimbursementData.total ? BigInt(reimbursementData.total) : 0n,
                    sisa: reimbursementData.sisa ? BigInt(reimbursementData.sisa) : 0n,
                    file_path: reimbursementData.file_path,
                    file_name: reimbursementData.file_name
                }
            });

            if (items && Array.isArray(items)) {
                await tx.reimbursements_items.createMany({
                    data: items.map(item => ({
                        reimbursement_id: reimbursement.id,
                        user_id: item.user_id ? BigInt(item.user_id) : null,
                        fee: item.fee ? BigInt(item.fee) : 0n
                    }))
                });
            }

            return reimbursement;
        });

        return this.getById(created.id);
    }

    async update(id, data) {
        const { items, ...reimbursementData } = data;

        const updated = await prisma.$transaction(async (tx) => {
            const reimbursement = await tx.reimbursements.update({
                where: { id: BigInt(id) },
                data: {
                    user_id: reimbursementData.user_id ? BigInt(reimbursementData.user_id) : null,
                    kategori_id: reimbursementData.kategori_id ? BigInt(reimbursementData.kategori_id) : null,
                    tanggal: reimbursementData.tanggal ? new Date(reimbursementData.tanggal) : null,
                    event: reimbursementData.event,
                    status: reimbursementData.status,
                    jumlah: reimbursementData.jumlah ? BigInt(reimbursementData.jumlah) : 0n,
                    qty: parseInt(reimbursementData.qty) || 1,
                    total: reimbursementData.total ? BigInt(reimbursementData.total) : 0n,
                    sisa: reimbursementData.sisa ? BigInt(reimbursementData.sisa) : 0n,
                    file_path: reimbursementData.file_path,
                    file_name: reimbursementData.file_name
                }
            });

            if (items && Array.isArray(items)) {
                await tx.reimbursements_items.deleteMany({
                    where: { reimbursement_id: reimbursement.id }
                });
                await tx.reimbursements_items.createMany({
                    data: items.map(item => ({
                        reimbursement_id: reimbursement.id,
                        user_id: item.user_id ? BigInt(item.user_id) : null,
                        fee: item.fee ? BigInt(item.fee) : 0n
                    }))
                });
            }

            return reimbursement;
        });

        return this.getById(updated.id);
    }

    async delete(id) {
        try {
            await prisma.$transaction(async (tx) => {
                await tx.reimbursements_items.deleteMany({
                    where: { reimbursement_id: BigInt(id) }
                });
                await tx.reimbursements.delete({
                    where: { id: BigInt(id) }
                });
            });
            return true;
        } catch (error) {
            console.error("ReimbursementService.delete error:", error);
            return false;
        }
    }

    serializeUser(user) {
        if (!user) return null;
        const bigIntFields = [
            'id', 'izin_cuti', 'izin_lainnya', 'izin_telat', 'izin_pulang_cepat',
            'status_pajak_id', 'jabatan_id', 'lokasi_id', 'gaji_pokok',
            'tunjangan_makan', 'tunjangan_transport', 'tunjangan_bpjs_kesehatan',
            'tunjangan_bpjs_ketenagakerjaan', 'lembur', 'kehadiran', 'thr',
            'bonus_pribadi', 'bonus_team', 'bonus_jackpot', 'izin', 'terlambat',
            'mangkir', 'saldo_kasbon', 'potongan_bpjs_kesehatan', 'potongan_bpjs_ketenagakerjaan'
        ];
        const result = { ...user };
        bigIntFields.forEach(f => {
            if (result[f] != null) result[f] = result[f].toString();
        });
        return result;
    }

    serialize(reimbursement) {
        return {
            ...reimbursement,
            id: reimbursement.id.toString(),
            user_id: reimbursement.user_id?.toString() ?? null,
            kategori_id: reimbursement.kategori_id?.toString() ?? null,
            jumlah: reimbursement.jumlah?.toString() ?? "0",
            total: reimbursement.total?.toString() ?? "0",
            sisa: reimbursement.sisa?.toString() ?? "0",
            // Hapus relasi asli prisma dari output
            user: undefined,
            kategori: undefined,
            // Ganti dengan key yang dipakai frontend
            users: this.serializeUser(reimbursement.user),
            kategoris: reimbursement.kategori ? {
                ...reimbursement.kategori,
                id: reimbursement.kategori.id.toString(),
                jumlah: reimbursement.kategori.jumlah?.toString() ?? "0"
            } : null,
            reimbursements_items: reimbursement.reimbursements_items?.map(item => ({
                ...item,
                id: item.id.toString(),
                reimbursement_id: item.reimbursement_id.toString(),
                user_id: item.user_id?.toString() ?? null,
                fee: item.fee?.toString() ?? "0",
                user: undefined,
                users: this.serializeUser(item.user)
            })) ?? []
        };
    }

    serializeList(reimbursements) {
        return reimbursements.map(r => this.serialize(r));
    }
}

export default new ReimbursementService();