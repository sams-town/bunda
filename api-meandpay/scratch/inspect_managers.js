import prisma from '../src/config/prisma.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log("=== JABATANS WITH MANAGERS ===");
    const jabatans = await prisma.jabatans.findMany({
        include: {
            users: true
        }
    });
    console.log(jabatans.map(j => ({
        id: j.id.toString(),
        nama_jabatan: j.nama_jabatan,
        manager_id: j.manager ? j.manager.toString() : null,
        manager_name: j.users ? j.users.name : null
    })));

    console.log("\n=== ALL USERS WITH IS_ADMIN ===");
    const admins = await prisma.users.findMany({
        where: {
            is_admin: {
                not: null
            }
        },
        select: {
            id: true,
            name: true,
            username: true,
            is_admin: true
        }
    });
    console.log(admins.map(a => ({
        id: a.id.toString(),
        name: a.name,
        username: a.username,
        is_admin: a.is_admin
    })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
