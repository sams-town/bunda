import prisma from "../src/config/prisma.js";

async function main() {
    console.log("--- Checking User Count and Payroll Count ---");
    const userCount = await prisma.users.count();
    const payrollCount = await prisma.payrolls.count();
    const shiftCount = await prisma.mapping_shifts.count();
    
    console.log(`Users: ${userCount}`);
    console.log(`Payrolls: ${payrollCount}`);
    console.log(`Mapping Shifts: ${shiftCount}`);

    // Let's check some users and their roles / is_admin
    const users = await prisma.users.findMany({
        take: 10,
        select: {
            id: true,
            name: true,
            is_admin: true
        }
    });
    console.log("\nSample users:");
    console.log(users.map(u => ({ id: u.id.toString(), name: u.name, is_admin: u.is_admin })));

    // Let's check existing payrolls in the database
    const latestPayrolls = await prisma.payrolls.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
            employee: {
                select: { name: true }
            }
        }
    });
    console.log("\nLatest payrolls:");
    console.log(latestPayrolls.map(p => ({
        id: p.id.toString(),
        name: p.employee?.name,
        bulan: p.bulan,
        tahun: p.tahun,
        grand_total: p.grand_total.toString()
    })));
}

main().catch(console.error);
