import prisma from "../src/config/prisma.js";

async function main() {
    console.log("--- Fetching details of latest 2 payrolls ---");
    const payrolls = await prisma.payrolls.findMany({
        take: 2,
        orderBy: {
            id: 'desc'
        },
        include: {
            employee: {
                select: { name: true }
            }
        }
    });

    const serialize = (val) => {
        return JSON.parse(JSON.stringify(val, (k, v) => typeof v === 'bigint' ? v.toString() : v));
    };

    for (const p of payrolls) {
        console.log(`\nPayroll ID: ${p.id} for ${p.employee?.name}`);
        console.log(JSON.stringify(serialize(p), null, 2));
    }
}

main().catch(console.error);
