import prisma from "../config/prisma.js";

class KasbonService {
    serialize(item) {
        if (!item) return null;
        return {
            ...item,
            id: item.id.toString(),
            user_id: item.user_id?.toString(),
            nominal: item.nominal?.toString(),
            user: item.user ? {
                id: item.user.id.toString(),
                name: item.user.name
            } : null
        };
    }

    async getAll(query = {}) {
        const search = query.search || "";
        const status = query.status || "";

        const where = {
            AND: [
                status ? { status } : {},
                search ? {
                    OR: [
                        { keperluan: { contains: search } },
                        { user: { name: { contains: search } } }
                    ]
                } : {}
            ]
        };

        const result = await prisma.kasbons.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return {
            success: true,
            message: "Berhasil mengambil data kasbon",
            data: result.map(item => this.serialize(item))
        };
    }

    async getById(id) {
        const item = await prisma.kasbons.findUnique({
            where: { id: BigInt(id) },
            include: {
                user: {
                    select: { id: true, name: true }
                }
            }
        });

        if (!item) {
            return {
                success: false,
                message: "Data kasbon tidak ditemukan"
            };
        }

        return {
            success: true,
            message: "Berhasil mengambil detail kasbon",
            data: this.serialize(item)
        };
    }

    async create(data) {
        const newItem = await prisma.kasbons.create({
            data: {
                user_id: BigInt(data.user_id),
                tanggal: new Date(data.tanggal),
                nominal: BigInt(data.nominal),
                keperluan: data.keperluan,
                status: data.status || "PENDING",
                created_at: new Date(),
                updated_at: new Date()
            },
            include: {
                user: {
                    select: { id: true, name: true, jabatan_id: true }
                }
            }
        });

        // ==========================================================
        // KIRIM NOTIFIKASI
        // ==========================================================
        try {
            const pemohon = await prisma.users.findUnique({
                where: { id: newItem.user_id },
                include: { jabatan: true }
            });

            if (pemohon && pemohon.id.toString() !== "1") {
                let managerId = "1";
                if (pemohon.jabatan && pemohon.jabatan.manager) {
                    managerId = pemohon.jabatan.manager.toString();
                }

                const notificationService = (await import("./NotificationService.js")).default;
                await notificationService.create({
                    type: 'Pengajuan Kasbon',
                    notifiable_type: 'App\\Models\\User',
                    notifiable_id: managerId,
                    data: {
                        message: `${pemohon.name} mengajukan kasbon sebesar Rp ${newItem.nominal.toLocaleString('id-ID')}`,
                        user_id: pemohon.id.toString(),
                        kasbon_id: newItem.id.toString(),
                        status: 'PENDING'
                    }
                });
            }
        } catch (err) {
            console.error("Gagal mengirim notifikasi kasbon:", err.message);
        }

        return {
            success: true,
            message: "Berhasil menambahkan data kasbon",
            data: this.serialize(newItem)
        };
    }

    async update(id, data) {
        const updateData = {
            user_id: data.user_id ? BigInt(data.user_id) : undefined,
            tanggal: data.tanggal ? new Date(data.tanggal) : undefined,
            nominal: data.nominal ? BigInt(data.nominal) : undefined,
            keperluan: data.keperluan,
            status: data.status,
            updated_at: new Date()
        };

        const result = await prisma.kasbons.update({
            where: { id: BigInt(id) },
            data: updateData,
            include: {
                user: {
                    select: { id: true, name: true }
                }
            }
        });

        return {
            success: true,
            message: "Berhasil memperbarui data kasbon",
            data: this.serialize(result)
        };
    }

    async delete(id) {
        await prisma.kasbons.delete({
            where: { id: BigInt(id) }
        });

        return {
            success: true,
            message: "Berhasil menghapus data kasbon"
        };
    }
}

export default new KasbonService();
