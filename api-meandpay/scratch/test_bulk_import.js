import PayrollService from "../src/services/PayrollService.js";
import prisma from "../src/config/prisma.js";

async function test() {
    console.log("--- Testing Bulk Import ---");
    const payload = [
        {
            nama_pegawai: "Mardiyah",
            gaji_pokok: "5000000",
            total_reimbursement: "100000",
            total_tunjangan_transport: "150000",
            total_tunjangan_makan: "200000",
            total_tunjangan_bpjs_kesehatan: "100000",
            total_tunjangan_bpjs_ketenagakerjaan: "120000",
            total_potongan_bpjs_kesehatan: "20000",
            total_potongan_bpjs_ketenagakerjaan: "30000",
            total_lembur: "250000",
            bonus_pribadi: "100000",
            bonus_team: "0",
            bonus_jackpot: "0",
            total_terlambat: "0",
            total_mangkir: "0",
            total_izin: "0",
            bayar_kasbon: "0",
            potongan_koperasi: "50000",
            total_thr: "0"
        }
    ];

    try {
        const result = await PayrollService.bulkImport("Desember", "2029", payload);
        console.log("Bulk import result success:", result.success);
        console.log("Message:", result.message);
        console.log("First imported item:");
        console.log(result.data[0]);

        // Clean up the test import
        await prisma.payrolls.deleteMany({
            where: {
                bulan: "Desember",
                tahun: "2029"
            }
        });
        console.log("Test payroll successfully cleaned up.");
    } catch (error) {
        console.error("Bulk import failed:", error);
    }
}

test().catch(console.error);
