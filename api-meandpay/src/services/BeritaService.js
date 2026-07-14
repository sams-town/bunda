import prisma from "../config/prisma.js";
import fs from "fs";
import path from "path";

class BeritaService {
    async getAll(query = {}) {
        const search = query.search || "";
        const where = search ? {
            OR: [
                { tipe: { contains: search } },
                { judul: { contains: search } },
                { isi: { contains: search } },
            ]
        } : {};

        const data = await prisma.beritas.findMany({
            where,
            orderBy: { id: "desc" }
        });

        return { data: this.serializeList(data) };
    }

    async getById(id) {
        const record = await prisma.beritas.findUnique({ where: { id: BigInt(id) } });
        if (!record) return null;
        return this.serialize(record);
    }

    async create(data, file, baseUrl) {
        const payload = {
            tipe: data.tipe || null,
            judul: data.judul || null,
            isi: data.isi || null,
            link: data.link || null,
            created_at: new Date(),
            updated_at: new Date(),
        };

        if (file) {
            payload.berita_file_name = file.filename;
            payload.berita_file_path = baseUrl ? `${baseUrl}/beritas/${file.filename}` : `/beritas/${file.filename}`;
        }

        const record = await prisma.beritas.create({ data: payload });
        return this.getById(record.id);
    }

    async update(id, data, file, baseUrl) {
        const existing = await prisma.beritas.findUnique({ where: { id: BigInt(id) } });
        if (!existing) return null;

        const payload = {
            updated_at: new Date()
        };

        if (data.tipe !== undefined) payload.tipe = data.tipe;
        if (data.judul !== undefined) payload.judul = data.judul;
        if (data.isi !== undefined) payload.isi = data.isi;
        if (data.link !== undefined) payload.link = data.link;

        if (file) {
            payload.berita_file_name = file.filename;
            payload.berita_file_path = baseUrl ? `${baseUrl}/beritas/${file.filename}` : `/beritas/${file.filename}`;

            // Hapus file lama jika ada
            if (existing.berita_file_name) {
                const filePath = path.join(process.cwd(), "public", "beritas", existing.berita_file_name);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        const record = await prisma.beritas.update({
            where: { id: BigInt(id) },
            data: payload
        });
        return this.getById(record.id);
    }

    async delete(id) {
        const existing = await prisma.beritas.findUnique({ where: { id: BigInt(id) } });
        if (!existing) return null;

        // Hapus file dari folder public/beritas menggunakan nama aslinya
        if (existing.berita_file_name) {
            const filePath = path.join(process.cwd(), "public", "beritas", existing.berita_file_name);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await prisma.beritas.delete({ where: { id: BigInt(id) } });
        return true;
    }

    serialize(record) {
        const serialized = {};
        const baseUrl = process.env.BASE_URL || 'http://localhost:4000';

        for (const [key, value] of Object.entries(record)) {
            if (typeof value === "bigint") {
                serialized[key] = value.toString();
            } else if (key === 'berita_file_path' && value) {
                if (value.startsWith('http')) {
                    serialized[key] = value;
                } else if (value.startsWith('/')) {
                    serialized[key] = `${baseUrl}${value}`;
                } else {
                    serialized[key] = `${baseUrl}/${value}`;
                }
            } else {
                serialized[key] = value;
            }
        }
        return serialized;
    }

    serializeList(items) {
        return items.map(item => this.serialize(item));
    }
}

export default new BeritaService();
