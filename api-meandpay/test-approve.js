import prisma from "./src/config/prisma.js";
import pegawaiKeluarService from "./src/services/PegawaiKeluarService.js";

async function main() {
    try {
        const pendings = await prisma.pegawai_keluars.findMany();
        console.log("All resignations count:", pendings.length);
        console.log("All items:", pendings.map(p => ({
            id: p.id.toString(),
            user_id: p.user_id.toString(),
            status: p.status,
            jenis: p.jenis
        })));

        if (pendings.length > 0) {
            const first = pendings[0];
            console.log("\nTrying to approve ID:", first.id.toString());
            try {
                const res = await pegawaiKeluarService.approve(first.id.toString(), {
                    approved_by: "1",
                    notes: "Disetujui dari test script"
                });
                console.log("Approve successful:", res);
            } catch (err) {
                console.error("Approve failed with error:", err);
            }
        }
    } catch (err) {
        console.error("Main error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
