import prisma from "../config/prisma.js";

class PajakService {
    calculateTaxes(bruto, ptkp) {
        // Biaya Jabatan (5%, max 500k/month, 6jt/year)
        const biayaJabatan = Math.min(Number(bruto) * 0.05, 500000);

        // Netto Sebulan
        const nettoSebulan = Number(bruto) - biayaJabatan;

        // Netto Setahun
        const nettoSetahun = nettoSebulan * 12;

        // PTKP
        const ptkpNum = Number(ptkp) || 54000000;

        // PKP Setahun (rounded down to nearest 1000)
        let pkpSetahun = Math.max(nettoSetahun - ptkpNum, 0);
        pkpSetahun = Math.floor(pkpSetahun / 1000) * 1000;

        // PPH 21 Setahun Calculation (Law HPP 2024 tiering)
        let pph21Setahun = 0;
        let taxable = pkpSetahun;

        // Tiers: 5%, 15%, 25%, 30%, 35%
        const tiers = [
            { limit: 60000000, rate: 0.05 },
            { limit: 250000000, rate: 0.15 },
            { limit: 500000000, rate: 0.25 },
            { limit: 5000000000, rate: 0.30 },
            { limit: Infinity, rate: 0.35 }
        ];

        let previousLimit = 0;
        for (const tier of tiers) {
            if (taxable > 0) {
                const currentChunk = Math.min(taxable, tier.limit - previousLimit);
                pph21Setahun += currentChunk * tier.rate;
                taxable -= currentChunk;
                previousLimit = tier.limit;
            } else {
                break;
            }
        }

        // PPH 21 Sebulan
        const pph21Sebulan = pph21Setahun / 12;

        return {
            biaya_jabatan: biayaJabatan,
            netto_sebulan: nettoSebulan,
            netto_setahun: nettoSetahun,
            ptkp: ptkpNum,
            pkp_setahun: pkpSetahun,
            pph21_setahun: pph21Setahun,
            pph21_sebulan: pph21Sebulan
        };
    }

    async getAll(query = {}) {
        const { bulan, tahun, search } = query;
        const currentBulan = bulan || new Date().toLocaleString('id-ID', { month: 'long' });
        const currentTahun = tahun || new Date().getFullYear().toString();

        const users = await prisma.users.findMany({
            where: {
                is_admin: { not: "1" }, // Non-admins usually
                name: search ? { contains: search } : undefined
            },
            include: {
                status_pajak: true,
                payrolls: {
                    where: { bulan: currentBulan, tahun: currentTahun }
                }
            }
        });

        const report = users.map(user => {
            const payroll = user.payrolls[0]; // Assuming only one payroll per month
            const bruto = payroll ? Number(payroll.total_penjumlahan || 0) : 0;
            const ptkp = user.status_pajak ? user.status_pajak.ptkp : 54000000;

            const taxes = this.calculateTaxes(bruto, ptkp);

            return {
                id: user.id.toString(),
                nama_pegawai: user.name,
                bulan: currentBulan,
                tahun: currentTahun,
                status_pajak: user.status_pajak?.name || 'TK/0',
                bruto: bruto,
                ...taxes
            };
        });

        return {
            success: true,
            message: "Berhasil mengambil data laporan pajak",
            data: report
        };
    }
}

export default new PajakService();
