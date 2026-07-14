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
        const record = await prisma.settings.findFirst({
            where: { id: BigInt(id) },
        });
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
        const existing = await prisma.settings.findUnique({
            where: { id: BigInt(id) },
        });
        if (!existing) return null;

        const record = await prisma.settings.update({
            where: { id: BigInt(id) },
            data: {
                ...this.sanitizeInput(data),
                updated_at: new Date(),
            },
        });
        return this.serialize(record);
    }

    async delete(id) {
        const existing = await prisma.settings.findUnique({
            where: { id: BigInt(id) },
        });
        if (!existing) return null;
        await prisma.settings.delete({ where: { id: BigInt(id) } });
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
