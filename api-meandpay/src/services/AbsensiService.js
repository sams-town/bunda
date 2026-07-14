import prisma from "../config/prisma.js";

class AbsensiService {
    async getAll(query = {}) {
        const search = query.search || "";
        const limit = parseInt(query.limit) || 10;
        const page = parseInt(query.page) || 1;
        const skip = (page - 1) * limit;

        const where = {
            AND: []
        };

        if (search) {
            where.AND.push({
                OR: [
                    { status_absen: { contains: search } },
                    { keterangan_masuk: { contains: search } },
                    { keterangan_pulang: { contains: search } },
                    { users: { name: { contains: search } } }
                ]
            });
        }

        if (query.user_id && query.user_id !== "undefined") {
            where.AND.push({ user_id: BigInt(query.user_id) });
        }

        if (query.lokasi_id && query.lokasi_id !== "undefined") {
            where.AND.push({ users: { lokasi_id: BigInt(query.lokasi_id) } });
        }

        if (query.tanggal) {
            const dateParts = query.tanggal.split("-").map(Number);
            if (dateParts.length === 3) {
                // Create date in local time to match how bulkCreateRange stores it
                const startOfDay = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0, 0);
                const endOfDay = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 23, 59, 59, 999);

                where.AND.push({
                    tanggal: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                });
            }
        }

        if (query.start_date && query.end_date) {
            where.AND.push({
                tanggal: {
                    gte: new Date(query.start_date),
                    lte: new Date(query.end_date)
                }
            });
        }

        if (query.has_logs === 'true') {
            where.AND.push({
                OR: [
                    { jam_absen: { not: null } },
                    { jam_pulang: { not: null } }
                ]
            });
        }

        const finalWhere = where.AND.length > 0 ? where : {};

        const [data, total] = await Promise.all([
            prisma.mapping_shifts.findMany({
                where: finalWhere,
                orderBy: [
                    { tanggal: "desc" },
                    { id: "desc" }
                ],
                skip,
                take: limit,
                include: {
                    users: {
                        include: {
                            lokasi: true
                        }
                    },
                    shifts: true
                }
            }),
            prisma.mapping_shifts.count({ where: finalWhere })
        ]);

        return { 
            data: this.serializeList(data),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getById(id) {
        const record = await prisma.mapping_shifts.findUnique({
            where: { id: BigInt(id) },
            include: {
                users: {
                    include: {
                        lokasi: true
                    }
                },
                shifts: true
            }
        });
        if (!record) return null;
        return this.serialize(record);
    }

     async getByIdUsers(id) {
        const record = await prisma.mapping_shifts.findFirst({
            where: { user_id: BigInt(id) },
            include: {
                users: {
                    include: {
                        lokasi: true
                    }
                },
                shifts: true
            },
            orderBy: { id: "desc" },
        });
        if (!record) return null;
        return this.serialize(record);
    }

    async getByIdUsersHistory(id, tanggal_mulai, tanggal_akhir) {
        const start = new Date(tanggal_mulai);
        let end = new Date(tanggal_akhir);

        // Always add 1 day to end date to make it inclusive (until end of that day)
        end.setDate(end.getDate() + 1);

        const record = await prisma.mapping_shifts.findMany({
            where: {
                user_id: BigInt(id),
                tanggal: {
                    gte: start,
                    lt: end
                }
            },
            include: {
                users: {
                    include: {
                        lokasi: true
                    }
                },
                shifts: true
            },
            orderBy: { id: "desc" },
        });
        if (!record) return null;
        return this.serializeList(record);
    }   

    async create(data) {
        const payload = { ...data };
        if (payload.user_id !== undefined) payload.user_id = BigInt(payload.user_id);
        if (payload.shift_id !== undefined) payload.shift_id = payload.shift_id ? BigInt(payload.shift_id) : null;
        if (payload.approved_by !== undefined) payload.approved_by = payload.approved_by ? BigInt(payload.approved_by) : null;
        if (payload.tanggal) {
            payload.tanggal = new Date(payload.tanggal);
        }

        const record = await prisma.mapping_shifts.create({ data: payload });
        return this.serialize(record);
    }

    async update(id, data) {
        const existing = await prisma.mapping_shifts.findUnique({ where: { id: BigInt(id) } });
        if (!existing) return null;

        const updateData = {};
        for (const [key, value] of Object.entries(data)) {
            // Filter invalid keys if there's any JSON empty brace issue or _method spoofing
            if (key === "{}" || key === "_method") continue;

            if (["user_id", "shift_id", "approved_by"].includes(key)) {
                updateData[key] = value ? BigInt(value) : null;
            } else if (key === "tanggal") {
                updateData[key] = new Date(value);
            } else {
                updateData[key] = value;
            }
        }

        const record = await prisma.mapping_shifts.update({ where: { id: BigInt(id) }, data: updateData });
        return this.serialize(record);
    }

    async delete(id) {
        const existing = await prisma.mapping_shifts.findUnique({ where: { id: BigInt(id) } });
        if (!existing) return null;
        await prisma.mapping_shifts.delete({ where: { id: BigInt(id) } });
        return true;
    }

    timeToMinutes(timeStr) {
        if (!timeStr) return 0;
        const parts = timeStr.split(':').map(val => parseInt(val, 10));
        if (parts.length < 2) return 0;
        return (parts[0] || 0) * 60 + (parts[1] || 0);
    }

    serialize(record) {
        const serialized = {};
        for (const [key, value] of Object.entries(record)) {
            if (typeof value === "bigint") {
                serialized[key] = value.toString();
            } else if (value instanceof Date) {
                serialized[key] = value.toISOString();
            } else if (key === 'foto_jam_absen' && value) {
                const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
                serialized[key] = value.startsWith('http') ? value : (value.startsWith('/') ? `${baseUrl}${value}` : `${baseUrl}/${value}`);
            } else if (key === 'foto_jam_pulang' && value) {
                const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
                serialized[key] = value.startsWith('http') ? value : (value.startsWith('/') ? `${baseUrl}${value}` : `${baseUrl}/${value}`);
            } else if (value && typeof value === "object" && !Array.isArray(value)) {
                serialized[key] = this.serialize(value);
            } else {
                serialized[key] = value;
            }
        }

        // Calculation for telat and pulang_cepat based on shifts
        if (record.shifts && (record.jam_absen || record.jam_pulang)) {
            const shiftMasuk = record.shifts.jam_masuk;
            const shiftKeluar = record.shifts.jam_keluar;
            const jamAbsen = record.jam_absen;
            const jamPulang = record.jam_pulang;
            const batasTerlambat = record.users?.batas_terlambat ? Number(record.users.batas_terlambat) : 0;

            if (jamAbsen && shiftMasuk) {
                const diff = this.timeToMinutes(jamAbsen) - this.timeToMinutes(shiftMasuk);
                serialized.telat = diff > batasTerlambat ? diff.toString() : "0";
                serialized.is_terlambat = diff > batasTerlambat;
            }
            if (jamPulang && shiftKeluar) {
                const diff = this.timeToMinutes(shiftKeluar) - this.timeToMinutes(jamPulang);
                serialized.pulang_cepat = diff > 0 ? diff.toString() : "0";
                serialized.is_pulang_cepat = diff > 0;
            }
        }

        return serialized;
    }

    async getRecap(startDate, endDate) {
        const users = await prisma.users.findMany({
            select: {
                id: true,
                name: true,
                foto_karyawan: true,
                foto_face_recognition: true,
                batas_terlambat: true
            }
        });

        const where = {};
        if (startDate && endDate) {
            where.tanggal = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        const attendance = await prisma.mapping_shifts.findMany({
            where,
            include: { shifts: true }
        });

        const result = users.map(user => {
            const userAttendance = attendance.filter(a => a.user_id === user.id);

            const stats = {
                total_cuti: 0,
                total_izin_masuk: 0,
                total_sakit: 0,
                total_izin_pulang_cepat: 0,
                total_hadir: 0,
                total_alfa: 0,
                total_libur: 0,
                total_telat: 0,
                total_hari_telat: 0,
                total_pulang_cepat: 0,
                total_lembur_minutes: 0
            };

            userAttendance.forEach(a => {
                if (a.status_absen === 'Cuti') stats.total_cuti++;
                else if (a.status_absen === 'Izin') stats.total_izin_masuk++;
                else if (a.status_absen === 'Sakit') stats.total_sakit++;
                else if (a.status_absen === 'Masuk' || a.status_absen === 'Pulang') stats.total_hadir++;
                else if (a.status_absen === 'Alfa') stats.total_alfa++;
                else if (a.status_absen === 'Libur') stats.total_libur++;

                const tolerance = user.batas_terlambat ? Number(user.batas_terlambat) : 0;
                let telatRecord = a.telat ? parseInt(a.telat) : 0;
                let pulangCepatRecord = a.pulang_cepat ? parseInt(a.pulang_cepat) : 0;

                // Sync with shifts if available
                if (a.shifts && (a.jam_absen || a.jam_pulang)) {
                    if (a.jam_absen && a.shifts.jam_masuk) {
                        const diff = this.timeToMinutes(a.jam_absen) - this.timeToMinutes(a.shifts.jam_masuk);
                        telatRecord = diff > 0 ? diff : 0;
                    }
                    if (a.jam_pulang && a.shifts.jam_keluar) {
                        const diff = this.timeToMinutes(a.shifts.jam_keluar) - this.timeToMinutes(a.jam_pulang);
                        pulangCepatRecord = diff > 0 ? diff : 0;
                    }
                }

                if (telatRecord > tolerance) {
                    stats.total_telat += (telatRecord - tolerance);
                    stats.total_hari_telat++;
                }
                
                if (pulangCepatRecord > 0) {
                    stats.total_pulang_cepat += pulangCepatRecord;
                }
            });

            const totalPossibleDays = stats.total_hadir + stats.total_alfa + stats.total_izin_masuk + stats.total_sakit + stats.total_cuti;
            const presencePercentage = totalPossibleDays > 0 ? Math.round((stats.total_hadir / totalPossibleDays) * 100) : 0;

            return {
                user_id: user.id.toString(),
                user: {
                    name: user.name,
                    foto_karyawan: user.foto_karyawan || user.foto_face_recognition
                },
                ...stats,
                total_lembur: "0 Jam 0 Menit", // Placeholder for actual calculation
                persentase_kehadiran: presencePercentage
            };
        });

        return result;
    }

    serializeList(items) {
        return items.map((i) => this.serialize(i));
    }
}
export default new AbsensiService();