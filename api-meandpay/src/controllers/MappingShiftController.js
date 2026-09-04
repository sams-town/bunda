import mappingShiftService from "../services/MappingShiftService.js";
import prisma from "../config/prisma.js";

class MappingShiftController {
    async index(req, res) {
        try {
            const result = await mappingShiftService.getAll(req.query);
            return res.status(200).json({ success: true, message: "Data mapping shift berhasil diambil", ...result });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data mapping shift", error: error.message });
        }
    }

    async myTeam(req, res) {
        try {
            // Check if user has manager role
            const userRoles = req.user.roles || [];
            // Remove strict check because manager could be determined by jabatan name or DB relation
            // The service getMyTeam will return empty if the user is not a manager of any jabatan.

            const result = await mappingShiftService.getMyTeam(req.user.id);
            return res.status(200).json({ success: true, message: "Data mapping shift tim berhasil diambil", ...result });
        } catch (error) {
            console.error("MappingShiftController.myTeam error:", error);
            return res.status(500).json({ success: false, message: "Gagal mengambil data mapping shift tim", error: error.message });
        }
    }

    async show(req, res) {
        try {
            const data = await mappingShiftService.getById(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Mapping shift tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Data mapping shift berhasil diambil", data });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data mapping shift", error: error.message });
        }
    }
     async showUser(req, res) {
        try {
            console.log("cekdata",req.params.id);
            const data = await mappingShiftService.getWhere({ user_id: BigInt(req.params.id) });
            if (!data || data.length === 0) return res.status(404).json({ success: false, message: "Mapping shift tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Data mapping shift berhasil diambil", data });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data mapping shift", error: error.message });
        }
    }

    async showUserFirst(req, res) {
        try {
            console.log("cekdata",req.params.id);
            const data = await mappingShiftService.getWhereFirst({ user_id: BigInt(req.params.id) });
            if (!data || data.length === 0) return res.status(404).json({ success: false, message: "Mapping shift tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Data mapping shift berhasil diambil", data });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data mapping shift", error: error.message });
        }
    }

    async bulkStore(req, res) {
        try {
            const { user_id, shift_id, start_date, end_date, lock_location } = req.body;

            if (!user_id || !start_date || !end_date) {
                return res.status(400).json({
                    success: false,
                    message: "user_id, start_date, dan end_date wajib diisi"
                });
            }

            const result = await mappingShiftService.bulkCreateRange(req.body);

            // Send notification to admins if this was done by a manager (someone who is not admin)
            if (req.user && req.user.id) {
                try {
                    const managerName = req.user.name;
                    const employee = await prisma.users.findUnique({ where: { id: BigInt(user_id) } });
                    const shift = shift_id ? await prisma.shifts.findUnique({ where: { id: BigInt(shift_id) } }) : null;
                    
                    if (employee) {
                        const shiftName = shift ? shift.nama_shift : "Libur/Kosong";
                        const msg = `Manager ${managerName} telah menambahkan Shift ${shiftName} untuk Karyawan ${employee.name} (${start_date} s/d ${end_date})`;
                        
                        // Get admins
                        const admins = await prisma.users.findMany({
                            where: { OR: [{ is_admin: 'admin' }, { is_admin: 'superadmin' }, { id: 1n }] },
                            select: { id: true }
                        });
                        
                        for (const admin of admins) {
                            if (admin.id.toString() === req.user.id.toString()) continue; 
                            
                            await prisma.notifications.create({
                                data: {
                                    type: 'Mapping Shift',
                                    notifiable_type: 'App\\Models\\User',
                                    notifiable_id: admin.id,
                                    data: JSON.stringify({
                                        message: msg,
                                        user_id: user_id.toString(),
                                        shift_id: shift_id ? shift_id.toString() : null,
                                        action: 'create'
                                    }),
                                    created_at: new Date(),
                                    updated_at: new Date()
                                }
                            });
                        }
                    }
                } catch (notifErr) {
                    console.error("Failed to send notification for Mapping Shift:", notifErr);
                }
            }

            return res.status(201).json({
                success: true,
                message: "Mapping shift berhasil dibuat untuk rentang tanggal tersebut",
                ...result
            });
        } catch (error) {
            console.error("MappingShiftController.bulkStore error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal membuat mapping shift massal",
                error: error.message
            });
        }
    }

    async bulkStoreMatrix(req, res) {
        try {
            const { matrix } = req.body;
            if (!matrix || !Array.isArray(matrix)) {
                return res.status(400).json({ success: false, message: "Data matrix tidak valid" });
            }
            const result = await mappingShiftService.bulkStoreMatrix(matrix);
            return res.status(201).json({
                success: true,
                message: `${result.count} jadwal shift berhasil dipetakan.`,
                ...result
            });
        } catch (error) {
            console.error("MappingShiftController.bulkStoreMatrix error:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal menyimpan jadwal shift matrix",
                error: error.message
            });
        }
    }

    async bulkUpdate(req, res) {
        try {
            const { user_id, start_date, end_date, shift_id, lock_location } = req.body;
            if (!user_id || !start_date || !end_date || !shift_id) {
                return res.status(400).json({ success: false, message: "user_id, start_date, end_date, dan shift_id wajib diisi" });
            }

            const result = await mappingShiftService.bulkUpdateRange(req.body);
            return res.status(200).json({ success: true, message: `${result.count} data mapping shift berhasil diupdate`, ...result });
        } catch (error) {
            console.error("MappingShiftController.bulkUpdate error:", error);
            return res.status(500).json({ success: false, message: "Gagal mengupdate massal mapping shift", error: error.message });
        }
    }

    async bulkDestroy(req, res) {
        try {
            const { user_id, start_date, end_date } = req.body;
            if (!user_id || !start_date || !end_date) {
                return res.status(400).json({ success: false, message: "user_id, start_date, dan end_date wajib diisi" });
            }

            const result = await mappingShiftService.bulkDeleteRange(req.body);
            return res.status(200).json({ success: true, message: `${result.count} data mapping shift berhasil dihapus`, ...result });
        } catch (error) {
            console.error("MappingShiftController.bulkDestroy error:", error);
            return res.status(500).json({ success: false, message: "Gagal menghapus massal mapping shift", error: error.message });
        }
    }
}

export default new MappingShiftController();
