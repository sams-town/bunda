import prisma from './src/config/prisma.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const totalUsers = await prisma.users.count();
    console.log("Total users in DB:", totalUsers);

    const user76 = await prisma.users.findUnique({
        where: { id: 76n }
    });
    console.log("User 76:", user76);

    const allExcluded = await prisma.pegawai_keluars.findMany({
        where: { status: 'APPROVED' }
    });
    console.log("Resigned employees (APPROVED):", allExcluded);

    const allAdmins = await prisma.users.findMany({
        where: {
            is_admin: { in: ['admin', 'superadmin', 'super_admin', 'super admin'] }
        }
    });
    console.log("Admins in DB:", allAdmins.map(u => ({ id: u.id.toString(), name: u.name, is_admin: u.is_admin })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
