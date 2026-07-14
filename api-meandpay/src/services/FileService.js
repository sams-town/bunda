import prisma from "../config/prisma.js";
import fs from "fs";
import path from "path";

class FileService {
    async getAll(query = {}) {
        const where = {};
        if (query.user_id) where.user_id = BigInt(query.user_id);
        if (query.search) {
            where.OR = [
                { jenis_file: { contains: query.search } },
                { fileUpload: { contains: query.search } }
            ];
        }

        const data = await prisma.files.findMany({
            where,
            orderBy: { id: "desc" }
        });

        const enrichedData = await Promise.all(data.map(async (item) => {
            const enriched = this.serialize(item);
            if (item.user_id) {
                const user = await prisma.users.findUnique({
                    where: { id: item.user_id },
                    select: { id: true, name: true }
                });
                enriched.users = user ? { ...user, id: user.id.toString() } : null;
            } else {
                enriched.users = null;
            }
            return enriched;
        }));

        return { data: enrichedData };
    }

    async create(data, file) {
        const payload = {
            jenis_file: data.nama_dokumen,
            user_id: data.user_id ? BigInt(data.user_id) : null,
            fileUpload: file ? `dokumen_pegawai/${file.filename}` : null,
            created_at: new Date()
        };

        const record = await prisma.files.create({ data: payload });
        return this.getById(record.id);
    }

    async update(id, data, file) {
        const payload = {};
        if (data.nama_dokumen) payload.jenis_file = data.nama_dokumen;
        if (data.user_id) payload.user_id = BigInt(data.user_id);

        if (file) {
            payload.fileUpload = `dokumen_pegawai/${file.filename}`;
            const oldRecord = await prisma.files.findUnique({ where: { id: BigInt(id) } });
            if (oldRecord?.fileUpload) {
                let filePath = path.join(process.cwd(), "public", "uploads", oldRecord.fileUpload);
                if (!fs.existsSync(filePath)) {
                    filePath = path.join(process.cwd(), "public", oldRecord.fileUpload);
                }
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        const record = await prisma.files.update({
            where: { id: BigInt(id) },
            data: payload
        });
        return this.getById(record.id);
    }

    async getById(id) {
        const item = await prisma.files.findUnique({
            where: { id: BigInt(id) }
        });
        if (!item) return null;

        const enriched = this.serialize(item);
        if (item.user_id) {
            const user = await prisma.users.findUnique({
                where: { id: item.user_id },
                select: { id: true, name: true }
            });
            enriched.users = user ? { ...user, id: user.id.toString() } : null;
        } else {
            enriched.users = null;
        }
        return enriched;
    }

    async delete(id) {
        const record = await prisma.files.findUnique({ where: { id: BigInt(id) } });
        if (!record) return null;

        if (record.fileUpload) {
            let filePath = path.join(process.cwd(), "public", "uploads", record.fileUpload);
            if (!fs.existsSync(filePath)) {
                filePath = path.join(process.cwd(), "public", record.fileUpload);
            }
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await prisma.files.delete({ where: { id: BigInt(id) } });
        return true;
    }

    serialize(obj) {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === "bigint") return obj.toString();
        if (obj instanceof Date) return obj.toISOString();
        if (Array.isArray(obj)) return obj.map((item) => this.serialize(item));
        if (typeof obj === "object") {
            const serialized = {};
            for (const [key, value] of Object.entries(obj)) {
                serialized[key] = this.serialize(value);
            }
            if (serialized.fileUpload) {
                try {
                    let filePath = path.join(process.cwd(), "public", "uploads", serialized.fileUpload);
                    if (!fs.existsSync(filePath)) {
                        filePath = path.join(process.cwd(), "public", serialized.fileUpload);
                    }
                    if (fs.existsSync(filePath)) {
                        const stats = fs.statSync(filePath);
                        serialized.size = String(Math.round(stats.size / 1024));
                    } else {
                        serialized.size = "0";
                    }
                } catch (e) {
                    serialized.size = "0";
                }

                const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
                serialized.fileUpload = serialized.fileUpload.startsWith('http')
                    ? serialized.fileUpload
                    : (serialized.fileUpload.startsWith('/')
                        ? `${baseUrl}${serialized.fileUpload}`
                        : `${baseUrl}/uploads/${serialized.fileUpload}`);
            }
            return serialized;
        }
        return obj;
    }
}

export default new FileService();
