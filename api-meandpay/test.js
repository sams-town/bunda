import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const data = await prisma.users.findMany({
        select: { id: true, name: true, foto_karyawan: true, foto_face_recognition: true },
        take: 10
    });
    console.log(JSON.stringify(data, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
}
main().finally(() => prisma.$disconnect());
