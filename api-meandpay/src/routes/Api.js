import express from "express";
import userController from "../controllers/UserController.js";
import roleController from "../controllers/RoleController.js";
import authController from "../controllers/AuthController.js";
import lokasiController from "../controllers/LokasiController.js";
import jabatanController from "../controllers/JabatanController.js";
import kunjunganController from "../controllers/KunjunganController.js";
import shiftController from "../controllers/ShiftController.js";
import kontrakController from "../controllers/KontrakController.js";
import pegawaiKeluarController from "../controllers/PegawaiKeluarController.js";
import cutiController from "../controllers/cutiController.js";
import notificationController from "../controllers/NotificationController.js";
import absensiController from "../controllers/AbsensiController.js";
import dinasLuarController from "../controllers/DinasLuarController.js";
import statusPajakController from "../controllers/StatusPajakController.js";
import mappingShiftController from "../controllers/MappingShiftController.js";
import lemburController from "../controllers/LemburController.js";
import inventoryController from "../controllers/InventoryController.js";
import fileController from "../controllers/FileController.js";
import settingController from "../controllers/SettingController.js";
import beritaController from "../controllers/BeritaController.js";
import penugasanController from "../controllers/PenugasanController.js";
import rapatController from "../controllers/RapatController.js";
import jenisKinerjaController from "../controllers/JenisKinerjaController.js";
import laporanKinerjaController from "../controllers/LaporanKinerjaController.js";
import kinerjaPegawaiController from "../controllers/KinerjaPegawaiController.js";
import laporanKerjaController from "../controllers/LaporanKerjaController.js";
import kategoriReimbursementController from "../controllers/KategoriReimbursementController.js";
import reimbursementController from "../controllers/ReimbursementController.js";
import targetDetailController from "../controllers/TargetDetailController.js";
import targetMasterController from "../controllers/TargetMasterController.js";
import targetKinerjaController from "../controllers/TargetKinerjaController.js";
import pengajuanKeuanganController from "../controllers/PengajuanKeuanganController.js";
import kasbonController from "../controllers/KasbonController.js";
import pajakController from "../controllers/PajakController.js";
import payrollController from '../controllers/PayrollController.js';
import dashboardController from '../controllers/DashboardController.js';
import { authMiddleware } from "../middleware/authMiddleware.js";
import { upload, createUploadMiddleware } from "../middleware/uploadMiddleware.js";
const router = express.Router();

// ========================
// AUTH ROUTES
// ========================
router.post("/login", (req, res) => authController.login(req, res));
router.get("/me", authMiddleware, (req, res) => authController.getProfile(req, res));
router.put("/me", authMiddleware, (req, res) => authController.updateProfile(req, res));

// ========================
// USER ROUTES
// ========================
router.get("/users", (req, res) => userController.index(req, res));
router.get("/users/all", (req, res) => userController.all(req, res));
router.get("/users/:id", (req, res) => userController.show(req, res));
router.post("/users", authMiddleware, upload.single("foto_karyawan"), (req, res) => userController.store(req, res));
router.put("/users/:id", authMiddleware, upload.single("foto_karyawan"), (req, res) => userController.update(req, res));
router.post("/users/face-recognition", authMiddleware, upload.single("foto_face_recognition"), (req, res) => userController.faceRecognition(req, res));
router.post("/users/:id/face-recognition", authMiddleware, upload.single("foto_face_recognition"), (req, res) => userController.faceRecognition(req, res));
router.post("/users/bulk-delete", authMiddleware, (req, res) => userController.bulkDestroy(req, res));
router.delete("/users/:id", authMiddleware, (req, res) => userController.destroy(req, res));

// ========================
// ROLE ROUTES
// ========================
router.get("/roles", (req, res) => roleController.index(req, res));
router.get("/roles/:id", (req, res) => roleController.show(req, res));
router.post("/roles", (req, res) => roleController.store(req, res));
router.put("/roles/:id", (req, res) => roleController.update(req, res));
router.delete("/roles/:id", (req, res) => roleController.destroy(req, res));

// ========================
// LOKASI ROUTES
// ========================
router.get("/lokasi", (req, res) => lokasiController.index(req, res));
router.get("/lokasi/pending", (req, res) => lokasiController.pending(req, res));
router.get("/lokasi/:id", (req, res) => lokasiController.show(req, res));
router.post("/lokasi", authMiddleware, (req, res) => lokasiController.store(req, res));
router.put("/lokasi/:id", (req, res) => lokasiController.update(req, res));
router.put("/lokasi/:id/approve", upload.none(), (req, res) => lokasiController.approve(req, res));
router.delete("/lokasi/:id", (req, res) => lokasiController.destroy(req, res));

// ========================
// JABATAN ROUTES
// ========================
router.get("/jabatans", (req, res) => jabatanController.index(req, res));
router.get("/jabatans/:id", (req, res) => jabatanController.show(req, res));
router.post("/jabatans", (req, res) => jabatanController.store(req, res));
router.put("/jabatans/:id", (req, res) => jabatanController.update(req, res));
router.delete("/jabatans/:id", (req, res) => jabatanController.destroy(req, res));

// ========================
// KUNJUNGAN ROUTES
// ========================
const kunjunganUpload = createUploadMiddleware("kunjungans", "kunjungan");
router.get("/kunjungan", (req, res) => kunjunganController.index(req, res));
router.get("/kunjungan/:id", (req, res) => kunjunganController.show(req, res));
router.post("/kunjungan", kunjunganUpload.single("foto"), (req, res) => kunjunganController.store(req, res));
router.put("/kunjungan/:id", kunjunganUpload.single("foto"), (req, res) => kunjunganController.update(req, res));
router.delete("/kunjungan/:id", (req, res) => kunjunganController.destroy(req, res));

// ========================
// SHIFT ROUTES
// ========================
router.get("/shifts", (req, res) => shiftController.index(req, res));
router.get("/shifts/:id", (req, res) => shiftController.show(req, res));
router.post("/shifts", (req, res) => shiftController.store(req, res));
router.put("/shifts/:id", (req, res) => shiftController.update(req, res));
router.delete("/shifts/:id", (req, res) => shiftController.destroy(req, res));

// ========================
// CUTI ROUTES
// ========================
router.get("/cutis", (req, res) => cutiController.index(req, res));
router.get("/cutis/:id", (req, res) => cutiController.show(req, res));
router.get("/cutis/user/:userId", (req, res) => cutiController.showByUserId(req, res));
const cutiUpload = createUploadMiddleware("cuti", "cuti");
router.post("/cutis", authMiddleware, cutiUpload.single("foto_cuti"), (req, res) => cutiController.store(req, res));
router.put("/cutis/:id", cutiUpload.single("foto_cuti"), (req, res) => cutiController.update(req, res));
router.put("/cutis/:id/approve", upload.none(), (req, res) => cutiController.approve(req, res));
router.delete("/cutis/:id", (req, res) => cutiController.destroy(req, res));

// ========================
// KONTRAK ROUTES
// ========================
router.get("/kontraks", (req, res) => kontrakController.index(req, res));
router.get("/kontraks/user/:userId", (req, res) => kontrakController.showByUserId(req, res));
router.get("/kontraks/:id", (req, res) => kontrakController.show(req, res));
router.post("/kontraks", (req, res) => kontrakController.store(req, res));
router.put("/kontraks/:id", (req, res) => kontrakController.update(req, res));
router.delete("/kontraks/:id", (req, res) => kontrakController.destroy(req, res));

// ========================
// PEGAWAI KELUAR ROUTES
// ========================
router.get("/pegawai-keluar", (req, res) => pegawaiKeluarController.index(req, res));
router.get("/pegawai-keluar/:id", (req, res) => pegawaiKeluarController.show(req, res));
router.post("/pegawai-keluar", (req, res) => pegawaiKeluarController.store(req, res));
router.put("/pegawai-keluar/:id", (req, res) => pegawaiKeluarController.update(req, res));
router.put("/pegawai-keluar/:id/approve", upload.none(), (req, res) => pegawaiKeluarController.approve(req, res));
router.put("/pegawai-keluar/:id/restore", authMiddleware, (req, res) => pegawaiKeluarController.restore(req, res));
router.delete("/pegawai-keluar/:id", (req, res) => pegawaiKeluarController.destroy(req, res));

// ========================
// NOTIFICATIONS ROUTES
// ========================
router.get("/notifications", (req, res) => notificationController.index(req, res));
router.get("/notifications/:id", (req, res) => notificationController.show(req, res));
router.post("/notifications", (req, res) => notificationController.store(req, res));
router.put("/notifications/:id", (req, res) => notificationController.update(req, res));
router.put("/notifications/:id/read", (req, res) => notificationController.markRead(req, res));
router.put("/notifications/clear", (req, res) => notificationController.clear(req, res));
router.put("/notifications/:id/clear", (req, res) => notificationController.clear(req, res));
router.delete("/notifications/:id", (req, res) => notificationController.destroy(req, res));

// ========================
// ABSENSI ROUTES
// ========================
const absensiUpload = createUploadMiddleware("absensi", "absensi");
router.get("/absensi", (req, res) => absensiController.index(req, res));
router.get("/absensi/recap", (req, res) => absensiController.recap(req, res));
router.get("/absensi/:id", (req, res) => absensiController.show(req, res));
router.get("/absensi_user/:id", (req, res) => absensiController.showUser(req, res));
router.get("/absensi_user_history/:id/:tanggal_mulai/:tanggal_akhir", (req, res) => absensiController.showUserHistory(req, res));
router.post("/absensi", absensiUpload.fields([{ name: "foto_jam_absen", maxCount: 1 }, { name: "foto_jam_pulang", maxCount: 1 }]), (req, res) => absensiController.store(req, res));
router.post("/absensi_wajah", absensiUpload.any(), (req, res) => absensiController.storeWajah(req, res));
router.put("/absensi/:id", absensiUpload.fields([{ name: "foto_jam_absen", maxCount: 1 }, { name: "foto_jam_pulang", maxCount: 1 }]), (req, res) => absensiController.update(req, res));
router.post("/absensi/:id", absensiUpload.fields([{ name: "foto_jam_absen", maxCount: 1 }, { name: "foto_jam_pulang", maxCount: 1 }]), (req, res) => absensiController.update(req, res)); // Fallback for forms that use POST
router.delete("/absensi/:id", (req, res) => absensiController.destroy(req, res));

// ========================
// DINAS LUAR ROUTES
// ========================
router.get("/dinas-luar", (req, res) => dinasLuarController.index(req, res));
router.get("/dinas-luar/:id", (req, res) => dinasLuarController.show(req, res));
router.get("/dinas-luar-users/:id", (req, res) => dinasLuarController.showUser(req, res));
const dinasUpload = createUploadMiddleware("dinasluar", "dl");
router.post("/dinas-luar", dinasUpload.any(), (req, res) => dinasLuarController.store(req, res));
router.post("/dinas-luar/bulk", (req, res) => dinasLuarController.bulkStore(req, res));
router.put("/dinas-luar/bulk", (req, res) => dinasLuarController.bulkUpdate(req, res));
router.delete("/dinas-luar/bulk", (req, res) => dinasLuarController.bulkDestroy(req, res));
router.put("/dinas-luar/:id", dinasUpload.fields([{ name: "foto_jam_absen", maxCount: 1 }, { name: "foto_jam_pulang", maxCount: 1 }]), (req, res) => dinasLuarController.update(req, res));
router.post("/dinas-luar/:id", dinasUpload.fields([{ name: "foto_jam_absen", maxCount: 1 }, { name: "foto_jam_pulang", maxCount: 1 }]), (req, res) => dinasLuarController.update(req, res)); // Fallback
router.delete("/dinas-luar/:id", (req, res) => dinasLuarController.destroy(req, res));

// ========================
// STATUS PAJAK ROUTES
// ========================
router.get("/status-pajak", (req, res) => statusPajakController.index(req, res));
router.get("/status-pajak/:id", (req, res) => statusPajakController.show(req, res));
router.post("/status-pajak", (req, res) => statusPajakController.store(req, res));
router.put("/status-pajak/:id", (req, res) => statusPajakController.update(req, res));
router.delete("/status-pajak/:id", (req, res) => statusPajakController.destroy(req, res));

// ========================
// MAPPING SHIFT ROUTES
// ========================
router.get("/mapping-shifts", (req, res) => mappingShiftController.index(req, res));
router.get("/mapping-shifts/:id", (req, res) => mappingShiftController.show(req, res));
router.get("/mapping-shifts-user/:id", (req, res) => mappingShiftController.showUser(req, res));
router.get("/mapping-shifts-user-first/:id", (req, res) => mappingShiftController.showUserFirst(req, res));
router.post("/mapping-shifts/bulk", (req, res) => mappingShiftController.bulkStore(req, res));
router.put("/mapping-shifts/bulk", (req, res) => mappingShiftController.bulkUpdate(req, res));
router.delete("/mapping-shifts/bulk", (req, res) => mappingShiftController.bulkDestroy(req, res));

// ========================
// LEMBUR ROUTES
// ========================
const lemburUpload = createUploadMiddleware("lemburs", "lembur", undefined, undefined, false);
router.get("/lemburs", (req, res) => lemburController.index(req, res));
router.get("/lemburs/:id", (req, res) => lemburController.show(req, res));
router.get("/lemburs-user/:user_id", (req, res) => lemburController.showUser(req, res));
router.post("/lemburs", lemburUpload.fields([{ name: "foto_jam_masuk", maxCount: 1 }, { name: "foto_jam_keluar", maxCount: 1 }, { name: "file_lembur", maxCount: 1 }]), (req, res) => lemburController.store(req, res));
router.put("/lemburs/:id", lemburUpload.fields([{ name: "foto_jam_masuk", maxCount: 1 }, { name: "foto_jam_keluar", maxCount: 1 }, { name: "file_lembur", maxCount: 1 }]), (req, res) => lemburController.update(req, res));
router.post("/lemburs/:id", lemburUpload.fields([{ name: "foto_jam_masuk", maxCount: 1 }, { name: "foto_jam_keluar", maxCount: 1 }, { name: "file_lembur", maxCount: 1 }]), (req, res) => lemburController.update(req, res)); // Fallback
router.put("/lemburs/:id/approve", upload.none(), (req, res) => lemburController.approve(req, res));
router.post("/lemburs/:id/approve", upload.none(), (req, res) => lemburController.approve(req, res)); // Fallback
router.delete("/lemburs/:id", (req, res) => lemburController.destroy(req, res));

// ========================
// INVENTORY ROUTES
// ========================
router.get("/inventories", (req, res) => inventoryController.index(req, res));
router.get("/inventories/:id", (req, res) => inventoryController.show(req, res));
router.post("/inventories", (req, res) => inventoryController.store(req, res));
router.put("/inventories/:id", (req, res) => inventoryController.update(req, res));
router.delete("/inventories/:id", (req, res) => inventoryController.destroy(req, res));

// ========================
// DOCUMENT ROUTES
// ========================
const documentUpload = createUploadMiddleware(
    "dokumen_pegawai",
    "doc",
    [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "image/jpeg",
        "image/png",
        "image/jpg"
    ],
    10 * 1024 * 1024 // Max 10MB
);
router.get("/documents", (req, res) => fileController.index(req, res));
router.post("/documents", documentUpload.single("file"), (req, res) => fileController.store(req, res));
router.put("/documents/:id", documentUpload.single("file"), (req, res) => fileController.update(req, res));
router.delete("/documents/:id", (req, res) => fileController.destroy(req, res));

// ========================
// SETTING ROUTES
// ========================
const settingUpload = createUploadMiddleware(
    "logos",
    "logo",
    [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
        "image/jpg"
    ],
    10 * 1024 * 1024
);
router.get("/settings", (req, res) => settingController.index(req, res));
router.get("/settings/:id", (req, res) => settingController.show(req, res));
router.post("/settings", settingUpload.fields([{ name: "logo", maxCount: 1 }, { name: "form_cuti", maxCount: 1 }, { name: "slip_gaji", maxCount: 1 }, { name: "form_lembur", maxCount: 1 }]), (req, res) => settingController.store(req, res));
router.put("/settings/:id", settingUpload.fields([{ name: "logo", maxCount: 1 }, { name: "form_cuti", maxCount: 1 }, { name: "slip_gaji", maxCount: 1 }, { name: "form_lembur", maxCount: 1 }]), (req, res) => settingController.update(req, res));
router.delete("/settings/:id", (req, res) => settingController.destroy(req, res));

// ========================
// BERITA ROUTES
// ========================
const beritaUpload = createUploadMiddleware("beritas", "file", ["image/jpeg", "image/png", "image/jpg", "application/pdf"], 5 * 1024 * 1024, false);
router.get("/beritas", (req, res) => beritaController.index(req, res));
router.get("/beritas/:id", (req, res) => beritaController.show(req, res));
router.post("/beritas", beritaUpload.single("gambar"), (req, res) => beritaController.store(req, res));
router.put("/beritas/:id", beritaUpload.single("gambar"), (req, res) => beritaController.update(req, res));
router.delete("/beritas/:id", (req, res) => beritaController.destroy(req, res));

// ========================
// PENUGASAN ROUTES
// ========================
router.get("/penugasans", (req, res) => penugasanController.index(req, res));
router.get("/penugasans/:id", (req, res) => penugasanController.show(req, res));
router.post("/penugasans", (req, res) => penugasanController.store(req, res));
router.put("/penugasans/:id", (req, res) => penugasanController.update(req, res));
router.delete("/penugasans/:id", (req, res) => penugasanController.destroy(req, res));

// ========================
// RAPAT ROUTES
// ========================
router.get("/rapats", (req, res) => rapatController.index(req, res));
router.get("/rapats/:id", (req, res) => rapatController.show(req, res));
router.post("/rapats", (req, res) => rapatController.store(req, res));
router.put("/rapats/:id", (req, res) => rapatController.update(req, res));
router.delete("/rapats/:id", (req, res) => rapatController.destroy(req, res));

// ========================
// JENIS KINERJA ROUTES
// ========================
router.get("/jenis-kinerjas", (req, res) => jenisKinerjaController.index(req, res));
router.get("/jenis-kinerjas/:id", (req, res) => jenisKinerjaController.show(req, res));
router.post("/jenis-kinerjas", (req, res) => jenisKinerjaController.store(req, res));
router.put("/jenis-kinerjas/:id", (req, res) => jenisKinerjaController.update(req, res));
router.delete("/jenis-kinerjas/:id", (req, res) => jenisKinerjaController.destroy(req, res));

// ========================
// LAPORAN KINERJA ROUTES
// ========================
router.get("/laporan-kinerjas", (req, res) => laporanKinerjaController.index(req, res));

// ========================
// KINERJA PEGAWAI (SUMMARY) ROUTES
// ========================
router.get("/kinerja-pegawais", (req, res) => kinerjaPegawaiController.index(req, res));

// ========================
// LAPORAN KERJA ROUTES
// ========================
router.get("/laporan-kerjas", (req, res) => laporanKerjaController.index(req, res));

// ========================
// KATEGORI REIMBURSEMENT ROUTES
// ========================
router.get("/kategori-reimbursement", (req, res) => kategoriReimbursementController.index(req, res));
router.post("/kategori-reimbursement", (req, res) => kategoriReimbursementController.store(req, res));
router.put("/kategori-reimbursement/:id", (req, res) => kategoriReimbursementController.update(req, res));
router.delete("/kategori-reimbursement/:id", (req, res) => kategoriReimbursementController.destroy(req, res));

// ========================
// REIMBURSEMENT ROUTES
// ========================
const reimbursementUpload = createUploadMiddleware("reimbursement", "reimb");
router.get("/reimbursements", (req, res) => reimbursementController.index(req, res));
router.get("/reimbursements/:id", (req, res) => reimbursementController.show(req, res));
router.post("/reimbursements", reimbursementUpload.single("file"), (req, res) => reimbursementController.store(req, res));
router.put("/reimbursements/:id", reimbursementUpload.single("file"), (req, res) => reimbursementController.update(req, res));
router.post("/reimbursements/:id", reimbursementUpload.single("file"), (req, res) => reimbursementController.update(req, res)); // Fallback
router.delete("/reimbursements/:id", (req, res) => reimbursementController.destroy(req, res));

// ========================
// TARGET DETAIL ROUTES
// ========================
router.get("/target-detail", (req, res) => targetDetailController.index(req, res));
// Add specific route to get employees for dropdown if needed, though usually users is enough
router.get("/target-detail/:id", (req, res) => targetDetailController.show(req, res));
router.post("/target-detail", (req, res) => targetDetailController.store(req, res));
router.put("/target-detail/:id", (req, res) => targetDetailController.update(req, res));
router.delete("/target-detail/:id", (req, res) => targetDetailController.destroy(req, res));

// ========================
// TARGET MASTER ROUTES
// ========================
router.get("/target-master", (req, res) => targetMasterController.index(req, res));
router.get("/target-master/:id", (req, res) => targetMasterController.show(req, res));
router.post("/target-master", (req, res) => targetMasterController.store(req, res));
router.put("/target-master/:id", (req, res) => targetMasterController.update(req, res));
router.delete("/target-master/:id", (req, res) => targetMasterController.destroy(req, res));

// ========================
// PENGAJUAN KEUANGAN ROUTES
// ========================
const pengajuanUpload = createUploadMiddleware("pengajuan_keuangan", "pk", ["application/pdf", "image/jpeg", "image/png", "image/jpg"], 10 * 1024 * 1024, false);
router.get("/pengajuan-keuangan", (req, res) => pengajuanKeuanganController.index(req, res));
router.get("/pengajuan-keuangan/:id", (req, res) => pengajuanKeuanganController.show(req, res));
router.post("/pengajuan-keuangan", pengajuanUpload.fields([{ name: "pk_document", maxCount: 1 }, { name: "nota", maxCount: 1 }]), (req, res) => pengajuanKeuanganController.store(req, res));
router.put("/pengajuan-keuangan/:id", pengajuanUpload.fields([{ name: "pk_document", maxCount: 1 }, { name: "nota", maxCount: 1 }]), (req, res) => pengajuanKeuanganController.update(req, res));
router.post("/pengajuan-keuangan/:id", pengajuanUpload.fields([{ name: "pk_document", maxCount: 1 }, { name: "nota", maxCount: 1 }]), (req, res) => pengajuanKeuanganController.update(req, res)); // Fallback
router.delete("/pengajuan-keuangan/:id", (req, res) => pengajuanKeuanganController.destroy(req, res));

// ========================
// KASBON ROUTES
// ========================
router.get("/kasbons", (req, res) => kasbonController.index(req, res));
router.get("/kasbons/:id", (req, res) => kasbonController.show(req, res));
router.post("/kasbons", (req, res) => kasbonController.store(req, res));
router.put("/kasbons/:id", (req, res) => kasbonController.update(req, res));
router.delete("/kasbons/:id", (req, res) => kasbonController.destroy(req, res));

// ========================
// PAJAK REPORT ROUTES
// ========================
router.get("/pajak-report", (req, res) => pajakController.index(req, res));

// ========================
// PAYROLL ROUTES
// ========================
router.get("/payrolls", (req, res) => payrollController.index(req, res));
router.get("/payrolls/:id", (req, res) => payrollController.show(req, res));
router.get("/payrolls_user/:id/:bulan/:tahun", (req, res) => payrollController.showUser(req, res));
router.post("/payrolls/generate", (req, res) => payrollController.generate(req, res));
router.post("/payrolls/generate-all", (req, res) => payrollController.generateAll(req, res));
router.post("/payrolls/bulk-import", (req, res) => payrollController.bulkImport(req, res));
router.put("/payrolls/:id", (req, res) => payrollController.update(req, res));
router.delete("/payrolls/:id", (req, res) => payrollController.destroy(req, res));

// ========================
// DASHBOARD ROUTES
// ========================
router.get("/dashboard/stats", (req, res) => dashboardController.index(req, res));

export default router;
