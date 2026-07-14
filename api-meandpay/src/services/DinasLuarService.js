import prisma from "../config/prisma.js";
import { saveBase64Image } from "../middleware/uploadMiddleware.js";

class DinasLuarService {
    async getAll(query = {}) {
        const search = query.search || "";
        const where = search ? { OR: [{ status_absen: { contains: search } }, { tanggal: { contains: search } }] } : {};
        const data = await prisma.dinas_luars.findMany({
            where,
            orderBy: { id: "desc" }
        });

        // Manually fetch and attach user and shift data since schema is locked
        const userIds = data.map(d => d.user_id).filter(id => id);
        const shiftIds = data.map(d => d.shift_id).filter(id => id);

        if (userIds.length > 0) {
            const users = await prisma.users.findMany({
                where: { id: { in: userIds } },
                select: { id: true, name: true }
            });
            const userMap = users.reduce((acc, u) => {
                acc[u.id.toString()] = u;
                return acc;
            }, {});

            data.forEach(d => {
                if (d.user_id && userMap[d.user_id.toString()]) {
                    d.users = userMap[d.user_id.toString()];
                }
            });
        }

        if (shiftIds.length > 0) {
            const shifts = await prisma.shifts.findMany({
                where: { id: { in: shiftIds } }
            });
            const shiftMap = shifts.reduce((acc, s) => {
                acc[s.id.toString()] = s;
                return acc;
            }, {});

            data.forEach(d => {
                if (d.shift_id && shiftMap[d.shift_id.toString()]) {
                    d.shifts = shiftMap[d.shift_id.toString()];
                }
            });
        }

        return { data: this.serializeList(data) };
    }

    async getById(id) {
        const record = await prisma.dinas_luars.findUnique({ where: { id: BigInt(id) } });
        if (!record) return null;

        if (record.user_id) {
            const user = await prisma.users.findUnique({
                where: { id: record.user_id },
                select: { id: true, name: true }
            });
            if (user) record.users = user;
        }

        if (record.shift_id) {
            const shift = await prisma.shifts.findUnique({
                where: { id: record.shift_id }
            });
            if (shift) record.shifts = shift;
        }

        return this.serialize(record);
    }

    async getByUserId(id) {
        const record = await prisma.dinas_luars.findMany({ where: { user_id: BigInt(id) } });
        if (!record) return null;

        if (record.user_id) {
            const user = await prisma.users.findUnique({
                where: { id: record.user_id },
                select: { id: true, name: true }
            });
            if (user) record.users = user;
        }

        if (record.shift_id) {
            const shift = await prisma.shifts.findUnique({
                where: { id: record.shift_id }
            });
            if (shift) record.shifts = shift;
        }

        return this.serialize(record);
    }   

    async create(data) {
        const payload = { ...data };
        if (payload.user_id !== undefined) payload.user_id = BigInt(payload.user_id);

        let shiftToUse = payload.shift_id ? BigInt(payload.shift_id) : null;

        // Try to auto-resolve shift_id if missing, use today's mapping_shifts or default
        if (!shiftToUse && payload.user_id) {
            const todayStr = payload.tanggal || new Date().toISOString().split('T')[0];
            const mapping = await prisma.mapping_shifts.findFirst({
                where: { 
                    user_id: payload.user_id,
                    tanggal: {
                        gte: new Date(todayStr),
                        lt: new Date(new Date(todayStr).getTime() + 24 * 60 * 60 * 1000)
                    }
                }
            });
            if (mapping && mapping.shift_id) {
                shiftToUse = mapping.shift_id;
            } else {
                shiftToUse = BigInt(1); // Default safe fallback
            }
        }
        if (shiftToUse) payload.shift_id = shiftToUse;

        // Menerjemahkan isian aplikasi mobile ke skema database
        if (payload.jam && !payload.jam_absen) payload.jam_absen = payload.jam;
        if (payload.lat && !payload.lat_absen) payload.lat_absen = payload.lat;
        if (payload.long && !payload.long_absen) payload.long_absen = payload.long;
        if (!payload.status_absen) payload.status_absen = "DINAS LUAR"; // Status default jika create

        // Hapus field yang tidak ada di Prisma (menghindari error Unknown argument)
        if (payload._method) delete payload._method;
        if (payload["{}"]) delete payload["{}"];
        if (payload.keterangan) delete payload.keterangan;
        if (payload.tujuan) delete payload.tujuan;
        if (payload.jam) delete payload.jam;
        if (payload.lat) delete payload.lat;
        if (payload.long) delete payload.long;

        // Try converting base64 format picture inside foto_jam_absen and foto_jam_pulang 
        if (payload.foto_jam_absen && payload.foto_jam_absen.startsWith("data:image")) {
            payload.foto_jam_absen = saveBase64Image(payload.foto_jam_absen, "dinasluar", "dl-masuk");
        }
        if (payload.foto_jam_pulang && payload.foto_jam_pulang.startsWith("data:image")) {
            payload.foto_jam_pulang = saveBase64Image(payload.foto_jam_pulang, "dinasluar", "dl-pulang");
        }

        const record = await prisma.dinas_luars.create({ data: payload });
        return this.serialize(record);
    }

    async update(id, data = {}) {
        const existing = await prisma.dinas_luars.findUnique({ where: { id: BigInt(id) } });
        if (!existing) return null;

        const updateData = {};
        const payload = data || {};
        for (const [key, value] of Object.entries(payload)) {
            // Filter invalid keys if there's any JSON empty brace issue or _method spoofing
            if (key === "{}" || key === "_method" || key === "keterangan") continue;

            if (["user_id", "shift_id"].includes(key)) {
                updateData[key] = value ? BigInt(value) : null;
            } else if (key === 'foto_jam_absen' && value && value.startsWith("data:image")) {
                updateData[key] = saveBase64Image(value, "dinasluar", "dl-masuk");
            } else if (key === 'foto_jam_pulang' && value && value.startsWith("data:image")) {
                updateData[key] = saveBase64Image(value, "dinasluar", "dl-pulang");
            } else {
                updateData[key] = value;
            }
        }

        const record = await prisma.dinas_luars.update({ where: { id: BigInt(id) }, data: updateData });
        return this.serialize(record);
    }

    async delete(id) {
        const existing = await prisma.dinas_luars.findUnique({ where: { id: BigInt(id) } });
        if (!existing) return null;
        await prisma.dinas_luars.delete({ where: { id: BigInt(id) } });
        return true;
    }

    serialize(record) {
        // Return structured format expected by Custom/Frontend
        const baseUrl = process.env.BASE_URL || 'http://localhost:4000';

        const serialized = {};
        for (const [key, value] of Object.entries(record)) {
            if (key === "users" || key === "shifts") continue;
            if (typeof value === "bigint") {
                serialized[key] = value.toString();
            } else if (key === 'foto_jam_absen' && value) {
                serialized[key] = value.startsWith('http') ? value : (value.startsWith('/') ? `${baseUrl}${value}` : `${baseUrl}/${value}`);
            } else if (key === 'foto_jam_pulang' && value) {
                serialized[key] = value.startsWith('http') ? value : (value.startsWith('/') ? `${baseUrl}${value}` : `${baseUrl}/${value}`);
            } else {
                serialized[key] = value;
            }
        }

        // Re-attach specific mapped relations if manually joined
        if (record.users) {
            serialized.name = record.users.name;
            const formattedUser = {};
            for (const [uKey, uValue] of Object.entries(record.users)) {
                formattedUser[uKey] = typeof uValue === "bigint" ? uValue.toString() : (uValue instanceof Date ? uValue.toISOString() : uValue);
            }
            serialized.users = formattedUser;
        } else {
            serialized.name = "Unknown";
        }

        if (record.shifts) {
            const formattedShift = {};
            for (const [sKey, sValue] of Object.entries(record.shifts)) {
                formattedShift[sKey] = typeof sValue === "bigint" ? sValue.toString() : (sValue instanceof Date ? sValue.toISOString() : sValue);
            }
            serialized.shifts = formattedShift;
        }

        return serialized;
    }

    async bulkCreateRange(data) {
        const { user_id, shift_id, start_date, end_date } = data;
        const start = new Date(start_date);
        const end = new Date(end_date);
        const createdRecords = [];

        let current = new Date(start);
        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];

            const record = await prisma.dinas_luars.create({
                data: {
                    user_id: BigInt(user_id),
                    shift_id: BigInt(shift_id),
                    tanggal: dateStr,
                    status_absen: "DINAS LUAR"
                }
            });

            createdRecords.push(this.serialize(record));
            current.setDate(current.getDate() + 1);
        }

        return { data: createdRecords };
    }

    async bulkUpdateRange(data) {
        const { user_id, start_date, end_date, shift_id } = data;

        // Update all records for this user within the date range
        const result = await prisma.dinas_luars.updateMany({
            where: {
                user_id: BigInt(user_id),
                tanggal: {
                    gte: start_date,
                    lte: end_date
                }
            },
            data: {
                shift_id: BigInt(shift_id)
            }
        });

        return { count: result.count };
    }

    async bulkDeleteRange(data) {
        const { user_id, start_date, end_date } = data;

        const result = await prisma.dinas_luars.deleteMany({
            where: {
                user_id: BigInt(user_id),
                tanggal: {
                    gte: start_date,
                    lte: end_date
                }
            }
        });

        return { count: result.count };
    }

    serializeList(items) {
        return items.map((i) => this.serialize(i));
    }
}

export default new DinasLuarService();
