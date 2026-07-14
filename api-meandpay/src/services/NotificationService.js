import prisma from "../config/prisma.js";

class NotificationService {
    async getAll(query = {}) {
        await this.checkExpiringContracts();
        const search = query.search || "";
        const notifiableId = query.notifiable_id;
        const where = {};
        if (search) {
            where.OR = [
                { type: { contains: search } },
                { notifiable_type: { contains: search } },
            ];
        }
        if (notifiableId !== undefined) {
            where.notifiable_id = BigInt(notifiableId);
        }
        const data = await prisma.notifications.findMany({
            where,
            orderBy: { created_at: "desc" },
        });

        // Parse data JSON dan kumpulkan semua user_id unik
        const serialized = this.serializeList(data);
        const userIds = new Set();
        for (const item of serialized) {
            if (item.data && typeof item.data === "string") {
                try {
                    item.data = JSON.parse(item.data);
                } catch { /* biarkan string */ }
            }
            if (item.data && item.data.user_id) {
                userIds.add(BigInt(item.data.user_id));
            }
        }

        // Fetch semua user terkait sekaligus
        let usersMap = {};
        if (userIds.size > 0) {
            const users = await prisma.users.findMany({
                where: { id: { in: Array.from(userIds) } },
                select: { id: true, name: true, foto_karyawan: true, foto_face_recognition: true }
            });
            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            usersMap = Object.fromEntries(users.map(u => {
                const photo = u.foto_karyawan || u.foto_face_recognition;
                return [
                    u.id.toString(),
                    {
                        id: u.id.toString(),
                        name: u.name,
                        foto_karyawan: photo
                            ? (photo.startsWith('http') ? photo : `${baseUrl}/uploads/profile/${photo}`)
                            : null
                    }
                ];
            }));
        }

        // Attach user ke setiap notifikasi
        for (const item of serialized) {
            const uid = item.data?.user_id;
            item.user = uid ? (usersMap[String(uid)] || null) : null;
        }

        return { data: serialized };
    }

    async getById(id) {
        const parsedId = Number(id);
        if (isNaN(parsedId)) return null;
        const record = await prisma.notifications.findUnique({ where: { id: parsedId } });
        if (!record) return null;
        const serialized = this.serialize(record);

        // Parse data JSON
        if (serialized.data && typeof serialized.data === "string") {
            try {
                serialized.data = JSON.parse(serialized.data);
            } catch { /* biarkan string */ }
        }

        // Fetch user terkait
        if (serialized.data?.user_id) {
            const user = await prisma.users.findUnique({
                where: { id: BigInt(serialized.data.user_id) },
                select: { id: true, name: true, foto_karyawan: true, foto_face_recognition: true }
            });
            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            if (user) {
                const photo = user.foto_karyawan || user.foto_face_recognition;
                serialized.user = {
                    id: user.id.toString(),
                    name: user.name,
                    foto_karyawan: photo
                        ? (photo.startsWith('http') ? photo : `${baseUrl}/uploads/profile/${photo}`)
                        : null
                };
            } else {
                serialized.user = null;
            }
        } else {
            serialized.user = null;
        }

        return serialized;
    }

    async create(data) {
        const payload = { ...data };
        if (payload.id) delete payload.id; // Ensure DB handles auto-increment
        if (payload.notifiable_id !== undefined) payload.notifiable_id = BigInt(payload.notifiable_id);
        if (payload.data && typeof payload.data === "object") payload.data = JSON.stringify(payload.data);
        if (payload.read_at) payload.read_at = new Date(payload.read_at);
        if (payload.created_at) payload.created_at = new Date(payload.created_at);
        if (payload.updated_at) payload.updated_at = new Date(payload.updated_at);

        const record = await prisma.notifications.create({ data: payload });
        return this.getById(record.id);
    }

    async update(id, data) {
        const parsedId = Number(id);
        if (isNaN(parsedId)) return null;
        const existing = await prisma.notifications.findUnique({ where: { id: parsedId } });
        if (!existing) return null;

        const updateData = { ...data };
        if (updateData.notifiable_id !== undefined) updateData.notifiable_id = updateData.notifiable_id ? BigInt(updateData.notifiable_id) : null;
        if (updateData.data && typeof updateData.data === "object") updateData.data = JSON.stringify(updateData.data);
        if (updateData.read_at) updateData.read_at = new Date(updateData.read_at);
        updateData.updated_at = new Date();

        const record = await prisma.notifications.update({ where: { id: parsedId }, data: updateData });
        return this.getById(record.id);
    }

    async delete(id) {
        const parsedId = Number(id);
        if (isNaN(parsedId)) return null;
        const existing = await prisma.notifications.findUnique({ where: { id: parsedId } });
        if (!existing) return null;
        await prisma.notifications.delete({ where: { id: parsedId } });
        return true;
    }

    async markRead(id) {
        const parsedId = Number(id);
        if (isNaN(parsedId)) return null;
        const existing = await prisma.notifications.findUnique({ where: { id: parsedId } });
        if (!existing) return null;
        const record = await prisma.notifications.update({ where: { id: parsedId }, data: { read_at: new Date() } });
        return this.getById(record.id);
    }

    async clearByNotifiableId(notifiableId) {
        const where = {};
        if (notifiableId) {
            where.notifiable_id = BigInt(notifiableId);
        }
        return await prisma.notifications.updateMany({
            where,
            data: { notifiable_id: BigInt(0) }
        });
    }

    async clearById(id) {
        const parsedId = Number(id);
        if (isNaN(parsedId)) return null;
        return await prisma.notifications.update({
            where: { id: parsedId },
            data: { notifiable_id: BigInt(0) }
        });
    }

    async checkExpiringContracts() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const thirtyDaysLater = new Date();
            thirtyDaysLater.setDate(today.getDate() + 30);
            thirtyDaysLater.setHours(23, 59, 59, 999);

            // 1. Fetch admins
            const admins = await prisma.users.findMany({
                where: {
                    OR: [
                        { is_admin: 'admin' },
                        { is_admin: 'superadmin' },
                        { id: 1n }
                    ]
                },
                select: { id: true }
            });

            if (admins.length === 0) return;

            const formatDate = (date) => {
                if (!date) return '';
                const d = new Date(date);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                return `${day}-${month}-${year}`;
            };

            // 2. Scan expiring contracts in kontraks table
            const expiringContracts = await prisma.kontraks.findMany({
                where: {
                    tanggal_selesai: {
                        lte: thirtyDaysLater
                    }
                }
            });

            if (expiringContracts.length > 0) {
                const contractUserIds = expiringContracts.map(c => c.user_id);
                const contractUsers = await prisma.users.findMany({
                    where: {
                        id: { in: contractUserIds }
                    },
                    select: { id: true, name: true }
                });
                const contractUserMap = new Map(contractUsers.map(u => [u.id.toString(), u.name]));

                for (const contract of expiringContracts) {
                    if (!contract.tanggal_selesai) continue;
                    const userName = contractUserMap.get(contract.user_id.toString()) || "Karyawan";
                    const tglSelesaiStr = formatDate(contract.tanggal_selesai);
                    const msg = `Kontrak kerja ${userName} akan berakhir pada ${tglSelesaiStr}`;
                    const contractIdStr = contract.id.toString();

                    for (const admin of admins) {
                        // Check if notification already exists for this contract and expiration date
                        const existingNotif = await prisma.notifications.findFirst({
                            where: {
                                type: 'Kontrak Berakhir',
                                notifiable_id: admin.id,
                                data: {
                                    AND: [
                                        { contains: `"contract_id":"${contractIdStr}"` },
                                        { contains: `"tanggal_selesai":"${contract.tanggal_selesai.toISOString()}"` }
                                    ]
                                }
                            }
                        });

                        if (!existingNotif) {
                            await prisma.notifications.create({
                                data: {
                                    type: 'Kontrak Berakhir',
                                    notifiable_type: 'App\\Models\\User',
                                    notifiable_id: admin.id,
                                    data: JSON.stringify({
                                        message: msg,
                                        contract_id: contractIdStr,
                                        user_id: contract.user_id.toString(),
                                        tanggal_selesai: contract.tanggal_selesai
                                    }),
                                    created_at: new Date(),
                                    updated_at: new Date()
                                }
                            });
                        }
                    }
                }
            }

            // 3. Scan expiring PKWT contracts in users table
            const expiringPKWTUsers = await prisma.users.findMany({
                where: {
                    tanggal_berakhir_pkwt: {
                        lte: thirtyDaysLater
                    }
                },
                select: { id: true, name: true, tanggal_berakhir_pkwt: true }
            });

            for (const employee of expiringPKWTUsers) {
                if (!employee.tanggal_berakhir_pkwt) continue;
                const tglSelesaiStr = formatDate(employee.tanggal_berakhir_pkwt);
                const msg = `PKWT ${employee.name} akan berakhir pada ${tglSelesaiStr}`;
                const employeeIdStr = employee.id.toString();

                for (const admin of admins) {
                    // Check if notification already exists for this employee and expiration date
                    const existingNotif = await prisma.notifications.findFirst({
                        where: {
                            type: 'Kontrak Berakhir',
                            notifiable_id: admin.id,
                            data: {
                                AND: [
                                    { contains: `"pkwt_user_id":"${employeeIdStr}"` },
                                    { contains: `"tanggal_selesai":"${employee.tanggal_berakhir_pkwt.toISOString()}"` }
                                ]
                            }
                        }
                    });

                    if (!existingNotif) {
                        await prisma.notifications.create({
                            data: {
                                type: 'Kontrak Berakhir',
                                notifiable_type: 'App\\Models\\User',
                                notifiable_id: admin.id,
                                data: JSON.stringify({
                                    message: msg,
                                    pkwt_user_id: employeeIdStr,
                                    user_id: employeeIdStr,
                                    tanggal_selesai: employee.tanggal_berakhir_pkwt
                                }),
                                created_at: new Date(),
                                updated_at: new Date()
                            }
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Gagal melakukan pengecekan kontrak berakhir:", err.message);
        }
    }

    serialize(record) {
        const serialized = {};
        for (const [key, value] of Object.entries(record)) {
            serialized[key] = typeof value === "bigint" ? value.toString() : value;
        }
        return serialized;
    }

    serializeList(items) {
        return items.map((i) => this.serialize(i));
    }
}

export default new NotificationService();