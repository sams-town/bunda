import prisma from "../config/prisma.js";

class RoleService {
    /**
     * Get all roles with optional pagination & search
     */
    async getAll(query = {}) {
        const search = query.search || "";

        const where = search
            ? {
                OR: [
                    { name: { contains: search } },
                    { guard_name: { contains: search } },
                ],
            }
            : {};

        const data = await prisma.roles.findMany({
            where,
            orderBy: { id: "asc" },
        });

        return {
            data: this.serializeList(data),
        };
    }

    /**
     * Get single role by ID
     */
    async getById(id) {
        const role = await prisma.roles.findUnique({
            where: { id: BigInt(id) },
            include: {
                role_has_permissions: {
                    include: {
                        permissions: true
                    }
                }
            }
        });

        if (!role) return null;

        const serialized = this.serialize(role);

        // Extract permission names into an array
        if (role.role_has_permissions) {
            serialized.permissions = role.role_has_permissions.map(rhp => rhp.permissions.name);
            delete serialized.role_has_permissions;
        }

        return serialized;
    }

    /**
     * Create a new role
     */
    async create(data) {
        return await prisma.$transaction(async (tx) => {
            // Check if role with same name and guard_name already exists
            const existingRole = await tx.roles.findFirst({
                where: {
                    name: data.name,
                    guard_name: data.guard_name || "web",
                },
            });

            if (existingRole) {
                throw new Error(`Role with name '${data.name}' and guard '${data.guard_name || "web"}' already exists.`);
            }

            const role = await tx.roles.create({
                data: {
                    name: data.name,
                    guard_name: data.guard_name || "web",
                },
            });

            if (data.permissions && Array.isArray(data.permissions) && data.permissions.length > 0) {
                const existingPerms = await tx.permissions.findMany({
                    where: {
                        name: { in: data.permissions },
                        guard_name: data.guard_name || "web"
                    },
                    select: { id: true }
                });

                if (existingPerms.length > 0) {
                    const rolePermissionsPivot = existingPerms.map((perm) => ({
                        role_id: role.id,
                        permission_id: perm.id
                    }));

                    await tx.role_has_permissions.createMany({
                        data: rolePermissionsPivot
                    });
                }
            }

            return this.serialize(role);
        });
    }

    /**
     * Update role by ID
     */
    async update(id, data) {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.roles.findUnique({
                where: { id: BigInt(id) },
            });

            if (!existing) return null;

            const updateData = {};
            if (data.name !== undefined) updateData.name = data.name;
            if (data.guard_name !== undefined) updateData.guard_name = data.guard_name;

            // Check for uniqueness if name or guard_name is being changed
            if (updateData.name !== undefined || updateData.guard_name !== undefined) {
                const checkName = updateData.name !== undefined ? updateData.name : existing.name;
                const checkGuard = updateData.guard_name !== undefined ? updateData.guard_name : existing.guard_name;

                const duplicate = await tx.roles.findFirst({
                    where: {
                        name: checkName,
                        guard_name: checkGuard,
                        id: { not: existing.id }
                    }
                });

                if (duplicate) {
                    throw new Error(`Role with name '${checkName}' and guard '${checkGuard}' already exists.`);
                }
            }

            const role = await tx.roles.update({
                where: { id: BigInt(id) },
                data: updateData,
            });

            if (data.permissions && Array.isArray(data.permissions)) {
                // Delete existing permissions for this role
                await tx.role_has_permissions.deleteMany({
                    where: { role_id: role.id }
                });

                if (data.permissions.length > 0) {
                    const existingPerms = await tx.permissions.findMany({
                        where: {
                            name: { in: data.permissions },
                            guard_name: updateData.guard_name || existing.guard_name
                        },
                        select: { id: true }
                    });

                    if (existingPerms.length > 0) {
                        const newPivots = existingPerms.map((p) => ({
                            role_id: role.id,
                            permission_id: p.id
                        }));
                        await tx.role_has_permissions.createMany({
                            data: newPivots
                        });
                    }
                }
            }

            return this.serialize(role);
        });
    }

    /**
     * Delete role by ID
     */
    async delete(id) {
        const existing = await prisma.roles.findUnique({
            where: { id: BigInt(id) },
        });

        if (!existing) return null;

        await prisma.roles.delete({
            where: { id: BigInt(id) },
        });

        return true;
    }

    /**
     * Serialize a single role — convert BigInt to string for JSON
     */
    serialize(role) {
        const serialized = {};
        for (const [key, value] of Object.entries(role)) {
            if (typeof value === "bigint") {
                serialized[key] = value.toString();
            } else {
                serialized[key] = value;
            }
        }
        return serialized;
    }

    /**
     * Serialize a list of roles
     */
    serializeList(roles) {
        return roles.map((role) => this.serialize(role));
    }
}

export default new RoleService();
