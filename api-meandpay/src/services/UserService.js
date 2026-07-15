import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import fileService from "./FileService.js";

class UserService {
    /**
     * Get all users with optional pagination & search
     */
    async getAll(query = {}, authUser = null) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 100;
        const search = query.search || "";
        const skip = (page - 1) * limit;

        const pegawaiKeluars = await prisma.pegawai_keluars.findMany({
            where: { status: 'APPROVED' },
            select: { user_id: true }
        });
        const excludedUserIds = pegawaiKeluars
            .map((pk) => pk.user_id)
            .filter((id) => id !== null && id !== undefined);

        let filterLokasiId = null;
        if (query.lokasi_id && query.lokasi_id !== "null" && query.lokasi_id !== "undefined") {
            try {
                filterLokasiId = BigInt(query.lokasi_id);
            } catch (e) {
                filterLokasiId = null;
            }
        }
        let filterJabatanId = null;
        let showEmptyJabatan = false;

        if (query.jabatan_id === "null" || query.jabatan_id === "kosong") {
            showEmptyJabatan = true;
        } else if (query.jabatan_id && query.jabatan_id !== "null" && query.jabatan_id !== "undefined") {
            try {
                filterJabatanId = BigInt(query.jabatan_id);
            } catch (e) {
                filterJabatanId = null;
            }
        }

        const andConditions = [
            { id: { notIn: [...excludedUserIds, 1n] } },
            {
                OR: [
                    { is_admin: { notIn: ['admin', 'superadmin', 'super_admin', 'super admin'] } },
                    { is_admin: null }
                ]
            }
        ];

        if (query.status_kerja === "pkwt") {
            andConditions.push({
                OR: [
                    {
                        AND: [
                            { no_pkwt: { not: null } },
                            { no_pkwt: { not: "" } }
                        ]
                    },
                    {
                        tanggal_berakhir_pkwt: { not: null }
                    }
                ]
            });
        } else if (query.status_kerja === "tetap") {
            andConditions.push({
                AND: [
                    {
                        OR: [
                            { no_pkwt: null },
                            { no_pkwt: "" }
                        ]
                    },
                    {
                        tanggal_berakhir_pkwt: null
                    }
                ]
            });
        }

        if (filterJabatanId) {
            andConditions.push({ jabatan_id: { in: [filterJabatanId, null] } });
        } else if (showEmptyJabatan) {
            andConditions.push({ jabatan_id: null });
        }

        if (filterLokasiId) {
            andConditions.push({ lokasi_id: filterLokasiId });
        }

        if (search) {
            andConditions.push({
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } },
                    { username: { contains: search } },
                    { telepon: { contains: search } },
                    { provinsi: { contains: search } },
                    { kota_kabupaten: { contains: search } },
                    { kecamatan: { contains: search } },
                    { kelurahan: { contains: search } },
                ]
            });
        }

        const where = { AND: andConditions };

        if (query.role) {
            const roleUsers = await prisma.model_has_roles.findMany({
                where: {
                    roles: {
                        name: query.role
                    }
                },
                select: { model_id: true }
            });
            const roleUserIds = roleUsers.map(ru => ru.model_id);
            if (where.id) {
                where.id = { ...where.id, in: roleUserIds };
            } else {
                where.id = { in: roleUserIds };
            }
        }

        const [data, total] = await Promise.all([
            prisma.users.findMany({
                where,
                skip,
                // take: limit,
                orderBy: { id: "desc" },
                include: { jabatan: true, lokasi: true, status_pajak: true },
            }),
            prisma.users.count({ where }),
        ]);

        const userIds = data.map((u) => u.id);
        const userRoles = await prisma.model_has_roles.findMany({
            where: { model_id: { in: userIds } },
            include: { roles: true },
        });

        const userWithFiles = await prisma.files.findMany({
            where: { user_id: { in: userIds } },
            select: { user_id: true },
        });
        const hasFilesSet = new Set(userWithFiles.map((f) => f.user_id.toString()));

        const cutiRecords = await prisma.cutis.findMany({
            where: { user_id: { in: userIds }, status_cuti: "Diterima" },
            select: { user_id: true, tanggal: true, nama_cuti: true },
        });
        const usedMap = {};
        for (const r of cutiRecords) {
            const uid = r.user_id;
            const label = (r.nama_cuti || "").toLowerCase();
            let type = "lainnya";
            if (label.includes("melahirkan")) type = "melahirkan";
            else if (label.includes("kematian") || label.includes("meninggal")) type = "kematian";
            else if (label.includes("tahunan") || (label.includes("cuti") && !label.includes("menikah"))) type = "cuti";
            else if (label.includes("telat") || label.includes("terlambat")) type = "telat";
            else if (label.includes("pulang")) type = "pulang_cepat";
            const t = r.tanggal || "";
            let amount = 1;
            if (["cuti", "melahirkan", "kematian"].includes(type)) {
                if (t.includes(" - ")) {
                    const [start, end] = t.split(" - ");
                    const s = new Date(start);
                    const e = new Date(end);
                    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
                    amount = diff > 0 ? diff : 0;
                } else if (!t) {
                    amount = 0;
                }
            }
            usedMap[uid] = usedMap[uid] || { cuti: 0, telat: 0, pulang_cepat: 0, melahirkan: 0, kematian: 0, lainnya: 0 };
            usedMap[uid][type] += amount;
        }

        const dataWithRoles = data.map((user) => {
            const roles = userRoles
                .filter((ur) => ur.model_id === user.id)
                .map((ur) => ur.roles.name);
            const sisaCuti = Number(user.izin_cuti || 0n);
            const sisaTelat = Number(user.izin_telat || 0n);
            const sisaPulangCepat = Number(user.izin_pulang_cepat || 0n);
            const sisaLainnya = Number(user.izin_lainnya || 0n);
            const sisaMelahirkan = Number(user.cuti_melahirkan || 0n);
            const sisaKematian = Number(user.cuti_kematian || 0n);
            const used = usedMap[user.id] || { cuti: 0, telat: 0, pulang_cepat: 0, melahirkan: 0, kematian: 0, lainnya: 0 };

            return {
                ...this.serialize(user),
                roles,
                has_dokumen: hasFilesSet.has(user.id.toString()),
                izin_cuti_total: String(sisaCuti + used.cuti),
                izin_cuti_terpakai: String(used.cuti),
                izin_cuti_sisa: String(sisaCuti),
                izin_telat_total: String(sisaTelat + used.telat),
                izin_telat_terpakai: String(used.telat),
                izin_telat_sisa: String(sisaTelat),
                izin_pulang_cepat_total: String(sisaPulangCepat + used.pulang_cepat),
                izin_pulang_cepat_terpakai: String(used.pulang_cepat),
                izin_pulang_cepat_sisa: String(sisaPulangCepat),
                izin_lainnya_total: String(sisaLainnya + used.lainnya),
                izin_lainnya_terpakai: String(used.lainnya),
                izin_lainnya_sisa: String(sisaLainnya),
                cuti_melahirkan_total: String(sisaMelahirkan + used.melahirkan),
                cuti_melahirkan_terpakai: String(used.melahirkan),
                cuti_melahirkan_sisa: String(sisaMelahirkan),
                cuti_kematian_total: String(sisaKematian + used.kematian),
                cuti_kematian_terpakai: String(used.kematian),
                cuti_kematian_sisa: String(sisaKematian),
            };
        });

        return {
            data: dataWithRoles,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get all users without pagination
     */
    async getAllNoPaginate(query = {}, authUser = null) {
        const search = query.search || "";

        const pegawaiKeluars = await prisma.pegawai_keluars.findMany({
            where: { status: 'APPROVED' },
            select: { user_id: true }
        });
        const keluarIdsSet = new Set(
            pegawaiKeluars
                .map((pk) => pk.user_id)
                .filter((id) => id !== null && id !== undefined)
                .map((id) => id.toString())
        );

        let filterLokasiId = null;
        if (query.lokasi_id && query.lokasi_id !== "null" && query.lokasi_id !== "undefined") {
            try {
                filterLokasiId = BigInt(query.lokasi_id);
            } catch (e) {
                filterLokasiId = null;
            }
        }
        let filterJabatanId = null;
        let showEmptyJabatan = false;

        if (query.jabatan_id === "null" || query.jabatan_id === "kosong") {
            showEmptyJabatan = true;
        } else if (query.jabatan_id && query.jabatan_id !== "null" && query.jabatan_id !== "undefined") {
            try {
                filterJabatanId = BigInt(query.jabatan_id);
            } catch (e) {
                filterJabatanId = null;
            }
        }

        const excludedUserIds = pegawaiKeluars
            .map((pk) => pk.user_id)
            .filter((id) => id !== null && id !== undefined);

        const andConditions = [
            { id: { notIn: [...excludedUserIds, 1n] } },
            {
                OR: [
                    { is_admin: { notIn: ['admin', 'superadmin', 'super_admin', 'super admin'] } },
                    { is_admin: null }
                ]
            }
        ];

        if (query.status_kerja === "pkwt") {
            andConditions.push({
                OR: [
                    {
                        AND: [
                            { no_pkwt: { not: null } },
                            { no_pkwt: { not: "" } }
                        ]
                    },
                    {
                        tanggal_berakhir_pkwt: { not: null }
                    }
                ]
            });
        } else if (query.status_kerja === "tetap") {
            andConditions.push({
                AND: [
                    {
                        OR: [
                            { no_pkwt: null },
                            { no_pkwt: "" }
                        ]
                    },
                    {
                        tanggal_berakhir_pkwt: null
                    }
                ]
            });
        }

        if (filterJabatanId) {
            andConditions.push({ jabatan_id: { in: [filterJabatanId, null] } });
        } else if (showEmptyJabatan) {
            andConditions.push({ jabatan_id: null });
        }

        if (filterLokasiId) {
            andConditions.push({ lokasi_id: filterLokasiId });
        }

        if (search) {
            andConditions.push({
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } },
                    { username: { contains: search } },
                    { telepon: { contains: search } },
                    { provinsi: { contains: search } },
                    { kota_kabupaten: { contains: search } },
                    { kecamatan: { contains: search } },
                    { kelurahan: { contains: search } },
                ]
            });
        }

        const where = { AND: andConditions };

        if (query.role) {
            const roleUsers = await prisma.model_has_roles.findMany({
                where: {
                    roles: {
                        name: query.role
                    }
                },
                select: { model_id: true }
            });
            const roleUserIds = roleUsers.map(ru => ru.model_id);
            if (where.id) {
                where.id = { ...where.id, in: roleUserIds };
            } else {
                where.id = { in: roleUserIds };
            }
        }


        const [data, total] = await Promise.all([
            prisma.users.findMany({
                where,
                orderBy: { name: "asc" },
                include: { jabatan: true, lokasi: true, status_pajak: true },
            }),
            prisma.users.count({ where }),
        ]);

        const userIds = data.map((u) => u.id);
        const userRoles = await prisma.model_has_roles.findMany({
            where: { model_id: { in: userIds } },
            include: { roles: true },
        });

        const userWithFiles = await prisma.files.findMany({
            where: { user_id: { in: userIds } },
            select: { user_id: true },
        });
        const hasFilesSet = new Set(userWithFiles.map((f) => f.user_id.toString()));

        const cutiRecords = await prisma.cutis.findMany({
            where: { user_id: { in: userIds }, status_cuti: "Diterima" },
            select: { user_id: true, tanggal: true, nama_cuti: true },
        });

        const usedMap = {};
        for (const r of cutiRecords) {
            const uid = r.user_id;
            const label = (r.nama_cuti || "").toLowerCase();
            let type = "lainnya";
            if (label.includes("melahirkan")) type = "melahirkan";
            else if (label.includes("kematian") || label.includes("meninggal")) type = "kematian";
            else if (label.includes("tahunan") || (label.includes("cuti") && !label.includes("menikah"))) type = "cuti";
            else if (label.includes("telat") || label.includes("terlambat")) type = "telat";
            else if (label.includes("pulang")) type = "pulang_cepat";
            const t = r.tanggal || "";
            let amount = 1;
            if (["cuti", "melahirkan", "kematian"].includes(type)) {
                if (t.includes(" - ")) {
                    const [start, end] = t.split(" - ");
                    const s = new Date(start);
                    const e = new Date(end);
                    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
                    amount = diff > 0 ? diff : 0;
                } else if (!t) {
                    amount = 0;
                }
            }
            usedMap[uid] = usedMap[uid] || { cuti: 0, telat: 0, pulang_cepat: 0, melahirkan: 0, kematian: 0, lainnya: 0 };
            usedMap[uid][type] += amount;
        }

        const dataWithRoles = data.map((user) => {
            const roles = userRoles
                .filter((ur) => ur.model_id === user.id)
                .map((ur) => ur.roles.name);

            const sisaCuti = Number(user.izin_cuti || 0n);
            const sisaTelat = Number(user.izin_telat || 0n);
            const sisaPulangCepat = Number(user.izin_pulang_cepat || 0n);
            const sisaLainnya = Number(user.izin_lainnya || 0n);
            const sisaMelahirkan = Number(user.cuti_melahirkan || 0n);
            const sisaKematian = Number(user.cuti_kematian || 0n);
            const used = usedMap[user.id] || { cuti: 0, telat: 0, pulang_cepat: 0, melahirkan: 0, kematian: 0, lainnya: 0 };

            return {
                ...this.serialize(user),
                roles,
                is_keluar: keluarIdsSet.has(user.id.toString()),
                has_dokumen: hasFilesSet.has(user.id.toString()),
                izin_cuti_total: String(sisaCuti + used.cuti),
                izin_cuti_terpakai: String(used.cuti),
                izin_cuti_sisa: String(sisaCuti),
                izin_telat_total: String(sisaTelat + used.telat),
                izin_telat_terpakai: String(used.telat),
                izin_telat_sisa: String(sisaTelat),
                izin_pulang_cepat_total: String(sisaPulangCepat + used.pulang_cepat),
                izin_pulang_cepat_terpakai: String(used.pulang_cepat),
                izin_pulang_cepat_sisa: String(sisaPulangCepat),
                izin_lainnya_total: String(sisaLainnya + used.lainnya),
                izin_lainnya_terpakai: String(used.lainnya),
                izin_lainnya_sisa: String(sisaLainnya),
                cuti_melahirkan_total: String(sisaMelahirkan + used.melahirkan),
                cuti_melahirkan_terpakai: String(used.melahirkan),
                cuti_melahirkan_sisa: String(sisaMelahirkan),
                cuti_kematian_total: String(sisaKematian + used.kematian),
                cuti_kematian_terpakai: String(used.kematian),
                cuti_kematian_sisa: String(sisaKematian),
            };
        });

        return {
            data: dataWithRoles,
            total: dataWithRoles.length,
        };
    }

    /**
     * Get all users who have face recognition data for attendance matching
     */
    async getAllForFaceRecognition() {
        const pegawaiKeluars = await prisma.pegawai_keluars.findMany({
            where: { status: 'APPROVED' },
            select: { user_id: true }
        });
        const excludedUserIds = pegawaiKeluars
            .map((pk) => pk.user_id)
            .filter((id) => id !== null && id !== undefined);

        const users = await prisma.users.findMany({
            where: {
                id: { notIn: [...excludedUserIds, 1n] },
                OR: [
                    { is_admin: { notIn: ['admin', 'superadmin', 'super_admin', 'super admin'] } },
                    { is_admin: null }
                ],
                AND: [
                    { foto_face_recognition: { not: null } },
                    { foto_face_recognition: { not: "" } },
                    { foto_face_recognition: { not: "null" } }
                ]
            },
            include: {
                lokasi: true,
                jabatan: true
            },
            orderBy: { name: "asc" }
        });

        return users.map(u => this.serialize(u));
    }

    /**
     * Get single user by ID
     */
    async getById(id, authUser = null) {
        const userId = BigInt(id);
        const authId = authUser ? BigInt(authUser.id) : null;

        const user = await prisma.users.findUnique({
            where: { id: userId },
            include: { jabatan: true, lokasi: true, status_pajak: true },
        });

        if (!user) return null;

        const userRoles = await prisma.model_has_roles.findMany({
            where: { model_id: BigInt(id) },
            include: { roles: true },
        });
        const roles = userRoles.map((ur) => ur.roles.name);

        const cutiList = await prisma.cutis.findMany({
            where: { user_id: BigInt(id), status_cuti: "Diterima" },
            select: { tanggal: true, nama_cuti: true },
        });
        let used = { cuti: 0, telat: 0, pulang_cepat: 0, melahirkan: 0, kematian: 0, lainnya: 0 };
        for (const r of cutiList) {
            const label = (r.nama_cuti || "").toLowerCase();
            let type = "lainnya";
            if (label.includes("melahirkan")) type = "melahirkan";
            else if (label.includes("kematian") || label.includes("meninggal")) type = "kematian";
            else if (label.includes("tahunan") || (label.includes("cuti") && !label.includes("menikah"))) type = "cuti";
            else if (label.includes("telat") || label.includes("terlambat")) type = "telat";
            else if (label.includes("pulang")) type = "pulang_cepat";
            const t = r.tanggal || "";
            let amount = 1;
            if (["cuti", "melahirkan", "kematian"].includes(type)) {
                if (t.includes(" - ")) {
                    const [start, end] = t.split(" - ");
                    const s = new Date(start);
                    const e = new Date(end);
                    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
                    amount = diff > 0 ? diff : 0;
                } else if (!t) {
                    amount = 0;
                }
            }
            used[type] += amount;
        }
        const sisaCuti = Number(user.izin_cuti || 0n);
        const sisaTelat = Number(user.izin_telat || 0n);
        const sisaPulangCepat = Number(user.izin_pulang_cepat || 0n);
        const sisaLainnya = Number(user.izin_lainnya || 0n);
        const sisaMelahirkan = Number(user.cuti_melahirkan || 0n);
        const sisaKematian = Number(user.cuti_kematian || 0n);

        const files = await prisma.files.findMany({
            where: { user_id: BigInt(id) },
        });

        return {
            ...this.serialize(user),
            roles,
            files: files.map(f => fileService.serialize(f)),
            izin_cuti_total: String(sisaCuti + used.cuti),
            izin_cuti_terpakai: String(used.cuti),
            izin_cuti_sisa: String(sisaCuti),
            izin_telat_total: String(sisaTelat + used.telat),
            izin_telat_terpakai: String(used.telat),
            izin_telat_sisa: String(sisaTelat),
            izin_pulang_cepat_total: String(sisaPulangCepat + used.pulang_cepat),
            izin_pulang_cepat_terpakai: String(used.pulang_cepat),
            izin_pulang_cepat_sisa: String(sisaPulangCepat),
            izin_lainnya_total: String(sisaLainnya + used.lainnya),
            izin_lainnya_terpakai: String(used.lainnya),
            izin_lainnya_sisa: String(sisaLainnya),
            cuti_melahirkan_total: String(sisaMelahirkan + used.melahirkan),
            cuti_melahirkan_terpakai: String(used.melahirkan),
            cuti_melahirkan_sisa: String(sisaMelahirkan),
            cuti_kematian_total: String(sisaKematian + used.kematian),
            cuti_kematian_terpakai: String(used.kematian),
            cuti_kematian_sisa: String(sisaKematian),
        };
    }

    /**
     * Create a new user
     */
    /**
  * Create a new user
  */
    async create(data) {
        // Pisahkan roles dari data user (sama seperti di update)
        const { roles, role, jabatan, lokasi, status_pajak, ...userData } = data;
        const effectiveRoles = roles || role;

        // Mapping name to IDs if provided (useful for import)
        if (data.jabatan_name && !userData.jabatan_id) {
            const jab = await prisma.jabatans.findFirst({ where: { nama_jabatan: data.jabatan_name } });
            if (jab) userData.jabatan_id = jab.id;
        }
        if (data.lokasi_name && !userData.lokasi_id) {
            const lok = await prisma.lokasis.findFirst({ where: { nama_lokasi: data.lokasi_name } });
            if (lok) userData.lokasi_id = lok.id;
        }
        if (data.status_pajak_name && !userData.status_pajak_id) {
            const stp = await prisma.status_pajaks.findFirst({ where: { name: data.status_pajak_name } });
            if (stp) userData.status_pajak_id = stp.id;
        }

        // Cek apakah user sudah ada berdasarkan email atau username
        const conditions = [];
        if (userData.email) conditions.push({ email: userData.email });
        if (userData.username) conditions.push({ username: userData.username });

        if (conditions.length > 0) {
            const existingUser = await prisma.users.findFirst({
                where: {
                    OR: conditions
                }
            });

            if (existingUser) {
                // Jika data ditemukan, lakukan update
                return this.update(existingUser.id.toString(), data);
            }
        }

        // Hash password jika ada
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }

        const user = await prisma.users.create({
            data: this.sanitizeInput(userData),
        });

        // Assign roles jika dikirim
        let roleList = [];
        if (effectiveRoles) {
            if (typeof effectiveRoles === "string") {
                try { roleList = JSON.parse(effectiveRoles); } // jika berupa '["admin"]'
                catch { roleList = effectiveRoles.split(",").map(r => r.trim()); } // jika berupa "admin,user"
            } else if (Array.isArray(effectiveRoles)) {
                roleList = effectiveRoles;
            }
        }

        if (roleList.length > 0) {
            const roleRecords = await prisma.roles.findMany({
                where: { name: { in: roleList } },
            });

            if (roleRecords.length > 0) {
                await prisma.model_has_roles.createMany({
                    data: roleRecords.map((role) => ({
                        role_id: role.id,
                        model_type: "App\\Models\\User",
                        model_id: user.id,
                    })),
                });
            }
        }

        // Return data lengkap dengan roles
        return this.getById(user.id.toString());
    }

    /**
     * Update user by ID
     */
    async update(id, data, authUser = null) {
        const userId = BigInt(id);
        const authId = authUser ? BigInt(authUser.id) : null;

        const existing = await prisma.users.findUnique({
            where: { id: userId },
        });
        if (!existing) return null;

        // Pisahkan roles dari data, sisa data masuk ke sanitizeInput
        const { roles, role, jabatan, lokasi, status_pajak, ...userData } = data;
        const effectiveRoles = roles || role;

        // Mapping name to IDs if provided (useful for import)
        if (data.jabatan_name && !userData.jabatan_id) {
            const jab = await prisma.jabatans.findFirst({ where: { nama_jabatan: data.jabatan_name } });
            if (jab) userData.jabatan_id = jab.id;
        }
        if (data.lokasi_name && !userData.lokasi_id) {
            const lok = await prisma.lokasis.findFirst({ where: { nama_lokasi: data.lokasi_name } });
            if (lok) userData.lokasi_id = lok.id;
        }
        if (data.status_pajak_name && !userData.status_pajak_id) {
            const stp = await prisma.status_pajaks.findFirst({ where: { name: data.status_pajak_name } });
            if (stp) userData.status_pajak_id = stp.id;
        }

        // Hash password jika ada
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }

        const user = await prisma.users.update({
            where: { id: BigInt(id) },
            data: this.sanitizeInput(userData),
        });

        // Sync roles jika dikirim
        let roleList = [];
        if (effectiveRoles) {
            if (typeof effectiveRoles === "string") {
                try { roleList = JSON.parse(effectiveRoles); } // jika berupa '["admin"]'
                catch { roleList = effectiveRoles.split(",").map(r => r.trim()); } // jika berupa "admin,user"
            } else if (Array.isArray(effectiveRoles)) {
                roleList = effectiveRoles;
            }
        }

        if (roleList.length > 0 || effectiveRoles !== undefined) {
            // Hapus roles lama
            await prisma.model_has_roles.deleteMany({
                where: { model_id: BigInt(id) },
            });

            if (roleList.length > 0) {
                // Cari role_id berdasarkan nama
                const roleRecords = await prisma.roles.findMany({
                    where: { name: { in: roleList } },
                });

                // Insert roles baru
                if (roleRecords.length > 0) {
                    await prisma.model_has_roles.createMany({
                        data: roleRecords.map((role) => ({
                            role_id: role.id,
                            model_type: "App\\Models\\User",
                            model_id: BigInt(id),
                        })),
                    });
                }
            }
        }

        // Return data lengkap dengan roles
        return this.getById(id);
    }

    async updateFaceRecognition(id, photoPath, authUser = null) {
        // No special admin check
        const user = await prisma.users.update({
            where: { id: BigInt(id) },
            data: { foto_face_recognition: photoPath },
        });
        return this.serialize(user);
    }

    async delete(id, authUser = null) {
        const userId = BigInt(id);
        const existing = await prisma.users.findUnique({
            where: { id: userId },
        });
        if (!existing) return null;
        return await prisma.$transaction(async (tx) => {
            const existingResignation = await tx.pegawai_keluars.findFirst({
                where: { user_id: userId }
            });

            if (!existingResignation) {
                await tx.pegawai_keluars.create({
                    data: {
                        user_id: userId,
                        tanggal: new Date(),
                        jenis: 'Pemutusan Hubungan Kerja (PHK)',
                        alasan: 'Dihapus oleh admin dari daftar pegawai',
                        approved_by: authUser ? BigInt(authUser.id) : null,
                        tanggal_approval: new Date(),
                        status: 'APPROVED',
                        notes: 'Dipindahkan secara otomatis saat dihapus dari menu pegawai'
                    }
                });
            } else {
                await tx.pegawai_keluars.update({
                    where: { id: existingResignation.id },
                    data: {
                        status: 'APPROVED',
                        tanggal_approval: new Date(),
                        approved_by: authUser ? BigInt(authUser.id) : null,
                        notes: 'Diaktifkan status keluar saat dihapus dari menu pegawai'
                    }
                });
            }

            await tx.kontraks.updateMany({
                where: { user_id: userId },
                data: {
                    tanggal_selesai: new Date(),
                    keterangan: "TERMINATED",
                },
            });

            return true;
        });
    }

    /**
     * Delete multiple users by IDs
     */
    async bulkDelete(ids, authUser = null) {
        if (!Array.isArray(ids) || ids.length === 0) return false;

        let targetIds = ids.map(id => BigInt(id));

        if (targetIds.length === 0) return false;

        return await prisma.$transaction(async (tx) => {
            for (const userId of targetIds) {
                const existingResignation = await tx.pegawai_keluars.findFirst({
                    where: { user_id: userId }
                });

                if (!existingResignation) {
                    await tx.pegawai_keluars.create({
                        data: {
                            user_id: userId,
                            tanggal: new Date(),
                            jenis: 'Pemutusan Hubungan Kerja (PHK)',
                            alasan: 'Dihapus oleh admin dari daftar pegawai',
                            approved_by: authUser ? BigInt(authUser.id) : null,
                            tanggal_approval: new Date(),
                            status: 'APPROVED',
                            notes: 'Dipindahkan secara otomatis saat dihapus dari menu pegawai secara massal'
                        }
                    });
                } else {
                    await tx.pegawai_keluars.update({
                        where: { id: existingResignation.id },
                        data: {
                            status: 'APPROVED',
                            tanggal_approval: new Date(),
                            approved_by: authUser ? BigInt(authUser.id) : null,
                            notes: 'Diaktifkan status keluar saat dihapus secara massal'
                        }
                    });
                }

                await tx.kontraks.updateMany({
                    where: { user_id: userId },
                    data: {
                        tanggal_selesai: new Date(),
                        keterangan: "TERMINATED",
                    },
                });
            }

            return true;
        });
    }

    sanitizeInput(data) {
        const allowedFields = [
            "name",
            "foto_karyawan",
            "foto_face_recognition",
            "email",
            "telepon",
            "username",
            "password",
            "tgl_lahir",
            "gender",
            "tgl_join",
            "alamat",
            "izin_cuti",
            "izin_lainnya",
            "izin_telat",
            "izin_pulang_cepat",
            "is_admin",
            "masa_berlaku",
            "status_pajak_id",
            "jabatan_id",
            "lokasi_id",
            "ktp",
            "kartu_keluarga",
            "bpjs_kesehatan",
            "bpjs_ketenagakerjaan",
            "npwp",
            "sim",
            "no_pkwt",
            "no_kontrak",
            "tanggal_mulai_pkwt",
            "tanggal_berakhir_pkwt",
            "rekening",
            "nama_rekening",
            "gaji_pokok",
            "tunjangan_makan",
            "tunjangan_transport",
            "tunjangan_bpjs_kesehatan",
            "tunjangan_bpjs_ketenagakerjaan",
            "lembur",
            "kehadiran",
            "thr",
            "bonus_pribadi",
            "bonus_team",
            "bonus_jackpot",
            "izin",
            "terlambat",
            "mangkir",
            "saldo_kasbon",
            "potongan_bpjs_kesehatan",
            "potongan_bpjs_ketenagakerjaan",
            "email_verified_at",
            "remember_token",
            "darurat_nama",
            "darurat_telepon",
            "darurat_hubungan",
            "batas_terlambat",
            "potongan_koperasi",
            "provinsi",
            "kota_kabupaten",
            "kecamatan",
            "kelurahan",
            "lock_face",
            "cuti_melahirkan",
            "cuti_kematian",
            "kode_pos",
            "provinsi_domisili",
            "kota_kabupaten_domisili",
            "kecamatan_domisili",
            "kelurahan_domisili",
            "alamat_domisili",
            "kode_pos_domisili",
            "nama_ibu_kandung",
        ];

        const bigIntFields = [
            "izin_cuti",
            "izin_lainnya",
            "izin_telat",
            "izin_pulang_cepat",
            "status_pajak_id",
            "jabatan_id",
            "lokasi_id",
            "gaji_pokok",
            "tunjangan_makan",
            "tunjangan_transport",
            "tunjangan_bpjs_kesehatan",
            "tunjangan_bpjs_ketenagakerjaan",
            "lembur",
            "kehadiran",
            "thr",
            "bonus_pribadi",
            "bonus_team",
            "bonus_jackpot",
            "izin",
            "terlambat",
            "mangkir",
            "saldo_kasbon",
            "potongan_bpjs_kesehatan",
            "potongan_bpjs_ketenagakerjaan",
            "batas_terlambat",
            "potongan_koperasi",
            "cuti_melahirkan",
            "cuti_kematian",
        ];

        const dateFields = [
            "masa_berlaku",
            "tanggal_mulai_pkwt",
            "tanggal_berakhir_pkwt",
            "email_verified_at",
        ];

        const sanitized = {};

        for (const [key, value] of Object.entries(data)) {
            if (value === undefined) continue;
            if (!allowedFields.includes(key)) continue;

            if (bigIntFields.includes(key)) {
                // Handle null, undefined, empty string, and "null" string
                if (value === null || value === undefined || value === "null") {
                    sanitized[key] = null;
                } else if (value === "") {
                    // Skip empty strings for BigInt fields to let defaults/current values work
                    continue;
                } else {
                    try {
                        sanitized[key] = BigInt(value);
                    } catch (e) {
                        console.warn(`Failed to convert ${key} with value ${value} to BigInt:`, e.message);
                        sanitized[key] = null;
                    }
                }
            } else if (dateFields.includes(key)) {
                sanitized[key] = value !== null && value !== undefined && value !== "" && value !== "null" ? new Date(value) : null;
            } else if (["tgl_lahir", "tgl_join"].includes(key)) {
                if (value !== null && value !== undefined && value !== "" && value !== "null") {
                    const d = new Date(value);
                    if (!isNaN(d.getTime())) {
                        sanitized[key] = d.toISOString().split('T')[0];
                    } else {
                        sanitized[key] = value;
                    }
                } else {
                    sanitized[key] = null;
                }
            } else {
                sanitized[key] = value === "null" ? null : value;
            }
        }

        return sanitized;
    }

    /**
     * Serialize a single user — convert BigInt to string for JSON
     */
    serialize(user) {
        const serialized = {};
        for (const [key, value] of Object.entries(user)) {
            if (typeof value === "bigint") {
                serialized[key] = value.toString();
            } else if (value !== null && typeof value === "object" && !(value instanceof Date)) {
                // Handle nested relation objects (e.g. jabatan)
                const nested = {};
                for (const [k, v] of Object.entries(value)) {
                    nested[k] = typeof v === "bigint" ? v.toString() : v;
                }
                serialized[key] = nested;
            } else {
                serialized[key] = value;
            }
        }
        if (!serialized.foto_karyawan && serialized.foto_face_recognition) {
            serialized.foto_karyawan = serialized.foto_face_recognition;
        }
        return serialized;
    }

    /**
     * Serialize a list of users
     */
    serializeList(users) {
        return users.map((user) => this.serialize(user));
    }
}

export default new UserService();
