import prisma from "../config/prisma.js";

class PayrollService {
    serialize(item) {
        if (!item) return null;

        const json = JSON.stringify(item, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );
        return JSON.parse(json);
    }

    cleanNumeric(val) {
        if (val === undefined || val === null) return 0;
        if (typeof val === 'number') return val;
        if (typeof val === 'bigint') return Number(val);
        let str = String(val).trim().replace(/rp\.?/i, '').replace(/\s/g, '').replace(/[,.]00$/, '');
        const dotCount = (str.match(/\./g) || []).length;
        const commaCount = (str.match(/,/g) || []).length;
        if (dotCount > 0 && commaCount === 0) {
            if (dotCount > 1 || (dotCount === 1 && str.split('.')[1].length === 3)) {
                str = str.replace(/\./g, '');
            }
        } else if (commaCount > 0 && dotCount === 0) {
            if (commaCount > 1 || (commaCount === 1 && str.split(',')[1].length === 3)) {
                str = str.replace(/,/g, '');
            } else {
                str = str.replace(/,/g, '.');
            }
        } else if (dotCount > 0 && commaCount > 0) {
            if (str.indexOf('.') < str.indexOf(',')) {
                str = str.replace(/\./g, '').replace(/,/g, '.');
            } else {
                str = str.replace(/,/g, '');
            }
        }
        const parsed = parseFloat(str);
        return isNaN(parsed) ? 0 : parsed;
    }

    async getAll(query = {}) {
        const { bulan, tahun, search } = query;
        const where = {
            AND: [
                bulan ? { bulan } : {},
                tahun ? { tahun } : {},
                search ? {
                    employee: { name: { contains: search } }
                } : {}
            ]
        };

        const result = await prisma.payrolls.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        rekening: true,
                        nama_rekening: true,
                        tgl_join: true,
                        jabatan: {
                            select: { nama_jabatan: true }
                        }
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return {
            success: true,
            message: "Berhasil mengambil data payroll",
            data: result.map(item => this.serialize(item))
        };
    }

    async getById(id) {
        const item = await prisma.payrolls.findUnique({
            where: { id: BigInt(id) },
            include: {
                employee: {
                    include: {
                        jabatan: true
                    }
                }
            }
        });

        if (!item) {
            return {
                success: false,
                message: "Data payroll tidak ditemukan"
            };
        }

        return {
            success: true,
            message: "Berhasil mengambil detail payroll",
            data: this.serialize(item)
        };
    }

    getWhere(conditions) {
        const self = this;
        return {
            async first() {
                const item = await prisma.payrolls.findFirst({
                    where: conditions,
                    include: {
                        employee: {
                            include: {
                                jabatan: true
                            }
                        }
                    }
                });

                if (!item) {
                    return {
                        success: false,
                        message: "Data payroll tidak ditemukan"
                    };
                }

                return {
                    success: true,
                    message: "Berhasil mengambil detail payroll",
                    data: self.serialize(item)
                };
            }
        };
    }

    async update(id, data) {
        // Convert numeric fields to BigInt if they exist
        const numericFields = [
            'gaji_pokok', 'total_reimbursement', 'jumlah_tunjangan_transport', 'uang_tunjangan_transport', 'total_tunjangan_transport',
            'jumlah_tunjangan_makan', 'uang_tunjangan_makan', 'total_tunjangan_makan', 'total_tunjangan_bpjs_kesehatan',
            'total_tunjangan_bpjs_ketenagakerjaan', 'total_potongan_bpjs_kesehatan', 'total_potongan_bpjs_ketenagakerjaan',
            'jumlah_mangkir', 'uang_mangkir', 'total_mangkir', 'jumlah_lembur', 'uang_lembur', 'total_lembur',
            'jumlah_izin', 'uang_izin', 'total_izin', 'bonus_pribadi', 'bonus_team', 'bonus_jackpot',
            'jumlah_terlambat', 'uang_terlambat', 'total_terlambat', 'jumlah_kehadiran', 'uang_kehadiran', 'total_kehadiran',
            'saldo_kasbon', 'bayar_kasbon', 'jumlah_thr', 'uang_thr', 'total_thr', 'loss',
            'total_penjumlahan', 'total_pengurangan', 'grand_total', 'potongan_koperasi'
        ];

        const updateData = { ...data };
        delete updateData.id;
        delete updateData.user;
        delete updateData.user_id;
        delete updateData.created_at;
        delete updateData.updated_at;

        numericFields.forEach(field => {
            if (updateData[field] !== undefined) {
                updateData[field] = BigInt(Math.round(parseFloat(updateData[field]) || 0));
            }
        });

        if (updateData.tanggal_mulai) updateData.tanggal_mulai = new Date(updateData.tanggal_mulai);
        if (updateData.tanggal_akhir) updateData.tanggal_akhir = new Date(updateData.tanggal_akhir);

        const result = await prisma.payrolls.update({
            where: { id: BigInt(id) },
            data: updateData
        });

        return {
            success: true,
            message: "Berhasil memperbarui data payroll",
            data: this.serialize(result)
        };
    }

    async delete(id) {
        await prisma.payrolls.delete({
            where: { id: BigInt(id) }
        });

        return {
            success: true,
            message: "Berhasil menghapus data payroll"
        };
    }

    async generateAll(bulan, tahun, tanggalMulai, tanggalAkhir) {
        return await prisma.$transaction(async (tx) => {
            // Get all users who are not admins
            const allUsers = await tx.users.findMany({
                where: {
                    OR: [
                        { is_admin: { notIn: ['admin', 'superadmin', 'super_admin', 'super admin'] } },
                        { is_admin: null }
                    ]
                },
                include: {
                    jabatan: true
                },
                orderBy: {
                    name: 'asc'
                }
            });

            const results = [];
            const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            const monthIndex = monthNames.indexOf(bulan);

            if (monthIndex === -1) throw new Error(`Bulan tidak valid: ${bulan}`);

            const startDate = tanggalMulai ? new Date(tanggalMulai) : new Date(parseInt(tahun), monthIndex, 1);
            const endDate = tanggalAkhir ? new Date(tanggalAkhir) : new Date(parseInt(tahun), monthIndex + 1, 0);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error("Tanggal periode tidak valid");
            }

            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];

            // Clear existing payroll for this period to prevent duplicates
            await tx.payrolls.deleteMany({
                where: {
                    bulan: bulan,
                    tahun: tahun.toString()
                }
            });

            // Fetch all necessary data outside the loop
            const absensiService = (await import("./AbsensiService.js")).default;
            
            const [allLemburs, allMappingShifts, allReimbursements, allKasbons, allCutis] = await Promise.all([
                tx.lemburs.findMany({
                    where: {
                        status: 'Approved',
                        tanggal: { gte: startDateStr, lte: endDateStr }
                    }
                }),
                tx.mapping_shifts.findMany({
                    where: {
                        tanggal: { gte: startDate, lte: endDate }
                    },
                    include: { shifts: true }
                }),
                tx.reimbursements.findMany({
                    where: {
                        status: 'Approved',
                        tanggal: { gte: startDate, lte: endDate }
                    }
                }),
                tx.kasbons.findMany({
                    where: {
                        status: 'Approved',
                        tanggal: { gte: startDate, lte: endDate }
                    }
                }),
                tx.cutis.findMany({
                    where: {
                        status_cuti: 'Diterima',
                        tanggal: { gte: startDateStr, lte: endDateStr }
                    }
                })
            ]);

            // Fetch reimbursement items for the specific reimbursements found
            const reimbursementIds = allReimbursements.map(r => r.id);
            const userReimbursementItems = await tx.reimbursements_items.findMany({
                where: {
                    reimbursement_id: { in: reimbursementIds }
                }
            });

            // Group data by user_id for O(1) lookup
            const lembursByUser = new Map();
            allLemburs.forEach(l => {
                const list = lembursByUser.get(l.user_id) || [];
                list.push(l);
                lembursByUser.set(l.user_id, list);
            });

            const shiftsByUser = new Map();
            allMappingShifts.forEach(m => {
                const list = shiftsByUser.get(m.user_id) || [];
                list.push(m);
                shiftsByUser.set(m.user_id, list);
            });

            const reimbursementsByUser = new Map();
            allReimbursements.forEach(r => {
                const list = reimbursementsByUser.get(r.user_id) || [];
                list.push(r);
                reimbursementsByUser.set(r.user_id, list);
            });

            const itemsByUser = new Map();
            userReimbursementItems.forEach(item => {
                if (item.user_id) {
                    const list = itemsByUser.get(item.user_id) || [];
                    list.push(item);
                    itemsByUser.set(item.user_id, list);
                }
            });

            const cutisByUser = new Map();
            allCutis.forEach(c => {
                if (c.user_id) {
                    const list = cutisByUser.get(c.user_id) || [];
                    list.push(c);
                    cutisByUser.set(c.user_id, list);
                }
            });

            let counterRecord = await tx.counters.findFirst({ where: { name: 'Gaji' } });
            if (!counterRecord) {
                counterRecord = await tx.counters.create({ data: { name: 'Gaji', counter: 0, text: 'GJ' } });
            }

            // Optimize counters: update counter by total count in a single query
            const startCounter = BigInt(counterRecord.counter);
            const totalUsers = allUsers.length;
            await tx.counters.update({
                where: { id: counterRecord.id },
                data: { counter: counterRecord.counter + totalUsers }
            });

            const jumlahHari = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            let userIndex = 0n;
            for (const user of allUsers) {
                const userMappingShifts = shiftsByUser.get(user.id) || [];
                const userCutis = cutisByUser.get(user.id) || [];
                const userLemburs = lembursByUser.get(user.id) || [];
                const userReimbursements = reimbursementsByUser.get(user.id) || [];
                const userItems = itemsByUser.get(user.id) || [];

                const currentEmpCounter = startCounter + userIndex + 1n;
                const nextNumber = currentEmpCounter.toString().padStart(6, '0');
                const noGaji = `${counterRecord.text || 'GJ'}/${nextNumber}`;
                userIndex += 1n;

                // Attendance calculations
                const hadir = userMappingShifts.filter(m => 
                    ['Masuk', 'Pulang', 'Dinas Luar', 'Izin Telat', 'Izin Pulang Cepat'].includes(m.status_absen)
                ).length;

                const cuti = userMappingShifts.filter(m => m.status_absen === 'Cuti').length;
                const sakit = userMappingShifts.filter(m => m.status_absen === 'Sakit').length;
                const libur = userMappingShifts.filter(m => m.status_absen === 'Libur').length;
                const izinMasukMapping = userMappingShifts.filter(m => m.status_absen === 'Izin Masuk').length;
                const izinPelatihan = userMappingShifts.filter(m => m.status_absen === 'Izin Pelatihan').length;

                const persentaseKehadiran = (jumlahHari > 0) ? 
                    ((hadir + cuti + sakit + libur) / jumlahHari) * 100 : 0;

                const totalAlfa = Math.max(0, jumlahHari - hadir - cuti - izinMasukMapping - libur - sakit - izinPelatihan);

                // Overtime
                const totalLemburDetik = userLemburs.reduce((acc, l) => acc + BigInt(l.total_lembur || 0), 0n);
                const jamLembur = totalLemburDetik / 3600n;
                const totalLemburUang = jamLembur * (user.lembur || 0n);

                // Reimbursement
                const sisaReimbursement = userReimbursements.reduce((acc, r) => acc + (r.sisa || 0n), 0n);
                const feeReimbursement = userItems.reduce((acc, item) => acc + (item.fee || 0n), 0n);
                const totalReimbursementUang = sisaReimbursement + feeReimbursement;

                // Izin count
                const countIzin = userCutis.filter(c => c.nama_cuti === 'Izin Masuk').length;

                // Lateness
                let totalMenitTelat = 0n;
                const tolerance = user.batas_terlambat ? Number(user.batas_terlambat) : 0;
                
                userMappingShifts.forEach(m => {
                    let telatMins = 0;
                    if (m.shifts && m.jam_absen && m.shifts.jam_masuk) {
                        const diff = absensiService.timeToMinutes(m.jam_absen) - absensiService.timeToMinutes(m.shifts.jam_masuk);
                        telatMins = diff > 0 ? diff : 0;
                    } else if (m.telat) {
                        telatMins = parseInt(m.telat) || 0;
                    }

                    if (telatMins > tolerance) {
                        totalMenitTelat += BigInt(telatMins - tolerance);
                    }
                });

                const potonganPerMenit = user.terlambat || 0n; 
                const totalTerlambat = totalMenitTelat * potonganPerMenit;

                const jumlahKehadiranIndicator = (persentaseKehadiran >= 100) ? 1n : 0n;
                const totalKehadiranBonus = jumlahKehadiranIndicator * (user.kehadiran || 0n);

                const uangMangkir = user.mangkir || 0n;
                const totalMangkir = BigInt(totalAlfa) * uangMangkir;
                
                const uangIzin = user.izin || 0n;
                const totalIzin = BigInt(countIzin) * uangIzin;

                const gajiPokok = user.gaji_pokok || 0n;
                const tMakan = user.tunjangan_makan || 0n;
                const tTransport = user.tunjangan_transport || 0n;
                const tBpjsKes = user.tunjangan_bpjs_kesehatan || 0n;
                const tBpjsKet = user.tunjangan_bpjs_ketenagakerjaan || 0n;
                const pBpjsKes = user.potongan_bpjs_kesehatan || 0n;
                const pBpjsKet = user.potongan_bpjs_ketenagakerjaan || 0n;
                const pKoperasi = user.potongan_koperasi || 0n;
                const bPribadi = user.bonus_pribadi || 0n;
                const bTeam = user.bonus_team || 0n;
                const bJackpot = user.bonus_jackpot || 0n;
                const totalThr = user.thr || 0n;

                const bayarKasbon = (user.saldo_kasbon || 0n) / 2n;

                const totalPenjumlahan = gajiPokok
                    + totalReimbursementUang
                    + (tTransport * BigInt(hadir))
                    + (tMakan * BigInt(hadir))
                    + tBpjsKes + tBpjsKet
                    + totalLemburUang
                    + bPribadi + bTeam + bJackpot
                    + totalKehadiranBonus + totalThr;

                const totalPengurangan = pBpjsKes + pBpjsKet + totalMangkir + totalIzin + totalTerlambat + bayarKasbon + pKoperasi;
                const grandTotal = totalPenjumlahan - totalPengurangan;

                const payrollData = {
                    user_id: user.id,
                    tanggal_mulai: startDate,
                    tanggal_akhir: endDate,
                    bulan,
                    tahun: tahun.toString(),
                    persentase_kehadiran: `${persentaseKehadiran.toFixed(0)}%`,
                    no_gaji: noGaji,
                    gaji_pokok: gajiPokok,
                    total_reimbursement: totalReimbursementUang,
                    jumlah_tunjangan_transport: BigInt(hadir),
                    uang_tunjangan_transport: tTransport,
                    total_tunjangan_transport: tTransport * BigInt(hadir),
                    jumlah_tunjangan_makan: BigInt(hadir),
                    uang_tunjangan_makan: tMakan,
                    total_tunjangan_makan: tMakan * BigInt(hadir),
                    total_tunjangan_bpjs_kesehatan: tBpjsKes,
                    total_tunjangan_bpjs_ketenagakerjaan: tBpjsKet,
                    total_potongan_bpjs_kesehatan: pBpjsKes,
                    total_potongan_bpjs_ketenagakerjaan: pBpjsKet,
                    jumlah_mangkir: BigInt(totalAlfa),
                    uang_mangkir: uangMangkir,
                    total_mangkir: totalMangkir,
                    jumlah_lembur: jamLembur,
                    uang_lembur: user.lembur || 0n,
                    total_lembur: totalLemburUang,
                    jumlah_izin: BigInt(countIzin),
                    uang_izin: uangIzin,
                    total_izin: totalIzin,
                    bonus_pribadi: bPribadi,
                    bonus_team: bTeam,
                    bonus_jackpot: bJackpot,
                    jumlah_terlambat: totalMenitTelat, 
                    uang_terlambat: potonganPerMenit,
                    total_terlambat: totalTerlambat,
                    jumlah_kehadiran: jumlahKehadiranIndicator,
                    uang_kehadiran: user.kehadiran || 0n,
                    total_kehadiran: totalKehadiranBonus,
                    saldo_kasbon: user.saldo_kasbon || 0n,
                    bayar_kasbon: bayarKasbon,
                    jumlah_thr: totalThr > 0n ? 1n : 0n,
                    uang_thr: totalThr,
                    total_thr: totalThr,
                    loss: 0n,
                    total_penjumlahan: totalPenjumlahan,
                    total_pengurangan: totalPengurangan,
                    grand_total: grandTotal,
                    potongan_koperasi: pKoperasi,
                    created_at: new Date(),
                    updated_at: new Date()
                };

                const newPayroll = await tx.payrolls.create({ data: payrollData });

                // Update user's bonuses and kasbon balance
                await tx.users.update({
                    where: { id: user.id },
                    data: {
                        saldo_kasbon: (user.saldo_kasbon || 0n) - bayarKasbon,
                        bonus_pribadi: 0n,
                        bonus_team: 0n,
                        bonus_jackpot: 0n,
                    }
                });

                results.push(this.serialize(newPayroll));
            }

            return {
                success: true,
                message: `Berhasil men-generate ${results.length} data payroll baru`,
                data: results
            };
        }, {
            maxWait: 60000,
            timeout: 600000
        });
    }

    async generate(userId, bulan, tahun, tanggalMulai, tanggalAkhir) {
        if (!userId || userId === "undefined") throw new Error("User ID tidak valid");
        const user = await prisma.users.findUnique({
            where: { id: BigInt(userId) },
            include: { jabatan: true }
        });

        if (!user) throw new Error("User tidak ditemukan");

        const existing = await prisma.payrolls.findFirst({
            where: {
                user_id: user.id,
                bulan,
                tahun
            }
        });

        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const monthIndex = monthNames.indexOf(bulan);
        const startDate_ = tanggalMulai ? new Date(tanggalMulai) : new Date(parseInt(tahun), monthIndex, 1);
        const endDate_ = tanggalAkhir ? new Date(tanggalAkhir) : new Date(parseInt(tahun), monthIndex + 1, 0);

        // Fetch specific records for this user in the period
        const userMappingShifts = await prisma.mapping_shifts.findMany({
            where: {
                user_id: user.id,
                tanggal: {
                    gte: startDate_,
                    lte: endDate_
                }
            },
            include: { shifts: true }
        });

        const userLemburs = await prisma.lemburs.findMany({
            where: {
                user_id: user.id,
                status: 'Approved',
                tanggal: {
                    gte: startDate_.toISOString().split('T')[0],
                    lte: endDate_.toISOString().split('T')[0]
                }
            }
        });

        const userReimbursements = await prisma.reimbursements.findMany({
            where: {
                user_id: user.id,
                status: 'Approved',
                tanggal: {
                    gte: startDate_,
                    lte: endDate_
                }
            }
        });

        const userReimbursementItems = await prisma.reimbursements_items.findMany({
            where: {
                user_id: user.id
            }
        });

        const userKasbons = await prisma.kasbons.findMany({
            where: {
                user_id: user.id,
                status: 'Approved',
                tanggal: {
                    gte: startDate_,
                    lte: endDate_
                }
            }
        });

        const userCutis = await prisma.cutis.findMany({
            where: {
                user_id: user.id,
                status_cuti: 'Diterima',
                tanggal: {
                    gte: startDate_.toISOString().split('T')[0],
                    lte: endDate_.toISOString().split('T')[0]
                }
            }
        });

        let counter = await prisma.counters.findFirst({ where: { name: 'Gaji' } });
        if (!counter) {
            counter = await prisma.counters.create({ data: { name: 'Gaji', counter: 0, text: 'GJ' } });
        }

        let noGaji;
        if (existing) {
            noGaji = existing.no_gaji;
        } else {
            const updatedCounter = await prisma.counters.update({
                where: { id: counter.id },
                data: { counter: counter.counter + 1 }
            });
            const nextNumber = updatedCounter.counter.toString().padStart(6, '0');
            noGaji = `${updatedCounter.text || 'GJ'}/${nextNumber}`;
        }

        const jumlahHari = Math.floor((endDate_.getTime() - startDate_.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        // Attendance calculations
        const hadir = userMappingShifts.filter(m => ['Masuk', 'Pulang'].includes(m.status_absen)).length;
        const izinTelat = userMappingShifts.filter(m => m.status_absen === 'Izin Telat').length;
        const izinPulangCepat = userMappingShifts.filter(m => m.status_absen === 'Izin Pulang Cepat').length;
        const libur = userMappingShifts.filter(m => m.status_absen === 'Libur').length;
        const cuti = userMappingShifts.filter(m => m.status_absen === 'Cuti').length;
        const izinMasukMapping = userMappingShifts.filter(m => m.status_absen === 'Izin Masuk').length;
        const sakit = userMappingShifts.filter(m => m.status_absen === 'Sakit').length;

        const persentaseKehadiran = (jumlahHari > 0) ? 
            ((hadir + izinTelat + izinPulangCepat + libur) / jumlahHari) * 100 : 0;

        const totalAlfa = Math.max(0, jumlahHari - hadir - cuti - izinMasukMapping - libur - sakit);

        // Overtime
        const totalLemburDetik = userLemburs.reduce((acc, l) => acc + BigInt(l.total_lembur || 0), 0n);
        const jamLembur = totalLemburDetik / 3600n;
        const totalLemburUang = jamLembur * (user.lembur || 0n);

        // Reimbursement
        const sisaReimbursement = userReimbursements.reduce((acc, r) => acc + (r.sisa || 0n), 0n);
        const feeReimbursement = userReimbursementItems.reduce((acc, item) => acc + (item.fee || 0n), 0n);
        const totalReimbursementUang = sisaReimbursement + feeReimbursement;

        // Izin from cutis table
        const countIzin = userCutis.filter(c => c.nama_cuti === 'Izin Masuk').length;

        // Lateness
        let totalMenitTelat = 0n;
        const tolerance = user.batas_terlambat ? Number(user.batas_terlambat) : 0;
        const absensiService = (await import("./AbsensiService.js")).default;
        
        userMappingShifts.forEach(m => {
            let telatMins = 0;
            if (m.shifts && m.jam_absen && m.shifts.jam_masuk) {
                const diff = absensiService.timeToMinutes(m.jam_absen) - absensiService.timeToMinutes(m.shifts.jam_masuk);
                telatMins = diff > 0 ? diff : 0;
            } else if (m.telat) {
                telatMins = parseInt(m.telat);
            }

            if (telatMins > tolerance) {
                totalMenitTelat += BigInt(telatMins - tolerance);
            }
        });
        
        const potonganPerMenit = user.terlambat || 1000n;
        const totalTerlambat = totalMenitTelat * potonganPerMenit;

        // Presence Bonus (100% only)
        const jumlahKehadiranIndicator = (persentaseKehadiran === 100) ? 1n : 0n;
        const totalKehadiranBonus = jumlahKehadiranIndicator * (user.kehadiran || 0n);

        // Mangkir deduction
        const uangMangkir = user.mangkir || 0n;
        const totalMangkir = BigInt(totalAlfa) * uangMangkir;
        
        // Izin deduction
        const uangIzin = user.izin || 0n;
        const totalIzin = BigInt(countIzin) * uangIzin;

        // Basic fields
        const gajiPokok = user.gaji_pokok || 0n;
        const tMakan = user.tunjangan_makan || 0n;
        const tTransport = user.tunjangan_transport || 0n;
        const tBpjsKes = user.tunjangan_bpjs_kesehatan || 0n;
        const tBpjsKet = user.tunjangan_bpjs_ketenagakerjaan || 0n;
        const pBpjsKes = user.potongan_bpjs_kesehatan || 0n;
        const pBpjsKet = user.potongan_bpjs_ketenagakerjaan || 0n;
        const pKoperasi = user.potongan_koperasi || 0n;
        const bPribadi = user.bonus_pribadi || 0n;
        const bTeam = user.bonus_team || 0n;
        const bJackpot = user.bonus_jackpot || 0n;
        const totalThr = user.thr || 0n;

        // Kasbon
        const bayarKasbon = (user.saldo_kasbon || 0n) / 2n;

        const totalPenjumlahan = gajiPokok + totalReimbursementUang + (tTransport * BigInt(hadir)) + (tMakan * BigInt(hadir)) + tBpjsKes + tBpjsKet + totalLemburUang + bPribadi + bTeam + bJackpot + totalKehadiranBonus + totalThr;
        const totalPengurangan = pBpjsKes + pBpjsKet + totalMangkir + totalIzin + totalTerlambat + bayarKasbon + pKoperasi;
        const grandTotal = totalPenjumlahan - totalPengurangan;

        const payrollData = {
            user_id: user.id,
            tanggal_mulai: startDate_,
            tanggal_akhir: endDate_,
            bulan,
            tahun,
            persentase_kehadiran: `${persentaseKehadiran.toFixed(0)}%`,
            no_gaji: noGaji,
            gaji_pokok: gajiPokok,
            total_reimbursement: totalReimbursementUang,
            jumlah_tunjangan_transport: BigInt(hadir),
            uang_tunjangan_transport: tTransport,
            total_tunjangan_transport: tTransport * BigInt(hadir),
            jumlah_tunjangan_makan: BigInt(hadir),
            uang_tunjangan_makan: tMakan,
            total_tunjangan_makan: tMakan * BigInt(hadir),
            total_tunjangan_bpjs_kesehatan: tBpjsKes,
            total_tunjangan_bpjs_ketenagakerjaan: tBpjsKet,
            total_potongan_bpjs_kesehatan: pBpjsKes,
            total_potongan_bpjs_ketenagakerjaan: pBpjsKet,
            jumlah_mangkir: BigInt(totalAlfa),
            uang_mangkir: uangMangkir,
            total_mangkir: totalMangkir,
            jumlah_lembur: jamLembur,
            uang_lembur: user.lembur || 0n,
            total_lembur: totalLemburUang,
            jumlah_izin: BigInt(countIzin),
            uang_izin: uangIzin,
            total_izin: totalIzin,
            bonus_pribadi: bPribadi,
            bonus_team: bTeam,
            bonus_jackpot: bJackpot,
            jumlah_terlambat: totalMenitTelat,
            uang_terlambat: potonganPerMenit,
            total_terlambat: totalTerlambat,
            jumlah_kehadiran: jumlahKehadiranIndicator,
            uang_kehadiran: user.kehadiran || 0n,
            total_kehadiran: totalKehadiranBonus,
            saldo_kasbon: user.saldo_kasbon || 0n,
            bayar_kasbon: bayarKasbon,
            jumlah_thr: totalThr > 0n ? 1n : 0n,
            uang_thr: totalThr,
            total_thr: totalThr,
            loss: 0n,
            total_penjumlahan: totalPenjumlahan,
            total_pengurangan: totalPengurangan,
            grand_total: grandTotal,
            potongan_koperasi: pKoperasi,
            updated_at: new Date()
        };

        let newPayroll;
        if (existing) {
            newPayroll = await prisma.payrolls.update({
                where: { id: existing.id },
                data: payrollData
            });
        } else {
            newPayroll = await prisma.payrolls.create({
                data: {
                    ...payrollData,
                    created_at: new Date()
                }
            });
        }

        // Update user's bonuses and kasbon balance
        await prisma.users.update({
            where: { id: user.id },
            data: {
                saldo_kasbon: (user.saldo_kasbon || 0n) - bayarKasbon,
                bonus_pribadi: 0n,
                bonus_team: 0n,
                bonus_jackpot: 0n,
            }
        });

        const serialized = this.serialize(newPayroll);
        return {
            success: true,
            message: "Payroll berhasil di-generate",
            data: serialized
        };
    }

    async bulkImport(bulan, tahun, items) {
        if (!bulan) throw new Error("Bulan harus diisi");
        if (!tahun) throw new Error("Tahun harus diisi");
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("Data payroll kosong atau tidak valid");
        }

        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const monthIndex = monthNames.indexOf(bulan);
        if (monthIndex === -1) {
            throw new Error(`Bulan tidak valid: ${bulan}`);
        }

        const startDate = new Date(parseInt(tahun), monthIndex, 1);
        const endDate = new Date(parseInt(tahun), monthIndex + 1, 0);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error("Periode tanggal tidak valid");
        }

        return await prisma.$transaction(async (tx) => {
            // Get all active users (excluding admins)
            const users = await tx.users.findMany({
                where: {
                    OR: [
                        { is_admin: { notIn: ['admin', 'superadmin', 'super_admin', 'super admin'] } },
                        { is_admin: null }
                    ]
                },
                select: { id: true, name: true, saldo_kasbon: true }
            });

            // Map lowercase user name to user object
            const userMap = new Map();
            users.forEach(u => {
                userMap.set(u.name.toLowerCase().trim(), u);
            });

            // Pre-process items to match users and validate
            const validItems = [];
            const skippedItems = [];
            const matchedUserIds = [];
            for (const item of items) {
                const nameKey = String(item.nama_pegawai || '').toLowerCase().trim();
                if (!nameKey) continue;

                const user = userMap.get(nameKey);
                if (!user) {
                    // Skip baris yang tidak cocok (sudah divalidasi di frontend, tapi jaga-jaga)
                    console.warn(`[BulkImport] Skip: Pegawai "${item.nama_pegawai}" tidak ditemukan`);
                    skippedItems.push(item.nama_pegawai);
                    continue;
                }
                validItems.push({ item, user });
                matchedUserIds.push(user.id);
            }

            if (validItems.length === 0) {
                throw new Error(
                    skippedItems.length > 0
                        ? `Tidak ada data valid. Nama tidak cocok: ${skippedItems.slice(0, 5).join(', ')}${skippedItems.length > 5 ? ` dan ${skippedItems.length - 5} lainnya` : ''}`
                        : 'Tidak ada data valid untuk diimport'
                );
            }

            // Clear existing payroll for all matched users in a single query to prevent duplicates
            if (matchedUserIds.length > 0) {
                await tx.payrolls.deleteMany({
                    where: {
                        user_id: { in: matchedUserIds },
                        bulan: bulan,
                        tahun: tahun.toString()
                    }
                });
            }

            let counterRecord = await tx.counters.findFirst({ where: { name: 'Gaji' } });
            if (!counterRecord) {
                counterRecord = await tx.counters.create({ data: { name: 'Gaji', counter: 0, text: 'GJ' } });
            }

            // Optimize counters: update counter once
            const startCounter = BigInt(counterRecord.counter);
            const totalMatched = validItems.length;
            if (totalMatched > 0) {
                await tx.counters.update({
                    where: { id: counterRecord.id },
                    data: { counter: counterRecord.counter + totalMatched }
                });
            }

            const results = [];
            let loopIndex = 0n;

            for (const { item, user } of validItems) {
                const currentCounter = startCounter + loopIndex + 1n;
                const nextNumber = currentCounter.toString().padStart(6, '0');
                const noGaji = `${counterRecord.text || 'GJ'}/${nextNumber}`;
                loopIndex += 1n;

                // Parse and map numeric fields
                const gajiPokok = BigInt(Math.round(this.cleanNumeric(item.gaji_pokok) || 0));
                const totalReimbursement = BigInt(Math.round(this.cleanNumeric(item.total_reimbursement) || 0));
                const totalTunjanganTransport = BigInt(Math.round(this.cleanNumeric(item.total_tunjangan_transport) || 0));
                const totalTunjanganMakan = BigInt(Math.round(this.cleanNumeric(item.total_tunjangan_makan) || 0));
                const totalTunjanganBpjsKesehatan = BigInt(Math.round(this.cleanNumeric(item.total_tunjangan_bpjs_kesehatan) || 0));
                const totalTunjanganBpjsKetenagakerjaan = BigInt(Math.round(this.cleanNumeric(item.total_tunjangan_bpjs_ketenagakerjaan) || 0));
                const totalPotonganBpjsKesehatan = BigInt(Math.round(this.cleanNumeric(item.total_potongan_bpjs_kesehatan) || 0));
                const totalPotonganBpjsKetenagakerjaan = BigInt(Math.round(this.cleanNumeric(item.total_potongan_bpjs_ketenagakerjaan) || 0));
                
                const totalLembur = BigInt(Math.round(this.cleanNumeric(item.total_lembur) || 0));
                const bonusPribadi = BigInt(Math.round(this.cleanNumeric(item.bonus_pribadi) || 0));
                const bonusTeam = BigInt(Math.round(this.cleanNumeric(item.bonus_team) || 0));
                const bonusJackpot = BigInt(Math.round(this.cleanNumeric(item.bonus_jackpot) || 0));
                const totalKehadiran = BigInt(Math.round(this.cleanNumeric(item.total_kehadiran) || 0));
                const totalThr = BigInt(Math.round(this.cleanNumeric(item.total_thr) || 0));

                const totalTerlambat = BigInt(Math.round(this.cleanNumeric(item.total_terlambat) || 0));
                const totalMangkir = BigInt(Math.round(this.cleanNumeric(item.total_mangkir) || 0));
                const totalIzin = BigInt(Math.round(this.cleanNumeric(item.total_izin) || 0));
                const bayarKasbon = BigInt(Math.round(this.cleanNumeric(item.bayar_kasbon) || 0));
                const potonganKoperasi = BigInt(Math.round(this.cleanNumeric(item.potongan_koperasi) || 0));
                
                const insentifTetap = BigInt(Math.round(this.cleanNumeric(item.insentif_tetap) || 0));
                const jasaSip = BigInt(Math.round(this.cleanNumeric(item.jasa_sip) || 0));
                const obatBulanIni = BigInt(Math.round(this.cleanNumeric(item.obat_bulan_ini) || 0));

                const totalPenjumlahan = gajiPokok
                    + totalReimbursement
                    + totalTunjanganTransport
                    + totalTunjanganMakan
                    + totalTunjanganBpjsKesehatan
                    + totalTunjanganBpjsKetenagakerjaan
                    + totalLembur
                    + bonusPribadi
                    + bonusTeam
                    + bonusJackpot
                    + totalKehadiran
                    + totalThr
                    + insentifTetap
                    + jasaSip;

                const totalPengurangan = totalPotonganBpjsKesehatan
                    + totalPotonganBpjsKetenagakerjaan
                    + totalMangkir
                    + totalIzin
                    + totalTerlambat
                    + bayarKasbon
                    + potonganKoperasi
                    + obatBulanIni;

                const grandTotal = totalPenjumlahan > totalPengurangan
                    ? totalPenjumlahan - totalPengurangan
                    : 0n;

                const payrollData = {
                    user_id: user.id,
                    tanggal_mulai: startDate,
                    tanggal_akhir: endDate,
                    bulan,
                    tahun: tahun.toString(),
                    persentase_kehadiran: item.persentase_kehadiran || "100%",
                    no_gaji: noGaji,
                    gaji_pokok: gajiPokok,
                    total_reimbursement: totalReimbursement,
                    jumlah_tunjangan_transport: BigInt(Math.round(this.cleanNumeric(item.jumlah_tunjangan_transport) || 0)),
                    uang_tunjangan_transport: BigInt(Math.round(this.cleanNumeric(item.uang_tunjangan_transport) || 0)),
                    total_tunjangan_transport: totalTunjanganTransport,
                    jumlah_tunjangan_makan: BigInt(Math.round(this.cleanNumeric(item.jumlah_tunjangan_makan) || 0)),
                    uang_tunjangan_makan: BigInt(Math.round(this.cleanNumeric(item.uang_tunjangan_makan) || 0)),
                    total_tunjangan_makan: totalTunjanganMakan,
                    total_tunjangan_bpjs_kesehatan: totalTunjanganBpjsKesehatan,
                    total_tunjangan_bpjs_ketenagakerjaan: totalTunjanganBpjsKetenagakerjaan,
                    total_potongan_bpjs_kesehatan: totalPotonganBpjsKesehatan,
                    total_potongan_bpjs_ketenagakerjaan: totalPotonganBpjsKetenagakerjaan,
                    jumlah_mangkir: BigInt(Math.round(this.cleanNumeric(item.jumlah_mangkir) || 0)),
                    uang_mangkir: BigInt(Math.round(this.cleanNumeric(item.uang_mangkir) || 0)),
                    total_mangkir: totalMangkir,
                    jumlah_lembur: BigInt(Math.round(this.cleanNumeric(item.jumlah_lembur) || 0)),
                    uang_lembur: BigInt(Math.round(this.cleanNumeric(item.uang_lembur) || 0)),
                    total_lembur: totalLembur,
                    jumlah_izin: BigInt(Math.round(this.cleanNumeric(item.jumlah_izin) || 0)),
                    uang_izin: BigInt(Math.round(this.cleanNumeric(item.uang_izin) || 0)),
                    total_izin: totalIzin,
                    bonus_pribadi: bonusPribadi,
                    bonus_team: bonusTeam,
                    bonus_jackpot: bonusJackpot,
                    jumlah_terlambat: BigInt(Math.round(this.cleanNumeric(item.jumlah_terlambat) || 0)),
                    uang_terlambat: BigInt(Math.round(this.cleanNumeric(item.uang_terlambat) || 0)),
                    total_terlambat: totalTerlambat,
                    jumlah_kehadiran: BigInt(Math.round(this.cleanNumeric(item.jumlah_kehadiran) || 0)),
                    uang_kehadiran: BigInt(Math.round(this.cleanNumeric(item.uang_kehadiran) || 0)),
                    total_kehadiran: totalKehadiran,
                    saldo_kasbon: user.saldo_kasbon || 0n,
                    bayar_kasbon: bayarKasbon,
                    jumlah_thr: totalThr > 0n ? 1n : 0n,
                    uang_thr: totalThr,
                    total_thr: totalThr,
                    loss: BigInt(Math.round(this.cleanNumeric(item.loss) || 0)),
                    total_penjumlahan: totalPenjumlahan,
                    total_pengurangan: totalPengurangan,
                    grand_total: grandTotal,
                    potongan_koperasi: potonganKoperasi,
                    insentif_tetap: insentifTetap,
                    jasa_sip: jasaSip,
                    obat_bulan_ini: obatBulanIni,
                    created_at: new Date(),
                    updated_at: new Date()
                };

                const newPayroll = await tx.payrolls.create({ data: payrollData });

                // Update user's bonuses and kasbon balance - safe subtraction (explicit null check)
                const currentSaldo = user.saldo_kasbon || 0n;
                const newSaldo = currentSaldo > bayarKasbon ? currentSaldo - bayarKasbon : 0n;
                
                await tx.users.update({
                    where: { id: user.id },
                    data: {
                        saldo_kasbon: newSaldo,
                        bonus_pribadi: 0n,
                        bonus_team: 0n,
                        bonus_jackpot: 0n,
                    }
                });

                results.push(this.serialize(newPayroll));
            }

            const skippedCount = skippedItems.length;
            return {
                success: true,
                message: skippedCount > 0
                    ? `Berhasil meng-import ${results.length} data payroll (${skippedCount} dilewati karena nama tidak cocok)`
                    : `Berhasil meng-import ${results.length} data payroll`,
                data: results,
                skipped: skippedItems
            };
        }, {
            maxWait: 60000,
            timeout: 600000
        });
    }
}

export default new PayrollService();
