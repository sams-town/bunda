import prisma from '../src/config/prisma.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const user = await prisma.users.findUnique({
        where: { id: 76n }
    });
    console.log("USER 76:", user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
