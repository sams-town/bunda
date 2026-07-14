import prisma from "../config/prisma.js";
import notificationService from "./NotificationService.js";

class CutiService {
    async getAll(query = {}) {
        const search = query.search || "";
        const where = search
            ? {
                OR: [
                    { nama_cuti: { contains: search } },
                    { alasan_cuti: { contains: search } },
                    { status_cuti: { contains: search } },
                ],
            }
            : {};
        const data = await prisma.cutis.findMany({
            where,
            orderBy: { id: "desc" },
            include: { users: { select: { id: true, name: true } } },
        });
        const ids = Array.from(new Set(data.map(d => d.user_id).filter(Boolean)));
        let usersMap = {};
        if (ids.length) {
            const users = await prisma.users.findMany({
                where: { id: { in: ids } },
                select: { id: true, name: true },
            });
            usersMap = Object.fromEntries(users.map(u => [u.id, u]));
        }
        const enriched = data.map(d => ({ ...d, pemohon: usersMap[d.user_id] || null }));
        return { data: this.serializeList(enriched) };
    }

    async getById(id) {
        const cuti = await prisma.cutis.findUnique({
            where: { id: BigInt(id) },
            include: { users: { select: { id: true, name: true } } },
        });
        if (!cuti) return null;
        let pemohon = null;
        if (cuti.user_id) {
            const user = await prisma.users.findUnique({
                where: { id: cuti.user_id },
                select: { id: true, name: true },
            });
            pemohon = user || null;
        }
        return this.serialize({ ...cuti, pemohon });
    }

    async getByUserId(userId) {
        const cutis = await prisma.cutis.findMany({
            where: { user_id: BigInt(userId) },
            orderBy: { id: "desc" },
            include: { users: { select: { id: true, name: true, jabatan: true } } },
        });
        return this.serializeList(cutis);
    }

    async create(data) {
        const now = new Date();
        
        // Handle tanggal_mulai and tanggal_akhir mapping
        let tanggalValue = data.tanggal;
        if (data.tanggal_mulai && data.tanggal_akhir) {
            tanggalValue = `${data.tanggal_mulai} - ${data.tanggal_akhir}`;
        }
        
        const cuti = await prisma.cutis.create({
            data: {
                ...this.sanitizeInput(data),
                tanggal: tanggalValue,
                status_cuti: "Pending",
                created_at: now,
                updated_at: now,
            },
        });

        // ==========================================================
        // KIRIM NOTIFIKASI
        // ==========================================================
        try {
            const pemohon = await prisma.users.findUnique({
                where: { id: cuti.user_id },
                include: { jabatan: true }
            });

            if (pemohon && pemohon.id.toString() !== "1") {
                let managerId = "1";
                if (pemohon.jabatan && pemohon.jabatan.manager) {
                    managerId = pemohon.jabatan.manager.toString();
                }

                await notificationService.create({
                    type: 'Pengajuan Cuti',
                    notifiable_type: 'App\\Models\\User',
                    notifiable_id: managerId,
                    data: {
                        message: `${pemohon.name} mengajukan cuti: ${tanggalValue}`,
                        user_id: pemohon.id.toString(),
                        cuti_id: cuti.id.toString(),
                        status: 'Pending'
                    },
                    created_at: now,
                    updated_at: now
                });
            }
        } catch (err) {
            console.error("Gagal mengirim notifikasi cuti:", err.message);
            // Jangan gagalkan transaksi cuti hanya karena notifikasi gagal
        }

        return this.serialize(cuti);
    }

    async update(id, data) {
        const existing = await prisma.cutis.findUnique({ where: { id: BigInt(id) } });
        if (!existing) return null;

        const cuti = await prisma.cutis.update({
            where: { id: BigInt(id) },
            data: { ...this.sanitizeInput(data), updated_at: new Date() },
        });
        return this.getById(id);
    }

    async delete(id) {
        const existing = await prisma.cutis.findUnique({ where: { id: BigInt(id) } });
        if (!existing) return null;
        await prisma.cutis.delete({ where: { id: BigInt(id) } });
        return true;
    }

    async approve(id, body = {}) {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.cutis.findUnique({ 
                where: { id: BigInt(id) }
             });
            if (!existing) return null;

            let approver = null;
            if (body.user_approval !== undefined && body.user_approval !== null) {
                const val = String(body.user_approval).trim();
                if (val !== "" && /^\d+$/.test(val)) {
                    approver = BigInt(val);
                } else {
                    throw new Error("user_approval harus berupa angka");
                }
            } else {
                throw new Error("Field 'user_approval' wajib diisi");
            }

            const pemohon = await tx.users.findUnique({
                where: { id: existing.user_id },
                include: { jabatan: true }
            });

            if (!pemohon) {
                throw new Error("Karyawan pemohon tidak ditemukan");
            }

            const approverUser = await tx.users.findUnique({
                where: { id: approver }
            });

            const isManager = pemohon.jabatan && pemohon.jabatan.manager && pemohon.jabatan.manager === approver;
            const isAdmin = approverUser?.is_admin === 'admin' || approverUser?.is_admin === 'superadmin' || approver === 1n;

            let newStatus = existing.status_cuti;
            let shouldFinalize = false;

            if (isManager && (existing.status_cuti === "Pending" || existing.status_cuti === "Menunggu")) {
                newStatus = "Disetujui Manager";
            } else if (isAdmin) {
                if (existing.status_cuti === "Disetujui Manager" || existing.status_cuti === "Pending" || existing.status_cuti === "Menunggu") {
                    newStatus = "Diterima";
                    shouldFinalize = true;
                }
            } else {
                throw new Error("Anda tidak memiliki wewenang untuk menyetujui pengajuan ini pada tahap ini.");
            }

            if (newStatus === existing.status_cuti) {
                throw new Error("Status pengajuan cuti tidak berubah atau Anda tidak berwenang pada tahap ini.");
            }

            // 2. Update status cuti ke status baru
            const cuti = await tx.cutis.update({
                where: { id: BigInt(id) },
                data: { user_approval: approver, status_cuti: newStatus, updated_at: new Date() },
                include: { users: { select: { id: true, name: true } } },
            });

            // 1. Hitung jumlah hari cuti (hanya jika difinalisasi oleh Admin)
            if (shouldFinalize) {
                let amount = 0;
                const t = existing.tanggal || "";
                if (t.includes(" - ")) {
                    const [start, end] = t.split(" - ");
                    const s = new Date(start);
                    const e = new Date(end);
                    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
                    amount = diff > 0 ? diff : 0;
                } else if (t) {
                    amount = 1;
                }

                // 3. Kurangi kuota cuti di tabel users
                if (amount > 0 && existing.user_id) {
                    const label = (existing.nama_cuti || "").toLowerCase();
                    let fieldToUpdate = "izin_lainnya";
                    if (label.includes("melahirkan")) fieldToUpdate = "cuti_melahirkan";
                    else if (label.includes("kematian") || label.includes("meninggal")) fieldToUpdate = "cuti_kematian";
                    else if (label.includes("tahunan") || (label.includes("cuti") && !label.includes("menikah"))) fieldToUpdate = "izin_cuti";
                    else if (label.includes("telat") || label.includes("terlambat")) fieldToUpdate = "izin_telat";
                    else if (label.includes("pulang")) fieldToUpdate = "izin_pulang_cepat";

                    await tx.users.update({
                        where: { id: existing.user_id },
                        data: {
                            [fieldToUpdate]: {
                                decrement: BigInt(amount)
                            }
                        }
                    });

                    // 4. Update mapping_shifts menjadi "Cuti" agar tidak dianggap Alfa
                    if (t.includes(" - ")) {
                        const [startStr, endStr] = t.split(" - ");
                        const start = new Date(startStr);
                        const end = new Date(endStr);
                        end.setDate(end.getDate() + 1); // include end date

                        await tx.mapping_shifts.updateMany({
                            where: {
                                user_id: existing.user_id,
                                tanggal: {
                                    gte: start,
                                    lt: end
                                }
                            },
                            data: {
                                status_absen: "Cuti"
                            }
                        });
                    } else if (t) {
                        const start = new Date(t);
                        const end = new Date(t);
                        end.setDate(end.getDate() + 1);

                        await tx.mapping_shifts.updateMany({
                            where: {
                                user_id: existing.user_id,
                                tanggal: {
                                    gte: start,
                                    lt: end
                                }
                            },
                            data: {
                                status_absen: "Cuti"
                            }
                        });
                    }
                }
            }

            // ==========================================================
            // KIRIM NOTIFIKASI
            // ==========================================================
            try {
                if (shouldFinalize) {
                    if (existing.user_id) {
                        await notificationService.create({
                            type: 'Persetujuan Cuti',
                            notifiable_type: 'App\\Models\\User',
                            notifiable_id: existing.user_id.toString(),
                            data: {
                                message: `Pengajuan cuti Anda telah disetujui`,
                                user_id: existing.user_id.toString(),
                                cuti_id: existing.id.toString(),
                                status: '2'
                            },
                            created_at: new Date(),
                            updated_at: new Date()
                        });
                    }
                } else {
                    // Notifikasi ke admin bahwa manager menyetujui
                    const admins = await tx.users.findMany({
                        where: {
                            OR: [
                                { is_admin: 'admin' },
                                { is_admin: 'superadmin' },
                                { id: 1n }
                            ]
                        },
                        select: { id: true }
                    });

                    for (const admin of admins) {
                        await notificationService.create({
                            type: 'Pengajuan Cuti',
                            notifiable_type: 'App\\Models\\User',
                            notifiable_id: admin.id.toString(),
                            data: {
                                message: `${pemohon.name} mengajukan cuti: ${existing.tanggal} (Disetujui Manager)`,
                                user_id: pemohon.id.toString(),
                                cuti_id: existing.id.toString(),
                                status: 'Disetujui Manager'
                            },
                            created_at: new Date(),
                            updated_at: new Date()
                        });
                    }
                }
            } catch (err) {
                console.error("Gagal mengirim notifikasi cuti:", err.message);
            }

            return this.serialize(cuti);
        });
    }

    sanitizeInput(data) {
        const allowedFields = [
            "lokasi_id",
            "user_id",
            "nama_cuti",
            "tanggal",
            "alasan_cuti",
            "foto_cuti",
            "status_cuti",
            "catatan",
            "user_approval",
        ];
        const bigIntFields = ["lokasi_id", "user_id", "user_approval"];
        const sanitized = {};

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                if (bigIntFields.includes(field)) {
                    sanitized[field] = data[field] !== null && data[field] !== "" ? BigInt(data[field]) : null;
                } else {
                    sanitized[field] = data[field];
                }
            }
        }
        return sanitized;
    }

    serialize(item) {
        if (item === null || item === undefined) return item;
        if (typeof item === "bigint") return item.toString();
        if (Array.isArray(item)) return item.map((i) => this.serialize(i));
        if (typeof item === "object" && !(item instanceof Date)) {
            return Object.fromEntries(
                Object.entries(item).map(([key, value]) => [key, this.serialize(value)])
            );
        }
        return item;
    }

    serializeList(list) {
        return list.map((item) => this.serialize(item));
    }
}

export default new CutiService();