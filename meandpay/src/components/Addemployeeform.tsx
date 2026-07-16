import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ArrowLeft, Save, X, Camera, User, Mail, Phone, MapPin,
    Lock, Calendar, Clock, Shield, Building2, Briefcase,
    FileText, CreditCard, Heart, Hash, Landmark, TrendingUp,
    Minus, ChevronLeft, ChevronRight, ImageIcon, Loader2, Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
    Card, SectionTitle, FormInput, FormSelect, FormSearchSelect, 
    Field, LeaveCard, SalaryInput, Toast, inputCls 
} from './common/FormUI';

interface AddEmployeeFormProps {
    onBack: () => void;
    onSuccess?: () => void;
    defaultRole?: string;
}

interface EmployeeFormData {
    name: string; email: string; telepon: string; username: string; password: string;
    lokasi_id: string; tgl_lahir: string; tgl_join: string; role: string; gender: string;
    is_admin: string; status_pajak_id: string; jabatan_id: string; alamat: string;
    provinsi: string; kota_kabupaten: string; kecamatan: string; kelurahan: string; kode_pos: string;
    provinsi_domisili: string; kota_kabupaten_domisili: string; kecamatan_domisili: string; kelurahan_domisili: string;
    alamat_domisili: string; kode_pos_domisili: string; nama_ibu_kandung: string;
    darurat_nama: string; darurat_telepon: string; darurat_hubungan: string;
    ktp: string; kartu_keluarga: string; bpjs_kesehatan: string; bpjs_ketenagakerjaan: string;
    npwp: string; sim: string; masa_berlaku: string;
    no_pkwt: string; no_kontrak: string; tanggal_mulai_pkwt: string; tanggal_berakhir_pkwt: string;
    rekening: string; nama_rekening: string;
    izin_cuti: string; izin_lainnya: string; izin_telat: string; izin_pulang_cepat: string;
    cuti_melahirkan: string; cuti_kematian: string;
    gaji_pokok: string; tunjangan_makan: string; tunjangan_transport: string;
    tunjangan_bpjs_kesehatan: string; tunjangan_bpjs_ketenagakerjaan: string;
    lembur: string; kehadiran: string; thr: string;
    bonus_pribadi: string; bonus_team: string; bonus_jackpot: string;
    izin: string; terlambat: string; batas_terlambat: string; mangkir: string; saldo_kasbon: string;
    potongan_bpjs_kesehatan: string; potongan_bpjs_ketenagakerjaan: string; potongan_koperasi: string;
}

const defaultForm: EmployeeFormData = {
    name: '', email: '', telepon: '', username: '', password: '',
    lokasi_id: '', tgl_lahir: '', tgl_join: '', role: '', gender: '',
    is_admin: 'user', status_pajak_id: '', jabatan_id: '', alamat: '',
    provinsi: '', kota_kabupaten: '', kecamatan: '', kelurahan: '', kode_pos: '',
    provinsi_domisili: '', kota_kabupaten_domisili: '', kecamatan_domisili: '', kelurahan_domisili: '',
    alamat_domisili: '', kode_pos_domisili: '', nama_ibu_kandung: '',
    darurat_nama: '', darurat_telepon: '', darurat_hubungan: '',
    ktp: '', kartu_keluarga: '', bpjs_kesehatan: '', bpjs_ketenagakerjaan: '',
    npwp: '', sim: '', masa_berlaku: '',
    no_pkwt: '', no_kontrak: '', tanggal_mulai_pkwt: '', tanggal_berakhir_pkwt: '',
    rekening: '', nama_rekening: '',
    izin_cuti: '12', izin_lainnya: '3', izin_telat: '3', izin_pulang_cepat: '3',
    cuti_melahirkan: '90', cuti_kematian: '3',
    gaji_pokok: '0', tunjangan_makan: '0', tunjangan_transport: '0',
    tunjangan_bpjs_kesehatan: '0', tunjangan_bpjs_ketenagakerjaan: '0',
    lembur: '0', kehadiran: '0', thr: '0',
    bonus_pribadi: '0', bonus_team: '0', bonus_jackpot: '0',
    izin: '0', terlambat: '0', batas_terlambat: '5', mangkir: '0', saldo_kasbon: '0',
    potongan_bpjs_kesehatan: '0', potongan_bpjs_ketenagakerjaan: '0', potongan_koperasi: '0',
};

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

export function AddEmployeeForm({ onBack, onSuccess, defaultRole }: AddEmployeeFormProps) {
    const [master, setMaster] = useState({ lokasi: [], roles: [], jabatan: [], statusPajak: [], loading: true });
    const [form, setForm] = useState<EmployeeFormData>({ ...defaultForm, role: defaultRole || '' });
    
    // Address Selection State
    const [regions, setRegions] = useState({
        provinces: [] as any[],
        regencies: [] as any[],
        districts: [] as any[],
        villages: [] as any[]
    });
    const [selectedRegions, setSelectedRegions] = useState({
        provId: '', kabId: '', kecId: '', kelId: '',
        provName: '', kabName: '', kecName: '', kelName: '',
        detail: '', kode_pos: ''
    });

    const [regionsDom, setRegionsDom] = useState({
        regencies: [] as any[],
        districts: [] as any[],
        villages: [] as any[]
    });
    const [selectedRegionsDom, setSelectedRegionsDom] = useState({
        provId: '', kabId: '', kecId: '', kelId: '',
        provName: '', kabName: '', kecName: '', kelName: '',
        detail: '', kode_pos: ''
    });

    const [photo, setPhoto] = useState<{ preview: string | null; file: File | null }>({ preview: null, file: null });
    const [docs, setDocs] = useState<{ id: string; nama_dokumen: string; file: File | null }[]>([]);
    const [activeSection, setActiveSection] = useState(0);
    const [errors, setErrors] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    const startCamera = async () => {
        setShowCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setToast({ type: 'error', message: 'Gagal mengakses kamera' });
            setShowCamera(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
        setShowCamera(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                
                // Convert dataUrl to File
                const byteString = atob(dataUrl.split(',')[1]);
                const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                const file = new File([ab], 'photo.jpg', { type: mimeString });

                setPhoto({ file, preview: dataUrl });
                stopCamera();
            }
        }
    };

    useEffect(() => {
        const fetchM = (p: string, f: (d: any) => any) => fetch(`${BASE_URL}/${p}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json()).then(j => j.success ? j.data.map(f) : []).catch(() => []);
        Promise.all([
            fetchM('lokasi', l => ({ value: l.id, label: l.nama_lokasi })),
            fetchM('roles', r => ({ value: r.name, label: r.name })),
            fetchM('jabatans', j => ({ value: j.id, label: j.nama_jabatan })),
            fetchM('status-pajak', s => ({ value: s.id, label: s.name })),
        ]).then(([lokasi, roles, jabatan, statusPajak]) => setMaster({ lokasi, roles, jabatan, statusPajak, loading: false }));

        // Initial fetch provinces
        fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
            .then(r => r.json())
            .then(data => setRegions(prev => ({ ...prev, provinces: data.map((p: any) => ({ value: p.id, label: p.name })) })))
            .catch(err => console.error("Province fetch error:", err));
    }, []);

    // region dynamic fetching
    useEffect(() => {
        if (!selectedRegions.provId) return;
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedRegions.provId}.json`)
            .then(r => r.json())
            .then(data => setRegions(p => ({ ...p, regencies: data.map((x: any) => ({ value: x.id, label: x.name })), districts: [], villages: [] })));
    }, [selectedRegions.provId]);

    useEffect(() => {
        if (!selectedRegions.kabId) return;
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedRegions.kabId}.json`)
            .then(r => r.json())
            .then(data => setRegions(p => ({ ...p, districts: data.map((x: any) => ({ value: x.id, label: x.name })), villages: [] })));
    }, [selectedRegions.kabId]);

    useEffect(() => {
        if (!selectedRegions.kecId) return;
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedRegions.kecId}.json`)
            .then(r => r.json())
            .then(data => setRegions(p => ({ ...p, villages: data.map((x: any) => ({ value: x.id, label: x.name })) })));
    }, [selectedRegions.kecId]);

    // domicile regions dynamic fetching
    useEffect(() => {
        if (!selectedRegionsDom.provId) return;
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedRegionsDom.provId}.json`)
            .then(r => r.json())
            .then(data => setRegionsDom(p => ({ ...p, regencies: data.map((x: any) => ({ value: x.id, label: x.name })), districts: [], villages: [] })));
    }, [selectedRegionsDom.provId]);

    useEffect(() => {
        if (!selectedRegionsDom.kabId) return;
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedRegionsDom.kabId}.json`)
            .then(r => r.json())
            .then(data => setRegionsDom(p => ({ ...p, districts: data.map((x: any) => ({ value: x.id, label: x.name })), villages: [] })));
    }, [selectedRegionsDom.kabId]);

    useEffect(() => {
        if (!selectedRegionsDom.kecId) return;
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedRegionsDom.kecId}.json`)
            .then(r => r.json())
            .then(data => setRegionsDom(p => ({ ...p, villages: data.map((x: any) => ({ value: x.id, label: x.name })) })));
    }, [selectedRegionsDom.kecId]);

    // Update form.alamat summary
    useEffect(() => {
        const parts = [
            selectedRegions.detail,
            selectedRegions.kelName ? `Kel. ${selectedRegions.kelName}` : '',
            selectedRegions.kecName ? `Kec. ${selectedRegions.kecName}` : '',
            selectedRegions.kabName,
            selectedRegions.provName,
            selectedRegions.kode_pos
        ].filter(Boolean);
        const summary = parts.join(', ');
        
        setForm(p => ({ 
            ...p, 
            alamat: summary || p.alamat,
            provinsi: selectedRegions.provName || p.provinsi,
            kota_kabupaten: selectedRegions.kabName || p.kota_kabupaten,
            kecamatan: selectedRegions.kecName || p.kecamatan,
            kelurahan: selectedRegions.kelName || p.kelurahan,
            kode_pos: selectedRegions.kode_pos || p.kode_pos
        }));
    }, [selectedRegions]);

    // Update form.alamat_domisili summary
    useEffect(() => {
        const parts = [
            selectedRegionsDom.detail,
            selectedRegionsDom.kelName ? `Kel. ${selectedRegionsDom.kelName}` : '',
            selectedRegionsDom.kecName ? `Kec. ${selectedRegionsDom.kecName}` : '',
            selectedRegionsDom.kabName,
            selectedRegionsDom.provName,
            selectedRegionsDom.kode_pos
        ].filter(Boolean);
        const summary = parts.join(', ');
        
        setForm(p => ({ 
            ...p, 
            alamat_domisili: summary || p.alamat_domisili,
            provinsi_domisili: selectedRegionsDom.provName || p.provinsi_domisili,
            kota_kabupaten_domisili: selectedRegionsDom.kabName || p.kota_kabupaten_domisili,
            kecamatan_domisili: selectedRegionsDom.kecName || p.kecamatan_domisili,
            kelurahan_domisili: selectedRegionsDom.kelName || p.kelurahan_domisili,
            kode_pos_domisili: selectedRegionsDom.kode_pos || p.kode_pos_domisili
        }));
    }, [selectedRegionsDom]);

    const sections = useMemo(() => [
        { label: 'Data Pribadi', icon: User }, { label: 'Informasi Kontak', icon: Phone }, { label: 'Dokumen', icon: FileText },
        { label: 'Kontrak & Rekening', icon: CreditCard }, { label: 'Cuti & Izin', icon: Calendar }, { label: 'Penjumlahan Gaji', icon: TrendingUp }, { label: 'Pengurangan Gaji', icon: Minus }
    ], []);

    const handleChange = (n: string, v: string) => {
        setForm(p => ({ ...p, [n]: v }));
        if (errors[n]) setErrors((p: any) => { const e = { ...p }; delete e[n]; return e; });
    };

    const renderSalary = (name: string, isDeduction = false) => {
        let label = name.replace(/_/g,' ');
        if (name === 'saldo_kasbon') label = 'kasbon obat';
        return (
            <SalaryInput 
                key={name} label={label} name={name} 
                period="/ Unit"
                value={(form as any)[name]} onChange={handleChange} 
                isDeduction={isDeduction} hideRp={name === 'batas_terlambat'} 
                required
            />
        );
    };

    const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            const r = new FileReader();
            r.onloadend = () => setPhoto({ file: f, preview: r.result as string });
            r.readAsDataURL(f);
        }
    };

    const handleSubmit = async () => {
        const e: any = {};
        if (!form.name.trim()) e.name = 'Wajib';
        if (!form.username.trim()) e.username = 'Wajib';
        if (!form.password.trim()) e.password = 'Wajib';
        if (!form.role) e.role = 'Wajib';
        if (Object.keys(e).length > 0) { setErrors(e); setActiveSection(0); return setToast({ type: 'error', message: 'Harap lengkapi form' }); }

        setLoading(true);
        try {
            const payload: any = { ...form, roles: [form.role] }; delete payload.role;
            let body: any, headers: any = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
            if (photo.file) {
                body = new FormData(); body.append('foto_karyawan', photo.file);
                Object.entries(payload).forEach(([k, v]: any) => Array.isArray(v) ? v.forEach(i => body.append(`${k}[]`, i)) : body.append(k, String(v)));
            } else { body = JSON.stringify(payload); headers['Content-Type'] = 'application/json'; }

            const res = await fetch(`${BASE_URL}/users`, { method: 'POST', headers, body });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message);

            const vDocs = docs.filter(d => d.nama_dokumen.trim() && d.file);
            if (vDocs.length > 0) {
                let uid = json.data?.id;
                if (!uid) { /* Fallback find uid by username */ }
                if (uid) await Promise.all(vDocs.map(async d => {
                    const fd = new FormData(); 
                    fd.append('user_id', String(uid)); 
                    fd.append('nama_dokumen', d.nama_dokumen); 
                    fd.append('tanggal_upload', new Date().toISOString().split('T')[0]);
                    fd.append('file', d.file!);
                    const resDoc = await fetch(`${BASE_URL}/documents`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: fd });
                    if (!resDoc.ok) {
                        const js = await resDoc.json().catch(() => ({}));
                        throw new Error(js.message || `Gagal mengunggah dokumen ${d.nama_dokumen}`);
                    }
                }));
            }
            setToast({ type: 'success', message: 'Berhasil!' }); setTimeout(() => { onSuccess?.(); onBack(); }, 1500);
        } catch (err: any) { setToast({ type: 'error', message: err.message }); } finally { setLoading(false); }
    };

    return (
        <>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto pb-20 space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3"><button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl border bg-white shadow-sm hover:text-indigo-600"><ArrowLeft size={16}/></button><div><h1 className="text-xl font-bold">Tambah Pegawai</h1><p className="text-sm text-slate-400">Data lengkap pegawai baru</p></div></div>
                    <div className="flex gap-2"><button onClick={onBack} className="px-4 py-2 bg-white border rounded-xl font-semibold"><X size={16}/></button><button onClick={handleSubmit} disabled={loading} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2">{loading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Simpan</button></div>
                </div>

                <div className="bg-white rounded-2xl border p-1.5 flex flex-wrap gap-1">
                    {sections.map(({ label, icon: Icon }, i) => (
                        <button key={i} onClick={() => setActiveSection(i)} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all", activeSection === i ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50")}>
                            <Icon size={14}/> {label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={activeSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                        {activeSection === 0 && <>
                            <Card>
                                <SectionTitle icon={Camera} title="Foto" color="text-violet-600" bg="bg-violet-50" />
                                <div className="flex items-center gap-6">
                                    <div className="relative group size-24 border-2 border-dashed rounded-2xl flex items-center justify-center overflow-hidden">
                                        {photo.preview ? <img src={photo.preview} className="size-full object-cover" /> : <ImageIcon className="text-slate-300" />}
                                        <input type="file" accept="image/*" onChange={handlePhoto} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                    <div className="space-y-1">
                                        <button onClick={startCamera} className="px-4 py-2 bg-violet-50 text-violet-600 rounded-xl text-xs font-bold flex items-center gap-2 border border-violet-100 hover:bg-violet-100 transition-colors">
                                            <Camera size={14}/> Ambil dari Kamera
                                        </button>
                                        <p className="text-xs text-slate-400">Atau klik kotak untuk pilih file (Max 2MB)</p>
                                    </div>
                                </div>
                            </Card>
                            <Card>
                                <SectionTitle icon={User} title="Data Pribadi" />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput label="Nama" name="name" icon={User} value={form.name} onChange={handleChange} error={errors.name} required />
                                    <FormInput label="Email" name="email" type="email" icon={Mail} value={form.email} onChange={handleChange} required />
                                    <FormInput label="HP" name="telepon" icon={Phone} value={form.telepon} onChange={handleChange} required />
                                    <FormInput label="Username" name="username" icon={User} value={form.username} onChange={handleChange} error={errors.username} required />
                                    <FormInput label="Password" name="password" type="password" icon={Lock} value={form.password} onChange={handleChange} error={errors.password} required />
                                    <FormSelect label="Lokasi" name="lokasi_id" options={master.lokasi} value={form.lokasi_id} onChange={handleChange} icon={MapPin} required />
                                    <FormInput label="Tgl Lahir" name="tgl_lahir" type="date" value={form.tgl_lahir} onChange={handleChange} icon={Calendar} required />
                                    <FormSelect label="Jenis Kelamin" name="gender" options={['Laki-laki', 'Perempuan', 'Lain-lain']} value={form.gender} onChange={handleChange} icon={User} required />
                                    <FormInput label="Tgl Masuk" name="tgl_join" type="date" value={form.tgl_join} onChange={handleChange} icon={Calendar} required />
                                    <Field label="Masa Kerja"><input type="text" disabled value={form.tgl_join ? `${Math.floor((new Date().getTime() - new Date(form.tgl_join).getTime())/86400000)} hari` : ''} className={inputCls(false,true)} /></Field>
                                     <FormSearchSelect 
                                         label="Role" 
                                         name="role" 
                                         placeholder="Pilih Role" 
                                         options={defaultRole === 'dokter' ? [{ value: 'dokter', label: 'dokter' }] : master.roles.filter((r: any) => r.value !== 'dokter')} 
                                         value={form.role} 
                                         onChange={handleChange} 
                                         icon={Shield} 
                                         error={errors.role} 
                                         disabled={defaultRole === 'dokter'}
                                         required 
                                     />
                                    <FormSearchSelect label="Divisi" name="jabatan_id" placeholder="Pilih Divisi" options={master.jabatan} value={form.jabatan_id} onChange={handleChange} icon={Briefcase} required />
                                    <FormSelect label="Is Admin" name="is_admin" options={['admin', 'user']} value={form.is_admin} onChange={handleChange} icon={Shield} required />
                                    <FormInput label="Nama Ibu Kandung" name="nama_ibu_kandung" icon={User} value={form.nama_ibu_kandung} onChange={handleChange} required />
                                    <FormSearchSelect 
                                        label="Status Pajak" 
                                        name="status_pajak_id" 
                                        placeholder="Pilih Status Pajak" 
                                        options={master.statusPajak} 
                                        value={form.status_pajak_id} 
                                        onChange={handleChange} 
                                        icon={FileText} 
                                        required 
                                    />
                                </div>
                            </Card>
                            <Card>
                                <SectionTitle icon={MapPin} title="Alamat" />
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormSearchSelect 
                                            label="Provinsi" 
                                            name="prov_id"
                                            placeholder="Pilih Provinsi"
                                            options={regions.provinces}
                                            value={selectedRegions.provId}
                                            required
                                            onChange={(_: any, val: string) => {
                                                const name = regions.provinces.find(p => p.value === val)?.label || '';
                                                setSelectedRegions(p => ({ ...p, provId: val, provName: name, kabId: '', kabName: '', kecId: '', kecName: '', kelId: '', kelName: '' }));
                                            }}
                                        />
                                        <FormSearchSelect 
                                            label="Kota / Kabupaten" 
                                            name="kab_id"
                                            placeholder="Pilih Kota/Kab"
                                            options={regions.regencies}
                                            value={selectedRegions.kabId}
                                            disabled={!selectedRegions.provId}
                                            required
                                            onChange={(_: any, val: string) => {
                                                const name = regions.regencies.find(p => p.value === val)?.label || '';
                                                setSelectedRegions(p => ({ ...p, kabId: val, kabName: name, kecId: '', kecName: '', kelId: '', kelName: '' }));
                                            }}
                                        />
                                        <FormSearchSelect 
                                            label="Kecamatan" 
                                            name="kec_id"
                                            placeholder="Pilih Kecamatan"
                                            options={regions.districts}
                                            value={selectedRegions.kecId}
                                            disabled={!selectedRegions.kabId}
                                            required
                                            onChange={(_: any, val: string) => {
                                                const name = regions.districts.find(p => p.value === val)?.label || '';
                                                setSelectedRegions(p => ({ ...p, kecId: val, kecName: name, kelId: '', kelName: '' }));
                                            }}
                                        />
                                        <FormSearchSelect 
                                            label="Kelurahan" 
                                            name="kel_id"
                                            placeholder="Pilih Kelurahan"
                                            options={regions.villages}
                                            value={selectedRegions.kelId}
                                            disabled={!selectedRegions.kecId}
                                            required
                                            onChange={(_: any, val: string) => {
                                                const name = regions.villages.find(p => p.value === val)?.label || '';
                                                setSelectedRegions(p => ({ ...p, kelId: val, kelName: name }));
                                            }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detail Jalan / No Rumah</label>
                                            <input 
                                                type="text"
                                                value={selectedRegions.detail} 
                                                onChange={(e: any) => setSelectedRegions(p => ({ ...p, detail: e.target.value }))} 
                                                placeholder="Jl. Raya No. 123..." 
                                                className={inputCls(false)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kode Pos</label>
                                            <input 
                                                type="text"
                                                value={selectedRegions.kode_pos} 
                                                onChange={(e: any) => setSelectedRegions(p => ({ ...p, kode_pos: e.target.value }))} 
                                                placeholder="12345" 
                                                className={inputCls(false)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kesimpulan Alamat (Otomatis)</label>
                                        <textarea 
                                            rows={3} 
                                            value={form.alamat} 
                                            onChange={e => handleChange('alamat', e.target.value)} 
                                            className="w-full p-4 border rounded-xl bg-slate-50 outline-none focus:border-indigo-400 text-sm font-bold text-slate-700" 
                                            placeholder="Alamat akan terisi otomatis..."
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <SectionTitle icon={MapPin} title="Alamat Domisili" />
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormSearchSelect 
                                            label="Provinsi" 
                                            name="prov_dom_id"
                                            placeholder="Pilih Provinsi"
                                            options={regions.provinces}
                                            value={selectedRegionsDom.provId}
                                            required
                                            onChange={(_: any, val: string) => {
                                                const name = regions.provinces.find(p => p.value === val)?.label || '';
                                                setSelectedRegionsDom(p => ({ ...p, provId: val, provName: name, kabId: '', kabName: '', kecId: '', kecName: '', kelId: '', kelName: '' }));
                                            }}
                                        />
                                        <FormSearchSelect 
                                            label="Kota / Kabupaten" 
                                            name="kab_dom_id"
                                            placeholder="Pilih Kota/Kab"
                                            options={regionsDom.regencies}
                                            value={selectedRegionsDom.kabId}
                                            disabled={!selectedRegionsDom.provId}
                                            required
                                            onChange={(_: any, val: string) => {
                                                const name = regionsDom.regencies.find(p => p.value === val)?.label || '';
                                                setSelectedRegionsDom(p => ({ ...p, kabId: val, kabName: name, kecId: '', kecName: '', kelId: '', kelName: '' }));
                                            }}
                                        />
                                        <FormSearchSelect 
                                            label="Kecamatan" 
                                            name="kec_dom_id"
                                            placeholder="Pilih Kecamatan"
                                            options={regionsDom.districts}
                                            value={selectedRegionsDom.kecId}
                                            disabled={!selectedRegionsDom.kabId}
                                            required
                                            onChange={(_: any, val: string) => {
                                                const name = regionsDom.districts.find(p => p.value === val)?.label || '';
                                                setSelectedRegionsDom(p => ({ ...p, kecId: val, kecName: name, kelId: '', kelName: '' }));
                                            }}
                                        />
                                        <FormSearchSelect 
                                            label="Kelurahan" 
                                            name="kel_dom_id"
                                            placeholder="Pilih Kelurahan"
                                            options={regionsDom.villages}
                                            value={selectedRegionsDom.kelId}
                                            disabled={!selectedRegionsDom.kecId}
                                            required
                                            onChange={(_: any, val: string) => {
                                                const name = regionsDom.villages.find(p => p.value === val)?.label || '';
                                                setSelectedRegionsDom(p => ({ ...p, kelId: val, kelName: name }));
                                            }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detail Jalan / No Rumah</label>
                                            <input 
                                                type="text"
                                                value={selectedRegionsDom.detail} 
                                                onChange={(e: any) => setSelectedRegionsDom(p => ({ ...p, detail: e.target.value }))} 
                                                placeholder="Jl. Raya No. 123..." 
                                                className={inputCls(false)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kode Pos</label>
                                            <input 
                                                type="text"
                                                value={selectedRegionsDom.kode_pos} 
                                                onChange={(e: any) => setSelectedRegionsDom(p => ({ ...p, kode_pos: e.target.value }))} 
                                                placeholder="12345" 
                                                className={inputCls(false)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kesimpulan Alamat (Otomatis)</label>
                                        <textarea 
                                            rows={3} 
                                            value={form.alamat_domisili} 
                                            onChange={e => handleChange('alamat_domisili', e.target.value)} 
                                            className="w-full p-4 border rounded-xl bg-slate-50 outline-none focus:border-indigo-400 text-sm font-bold text-slate-700" 
                                            placeholder="Alamat akan terisi otomatis..."
                                        />
                                    </div>
                                </div>
                            </Card>
                        </>}

                        {activeSection === 1 && <Card>
                            <SectionTitle icon={Phone} title="Kontak Darurat" color="text-rose-600" bg="bg-rose-50" />
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput label="Nama" name="darurat_nama" icon={User} value={form.darurat_nama} onChange={handleChange} required />
                                <FormInput label="HP" name="darurat_telepon" icon={Phone} value={form.darurat_telepon} onChange={handleChange} required />
                                <FormSelect label="Hubungan" name="darurat_hubungan" options={['Istri', 'Suami', 'Anak', 'Saudara']} value={form.darurat_hubungan} onChange={handleChange} icon={Heart} required />
                            </div>
                        </Card>}

                        {activeSection === 2 && <Card>
                            <SectionTitle icon={FileText} title="Dokumen Identitas" color="text-amber-600" bg="bg-amber-50" />
                            <div className="grid grid-cols-2 gap-4">{['ktp', 'kartu_keluarga', 'bpjs_kesehatan', 'bpjs_ketenagakerjaan', 'npwp', 'sim'].map(k => <FormInput key={k} label={k.toUpperCase()} name={k} value={(form as any)[k]} onChange={handleChange} icon={CreditCard} required />)}</div>
                            <div className="border-t pt-6 mt-6 space-y-4">
                                <button onClick={() => setDocs([...docs, { id: Math.random().toString(), nama_dokumen: '', file: null }])} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold w-max hover:bg-indigo-100 transition-colors">+ Tambah Baru</button>
                                {docs.map(doc => {
                                    const isImage = doc.file?.type.startsWith('image/');
                                    const previewUrl = doc.file && isImage ? URL.createObjectURL(doc.file) : null;
                                    return (
                                        <div key={doc.id} className="flex flex-col gap-4 p-4 bg-slate-50 rounded-xl border">
                                            <div className="flex gap-4 items-start">
                                                <div className="flex-1 space-y-3">
                                                    <FormInput value={doc.nama_dokumen} onChange={(_:any,v:string)=>setDocs(docs.map(x=>x.id===doc.id?{...x,nama_dokumen:v}:x))} placeholder="Nama File (KTP, SIM, dll)" />
                                                    <input type="file" onChange={e=>setDocs(docs.map(x=>x.id===doc.id?{...x,file:e.target.files?.[0]||null}:x))} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 cursor-pointer" />
                                                </div>
                                                <button onClick={()=>setDocs(docs.filter(x=>x.id!==doc.id))} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={20}/></button>
                                            </div>
                                            {previewUrl && <img src={previewUrl} className="h-40 w-auto object-contain rounded-lg border bg-white shadow-sm self-start" alt="Preview" />}
                                        </div>
                                    )
                                })}
                            </div>
                        </Card>}

                        {activeSection === 3 && <>
                            <Card>
                                <SectionTitle icon={FileText} title="Kontrak Kerja" color="text-fuchsia-600" bg="bg-fuchsia-50" />
                                <div className="grid grid-cols-2 gap-4">
                                     <FormInput label="NIP" name="no_pkwt" icon={FileText} value={form.no_pkwt} onChange={handleChange} required />
                                     <FormInput label="No Kontrak" name="no_kontrak" icon={FileText} value={form.no_kontrak} onChange={handleChange} required />
                                     <FormInput label="Tgl Mulai Kontrak" name="tanggal_mulai_pkwt" type="date" icon={Calendar} value={form.tanggal_mulai_pkwt} onChange={handleChange} required />
                                     <FormInput label="Tgl Berakhir Kontrak" name="tanggal_berakhir_pkwt" type="date" icon={Calendar} value={form.tanggal_berakhir_pkwt} onChange={handleChange} required />
                                </div>
                            </Card>
                            <Card>
                                <SectionTitle icon={Landmark} title="Informasi Rekening" color="text-cyan-600" bg="bg-cyan-50" />
                                <div className="grid grid-cols-2 gap-4">
                                     <FormInput label="No Rekening" name="rekening" icon={Hash} value={form.rekening} onChange={handleChange} required />
                                     <FormInput label="Nama Rekening" name="nama_rekening" icon={User} value={form.nama_rekening} onChange={handleChange} required />
                                </div>
                            </Card>
                        </>}

                        {activeSection === 4 && <Card>
                            <SectionTitle icon={Calendar} title="Cuti & Izin" color="text-teal-600" bg="bg-teal-50" />
                            <div className="grid grid-cols-2 gap-4">
                                 <FormInput label="Cuti" name="izin_cuti" type="number" value={form.izin_cuti} onChange={handleChange} required />
                                 <FormInput label="Izin Masuk" name="izin_lainnya" type="number" value={form.izin_lainnya} onChange={handleChange} required />
                                 <FormInput label="Izin Telat" name="izin_telat" type="number" value={form.izin_telat} onChange={handleChange} required />
                                 <FormInput label="Izin Pulang Cepat" name="izin_pulang_cepat" type="number" value={form.izin_pulang_cepat} onChange={handleChange} required />
                                 <FormInput label="Cuti Melahirkan" name="cuti_melahirkan" type="number" value={form.cuti_melahirkan} onChange={handleChange} required />
                                 <FormInput label="Cuti Kematian" name="cuti_kematian" type="number" value={form.cuti_kematian} onChange={handleChange} required />
                            </div>
                        </Card>}

                        {activeSection === 5 && <Card>
                            <SectionTitle icon={TrendingUp} title="Gaji" color="text-emerald-600" bg="bg-emerald-50" />
                            <div className="grid grid-cols-3 gap-3">
                                {['gaji_pokok', 'tunjangan_makan', 'tunjangan_transport', 'lembur', 'kehadiran', 'thr'].map(n => renderSalary(n))}
                            </div>
                        </Card>}

                        {activeSection === 6 && <Card>
                            <SectionTitle icon={Minus} title="Potongan" color="text-rose-600" bg="bg-rose-50" />
                            <div className="grid grid-cols-3 gap-3">
                                {['terlambat', 'batas_terlambat', 'mangkir', 'saldo_kasbon', 'potongan_bpjs_kesehatan', 'potongan_koperasi'].map(n => renderSalary(n, true))}
                            </div>
                        </Card>}
                    </motion.div>
                </AnimatePresence>

                <div className="flex justify-between p-4 bg-white border rounded-2xl shadow-sm">
                    <button onClick={() => setActiveSection(Math.max(0, activeSection - 1))} className="px-4 py-2 bg-slate-50 rounded-xl"><ChevronLeft/></button>
                    <div className="flex gap-1.5 items-center">{sections.map((_, i) => <div key={i} className={cn("h-1.5 rounded-full", activeSection === i ? "w-6 bg-indigo-600" : "w-1.5 bg-slate-200")} />)}</div>
                    <button onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))} className="px-4 py-2 bg-slate-50 rounded-xl"><ChevronRight/></button>
                </div>
            </motion.div>
            <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>

            <AnimatePresence>
                {showCamera && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl relative">
                            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold flex items-center gap-2"><Camera size={18}/>Ambil Foto</h3>
                                <button onClick={stopCamera} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
                            </div>
                            
                            <div className="aspect-square bg-slate-900 relative flex items-center justify-center overflow-hidden">
                                <video ref={videoRef} autoPlay playsInline className="size-full object-cover transform -scale-x-100" />
                                <canvas ref={canvasRef} className="hidden" />
                                
                                <div className="absolute inset-0 pointer-events-none border-[40px] border-black/20 flex items-center justify-center">
                                    <div className="size-full border-2 border-dashed border-white/50 rounded-2xl" />
                                </div>
                            </div>

                            <div className="p-8 flex flex-col items-center gap-4 bg-slate-50">
                                <button onClick={capturePhoto} className="group relative">
                                    <div className="size-20 rounded-full border-4 border-indigo-600 flex items-center justify-center p-1 group-active:scale-95 transition-all">
                                        <div className="size-full bg-indigo-600 rounded-full flex items-center justify-center text-white">
                                            <Camera size={32}/>
                                        </div>
                                    </div>
                                </button>
                                <p className="text-sm font-medium text-slate-500">Posisikan wajah di dalam kotak</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}