import prisma from '../src/config/prisma.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const pk = await prisma.pegawai_keluars.findMany({
        include: {
            users: {
                select: {
                    id: true,
                    name: true,
                    username: true
                }
            }
        }
    });
    console.log("PEGAWAI KELUAR:");
    console.log(JSON.stringify(pk, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

    const total = await prisma.users.count();
    console.log("Total users in database:", total);
}

main().catch(console.error).finally(() => prisma.$disconnect());
