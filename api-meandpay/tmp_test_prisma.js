import prisma from "./src/config/prisma.js";

async function test() {
    try {
        console.log("Mencoba kueri users dengan include status_pajak...");
        const user = await prisma.users.findFirst({
            include: {
                jabatan: true,
                lokasi: true,
                status_pajak: true
            }
        });
        console.log("✅ Kueri Berhasil! Field status_pajak ditemukan.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Kueri Gagal:");
        console.error(error.message);
        process.exit(1);
    }
}

test();
