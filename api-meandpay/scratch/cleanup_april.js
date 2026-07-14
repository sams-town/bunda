import prisma from "../src/config/prisma.js";

async function main() {
    console.log("Cleaning up April 2026 payroll records...");
    const deleted = await prisma.payrolls.deleteMany({
        where: {
            bulan: "April",
            tahun: "2026"
        }
    });
    console.log(`Successfully deleted ${deleted.count} temporary payroll records.`);
}

main().catch(console.error);
