import prisma from "../config/prisma.js";

class PengajuanKeuanganService {
    serialize(item) {
        if (!item) return null;
        return {
            ...item,
            id: item.id.toString(),
            user_id: item.user_id?.toString(),
            total_harga: item.total_harga?.toString(),
            user_approval: item.user_approval?.toString(),
            requester: item.requester ? {
                ...item.requester,
                id: item.requester.id.toString()
            } : null,
            approver: item.approver ? {
                ...item.approver,
                id: item.approver.id.toString()
            } : null,
            items: item.items ? item.items.map(i => ({
                ...i,
                id: i.id.toString(),
                pengajuan_keuangan_id: i.pengajuan_keuangan_id?.toString(),
                harga: i.harga?.toString(),
                total: i.total?.toString()
            })) : []
        };
    }

    async getAll(query = {}) {
        const search = query.search || "";
        const status = query.status || "";

        const where = {
            AND: [
                status ? { status } : {},
                {
                    OR: search ? [
                        { nomor: { contains: search } },
                        { keterangan: { contains: search } },
                        { requester: { name: { contains: search } } }
                    ] : undefined
                }
            ]
        };

        const result = await prisma.pengajuan_keuangans.findMany({
            where,
            include: {
                requester: {
                    select: { id: true, name: true }
                },
                approver: {
                    select: { id: true, name: true }
                },
                items: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return {
            success: true,
            message: "Berhasil mengambil data pengajuan keuangan",
            data: result.map(item => this.serialize(item))
        };
    }

    async getById(id) {
        const item = await prisma.pengajuan_keuangans.findUnique({
            where: { id: BigInt(id) },
            include: {
                requester: true,
                approver: true,
                items: true
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
            message: "Berhasil mengambil detail pengajuan keuangan",
            data: this.serialize(item)
        };
    }

    async create(data, files = {}) {
        const items = data.items ? JSON.parse(data.items) : [];

        const newItem = await prisma.pengajuan_keuangans.create({
            data: {
                user_id: data.user_id ? BigInt(data.user_id) : null,
                nomor: data.nomor,
                tanggal: data.tanggal ? new Date(data.tanggal) : new Date(),
                total_harga: data.total_harga ? BigInt(data.total_harga) : 0n,
                keterangan: data.keterangan,
                pk_file_path: files.pk_document?.[0]?.path,
                pk_file_name: files.pk_document?.[0]?.originalname,
                status: data.status || 'PENDING',
                created_at: new Date(),
                updated_at: new Date(),
                items: {
                    create: items.map(i => ({
                        nama: i.nama,
                        qty: parseFloat(i.qty) || 0,
                        harga: i.harga ? BigInt(i.harga) : 0n,
                        total: (parseFloat(i.qty) || 0) * (i.harga ? Number(i.harga) : 0),
                        created_at: new Date(),
                        updated_at: new Date()
                    }))
                }
            },
            include: {
                items: true
            }
        });

        return {
            success: true,
            message: "Berhasil menambahkan pengajuan keuangan",
            data: this.serialize(newItem)
        };
    }

    async update(id, data, files = {}) {
        const items = data.items ? JSON.parse(data.items) : null;

        const updateData = {
            nomor: data.nomor,
            tanggal: data.tanggal ? new Date(data.tanggal) : undefined,
            total_harga: data.total_harga ? BigInt(data.total_harga) : undefined,
            keterangan: data.keterangan,
            status: data.status,
            user_approval: data.user_approval ? BigInt(data.user_approval) : undefined,
            note_approval: data.note_approval,
            updated_at: new Date()
        };

        if (files.pk_document) {
            updateData.pk_file_path = files.pk_document[0].path;
            updateData.pk_file_name = files.pk_document[0].originalname;
        }

        if (files.nota) {
            updateData.nota_file_path = files.nota[0].path;
            updateData.nota_file_name = files.nota[0].originalname;
        }

        const result = await prisma.$transaction(async (tx) => {
            if (items) {
                // Delete existing items
                await tx.pengajuan_keuangan_items.deleteMany({
                    where: { pengajuan_keuangan_id: BigInt(id) }
                });

                // Add to updateData
                updateData.items = {
                    create: items.map(i => ({
                        nama: i.nama,
                        qty: parseFloat(i.qty) || 0,
                        harga: i.harga ? BigInt(i.harga) : 0n,
                        total: (parseFloat(i.qty) || 0) * (i.harga ? Number(i.harga) : 0),
                        created_at: new Date(),
                        updated_at: new Date()
                    }))
                };
            }

            return await tx.pengajuan_keuangans.update({
                where: { id: BigInt(id) },
                data: updateData,
                include: { items: true }
            });
        });

        return {
            success: true,
            message: "Berhasil memperbarui pengajuan keuangan",
            data: this.serialize(result)
        };
    }

    async delete(id) {
        await prisma.pengajuan_keuangans.delete({
            where: { id: BigInt(id) }
        });

        return {
            success: true,
            message: "Berhasil menghapus pengajuan keuangan"
        };
    }
}

export default new PengajuanKeuanganService();
