import prisma from "../src/config/prisma.js";

async function main() {
    console.log("--- Inspecting payrolls table columns via Raw Query ---");
    const columns = await prisma.$queryRaw`DESCRIBE payrolls`;
    console.log(columns);
}

main().catch(console.error);
