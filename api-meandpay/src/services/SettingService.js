import prisma from "../config/prisma.js";

class SettingService {
    async getAll(query = {}) {
        const search = query.search || "";
        const where = search
            ? {
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } },
                    { phone: { contains: search } },
                    { alamat: { contains: search } },
                ],
            }
            : {};

        const data = await prisma.settings.findMany({
            where,
            orderBy: { id: "desc" },
        });
        return { data: this.serializeList(data) };
    }

    async getById(id) {
        let record = await prisma.settings.findUnique({
            where: { id: BigInt(id) },
        });
        if (!record) {
            record = await prisma.settings.findFirst({
                orderBy: { id: "asc" }
            });
        }
        if (!record) return null;
        return this.serialize(record);
    }

    async create(data) {
        const now = new Date();
        const record = await prisma.settings.create({
            data: {
                ...this.sanitizeInput(data),
                created_at: now,
                updated_at: now,
            },
        });
        return this.serialize(record);
    }
 
    async update(id, data) {
        let existing = await prisma.settings.findUnique({
            where: { id: BigInt(id) },
        });
        if (!existing) {
            existing = await prisma.settings.findFirst({
                orderBy: { id: "asc" }
            });
        }

        if (!existing) {
            return this.create(data);
        }

        const record = await prisma.settings.update({
            where: { id: existing.id },
            data: {
                ...this.sanitizeInput(data),
                updated_at: new Date(),
            },
        });
        return this.serialize(record);
    }

    async delete(id) {
        let existing = await prisma.settings.findUnique({
            where: { id: BigInt(id) },
        });
        if (!existing) {
            existing = await prisma.settings.findFirst({
                orderBy: { id: "asc" }
            });
        }
        if (!existing) return null;
        await prisma.settings.delete({ where: { id: existing.id } });
        return true;
    }

    sanitizeInput(data) {
        const allowedFields = [
            "name", "logo", "alamat", "phone",
            "whatsapp", "api_url", "api_whatsapp", "email",
            "file_form_cuti", "file_slip_gaji", "file_form_lembur", "footer"
        ];
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            if (value === undefined) continue;
            if (allowedFields.includes(key)) {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    serialize(record) {
        const serialized = {};
        for (const [key, value] of Object.entries(record)) {
            if (typeof value === "bigint") {
                serialized[key] = value.toString();
            } else {
                serialized[key] = value;
            }
        }
        return serialized;
    }

    serializeList(items) {
        return items.map((item) => this.serialize(item));
    }
}

export default new SettingService();
