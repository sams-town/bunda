import prisma from "../config/prisma.js";

class RapatService {
    /**
     * Get all rapats with optional search & filters
     */
    async getAll(query = {}) {
        const search = query.search || "";

        // Optional date filters for Tanggal Mulai dan Tanggal Akhir
        const startDate = query.start_date ? new Date(query.start_date) : undefined;
        const endDate = query.end_date ? new Date(query.end_date) : undefined;

        const where = {
            OR: search ? [
                { nama: { contains: search } },
                { lokasi: { contains: search } },
                { detail: { contains: search } },
                { jenis: { contains: search } }
            ] : undefined,
        };

        if (startDate || endDate) {
            where.tanggal = {};
            if (startDate) where.tanggal.gte = startDate;
            if (endDate) where.tanggal.lte = endDate;
        }

        const data = await prisma.rapats.findMany({
            where,
            orderBy: { id: "desc" },
        });

        const result = await this._attachRelations(data);

        return {
            data: this.serializeList(result),
        };
    }

    /**
     * Get single rapat by ID
     */
    async getById(id) {
        const rapat = await prisma.rapats.findUnique({
            where: { id: BigInt(id) },
        });

        if (!rapat) return null;

        const result = await this._attachRelations(rapat);
        return this.serialize(result);
    }

    /**
     * Create a new rapat
     */
    async create(data) {
        const payload = { ...data };
        if (payload.tanggal) payload.tanggal = new Date(payload.tanggal);

        // Map frontend fields
        if (payload.mulai) {
            payload.jam_mulai = payload.mulai;
            delete payload.mulai;
        }
        if (payload.selesai) {
            payload.jam_selesai = payload.selesai;
            delete payload.selesai;
        }

        const pesertaIds = payload.peserta_ids; // Assumes array of IDs from FE
        const notulenText = payload.notulen;

        delete payload.peserta;
        delete payload.peserta_ids;
        delete payload.notulen;

        const rapat = await prisma.rapats.create({
            data: payload,
        });

        if (pesertaIds && Array.isArray(pesertaIds)) {
            const pegawais = pesertaIds.map(userId => ({
                rapat_id: rapat.id,
                user_id: BigInt(userId)
            }));
            if (pegawais.length > 0) {
                await prisma.rapat_pegawais.createMany({
                    data: pegawais
                });
            }
        }

        if (notulenText) {
            await prisma.rapat_notulens.create({
                data: {
                    rapat_id: rapat.id,
                    notulen: notulenText
                }
            });
        }

        const result = await this._attachRelations(rapat);
        return this.serialize(result);
    }

    /**
     * Update rapat by ID
     */
    async update(id, data) {
        const existing = await prisma.rapats.findUnique({
            where: { id: BigInt(id) },
        });

        if (!existing) return null;

        const updateData = { ...data };
        if (updateData.tanggal) updateData.tanggal = new Date(updateData.tanggal);

        if (updateData.mulai) {
            updateData.jam_mulai = updateData.mulai;
            delete updateData.mulai;
        }
        if (updateData.selesai) {
            updateData.jam_selesai = updateData.selesai;
            delete updateData.selesai;
        }

        const pesertaIds = updateData.peserta_ids;
        const notulenText = updateData.notulen;

        delete updateData.peserta;
        delete updateData.peserta_ids;
        delete updateData.notulen;

        delete updateData.id;
        delete updateData.created_at;
        delete updateData.updated_at;

        const rapat = await prisma.rapats.update({
            where: { id: BigInt(id) },
            data: updateData,
        });

        if (pesertaIds && Array.isArray(pesertaIds)) {
            await prisma.rapat_pegawais.deleteMany({
                where: { rapat_id: BigInt(id) }
            });
            const pegawais = pesertaIds.map(userId => ({
                rapat_id: rapat.id,
                user_id: BigInt(userId)
            }));
            if (pegawais.length > 0) {
                await prisma.rapat_pegawais.createMany({
                    data: pegawais
                });
            }
        }

        if (notulenText !== undefined) {
            // Basic overwrite approach: Delete existing and recreate
            await prisma.rapat_notulens.deleteMany({
                where: { rapat_id: BigInt(id) }
            });
            if (notulenText.trim() !== '') {
                await prisma.rapat_notulens.create({
                    data: {
                        rapat_id: rapat.id,
                        notulen: notulenText
                    }
                });
            }
        }

        const result = await this._attachRelations(rapat);
        return this.serialize(result);
    }

    /**
     * Delete rapat by ID
     */
    async delete(id) {
        const existing = await prisma.rapats.findUnique({
            where: { id: BigInt(id) },
        });

        if (!existing) return null;

        // Cascade delete child relations manually because we don't know schema cascade strategy
        await prisma.rapat_pegawais.deleteMany({
            where: { rapat_id: BigInt(id) }
        });
        await prisma.rapat_notulens.deleteMany({
            where: { rapat_id: BigInt(id) }
        });

        await prisma.rapats.delete({
            where: { id: BigInt(id) },
        });

        return true;
    }

    /**
     * Helper Method: Attach participants
     */
    async _attachRelations(records) {
        if (!records) return records;
        const isArray = Array.isArray(records);
        const data = isArray ? records : [records];

        for (const item of data) {
            item.mulai = item.jam_mulai;
            item.selesai = item.jam_selesai;

            if (item.id) {
                const attendees = await prisma.rapat_pegawais.findMany({
                    where: { rapat_id: item.id }
                });

                if (attendees.length > 0) {
                    const userIds = attendees.map(a => a.user_id).filter(id => id != null);
                    const users = await prisma.users.findMany({
                        where: { id: { in: userIds } },
                        select: { name: true }
                    });
                    item.peserta = users.map(u => u.name).join(', ');
                } else {
                    item.peserta = "-";
                }

                // Attach Notulen
                const notulens = await prisma.rapat_notulens.findMany({
                    where: { rapat_id: item.id }
                });
                if (notulens.length > 0) {
                    item.notulen = notulens.map(n => n.notulen).join('\n\n');
                } else {
                    item.notulen = "-";
                }
            }
        }

        return isArray ? data : data[0];
    }

    /**
     * Serialize BigInt
     */
    serialize(rapat) {
        const serialized = {};
        for (const [key, value] of Object.entries(rapat)) {
            if (typeof value === "bigint") {
                serialized[key] = value.toString();
            } else {
                serialized[key] = value;
            }
        }
        return serialized;
    }

    serializeList(rapats) {
        return rapats.map((rapat) => this.serialize(rapat));
    }
}

export default new RapatService();
