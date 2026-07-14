import prisma from "./src/config/prisma.js";

const permissions = [
    "absen.create", "absen.delete", "absen.edit", "absen.view",
    "berita.create", "berita.delete", "berita.edit", "berita.publish", "berita.view",
    "change-password.update",
    "dashboard.view",
    "data-absen.export", "data-absen.view",
    "data-cuti.approve", "data-cuti.create", "data-cuti.delete", "data-cuti.edit", "data-cuti.reject", "data-cuti.view",
    "data-dinas-luar.export", "data-dinas-luar.view",
    "data-lembur.export", "data-lembur.view",
    "data-patroli.export", "data-patroli.view",
    "detail-target-kinerja.create", "detail-target-kinerja.delete", "detail-target-kinerja.edit", "detail-target-kinerja.view",
    "dinas-luar.approve", "dinas-luar.create", "dinas-luar.delete", "dinas-luar.edit", "dinas-luar.view",
    "dokumen.create", "dokumen.delete", "dokumen.download", "dokumen.edit", "dokumen.view",
    "exit.create", "exit.delete", "exit.edit", "exit.export", "exit.view",
    "inventory.create", "inventory.delete", "inventory.edit", "inventory.export", "inventory.view",
    "jabatan.create", "jabatan.delete", "jabatan.edit", "jabatan.view",
    "jenis-kinerja.create", "jenis-kinerja.delete", "jenis-kinerja.edit", "jenis-kinerja.view",
    "kasbon.approve", "kasbon.create", "kasbon.delete", "kasbon.edit", "kasbon.view",
    "kategori.create", "kategori.delete", "kategori.edit", "kategori.view",
    "kinerja-pegawai.create", "kinerja-pegawai.delete", "kinerja-pegawai.edit", "kinerja-pegawai.evaluate", "kinerja-pegawai.view",
    "kontrak.create", "kontrak.delete", "kontrak.edit", "kontrak.export", "kontrak.view",
    "kunjungan.create", "kunjungan.delete", "kunjungan.edit", "kunjungan.export", "kunjungan.view",
    "laporan-kerja.approve", "laporan-kerja.create", "laporan-kerja.delete", "laporan-kerja.edit", "laporan-kerja.view",
    "laporan-kinerja.create", "laporan-kinerja.delete", "laporan-kinerja.edit", "laporan-kinerja.view",
    "lembur.approve", "lembur.create", "lembur.delete", "lembur.edit", "lembur.view",
    "list-pengajuan-keuangan.approve", "list-pengajuan-keuangan.reject", "list-pengajuan-keuangan.view",
    "lokasi-kantor.create", "lokasi-kantor.delete", "lokasi-kantor.edit", "lokasi-kantor.view",
    "my-profile.edit", "my-profile.view",
    "notifications.delete", "notifications.read", "notifications.view",
    "pajak.create", "pajak.delete", "pajak.edit", "pajak.view",
    "patroli.create", "patroli.delete", "patroli.edit", "patroli.view",
    "payroll.create", "payroll.delete", "payroll.edit", "payroll.export", "payroll.view",
    "pegawai.create", "pegawai.delete", "pegawai.edit", "pegawai.export", "pegawai.view",
    "penugasan.assign", "penugasan.create", "penugasan.delete", "penugasan.edit", "penugasan.view",
    "petunjuk.view",
    "rapat.attend", "rapat.create", "rapat.delete", "rapat.edit", "rapat.view",
    "reimbursement.approve", "reimbursement.create", "reimbursement.delete", "reimbursement.edit", "reimbursement.view",
    "rekap-data.export", "rekap-data.print", "rekap-data.view",
    "role.create", "role.delete", "role.edit", "role.view",
    "settings.edit", "settings.update", "settings.view",
    "shift.create", "shift.delete", "shift.edit", "shift.view",
    "status-pajak.create", "status-pajak.delete", "status-pajak.edit", "status-pajak.view",
    "switch.user",
    "target-kinerja.create", "target-kinerja.delete", "target-kinerja.edit", "target-kinerja.view",
    "social-media.view"
];

async function main() {
    console.log("Seeding permissions...");
    for (const name of permissions) {
        await prisma.permissions.upsert({
            where: { name_guard_name: { name, guard_name: "web" } },
            update: {},
            create: { name, guard_name: "web" }
        });
    }
    console.log("Done seeding permissions.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
