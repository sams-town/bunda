import React, { useState, useEffect } from 'react';
import { Printer, X } from 'lucide-react';

const formatValue = (val: any) => {
    if (val === undefined || val === null || parseFloat(val) === 0) return '0';
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(parseFloat(val));
};

const terbilang = (num: number): string => {
    const bil = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    if (num < 0) return "Minus " + terbilang(Math.abs(num));
    if (num === 0) return "Nol";

    let temp = "";
    if (num < 12) {
        temp = bil[num];
    } else if (num < 20) {
        temp = bil[num - 10] + " Belas";
    } else if (num < 100) {
        temp = bil[Math.floor(num / 10)] + " Puluh " + bil[num % 10];
    } else if (num < 200) {
        temp = "Seratus " + terbilang(num - 100);
    } else if (num < 1000) {
        temp = bil[Math.floor(num / 100)] + " Ratus " + terbilang(num % 100);
    } else if (num < 2000) {
        temp = "Seribu " + terbilang(num - 1000);
    } else if (num < 1000000) {
        temp = terbilang(Math.floor(num / 1000)) + " Ribu " + terbilang(num % 1000);
    } else if (num < 1000000000) {
        temp = terbilang(Math.floor(num / 1000000)) + " Juta " + terbilang(num % 1000000);
    }
    return temp.trim().replace(/\s+/g, ' ');
};

export default function FinanceSalarySlipPage({ settings }: { settings?: any }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let search = window.location.search;
        if (!search && window.location.hash.includes('?')) {
            search = window.location.hash.substring(window.location.hash.indexOf('?'));
        }
        const params = new URLSearchParams(search);
        const id = params.get('id');

        if (id) {
            const apiUrl = import.meta.env.VITE_API_MEANDPAY || '';
            const token = localStorage.getItem('token');

            fetch(`${apiUrl}/payrolls/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(j => {
                    if (j.success) setData(j.data);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    }, []);

    useEffect(() => {
        if (data) {
            const empName = data.employee?.name || data.user?.name || '';
            document.title = `Slip Gaji - ${data.bulan} ${data.tahun} - ${empName}`;
        }
        return () => {
            document.title = settings?.name ? `HRIS - ${settings.name}` : 'HRIS - MeAndPay';
        };
    }, [data, settings]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Slip Gaji...</p>
            </div>
        </div>
    );

    if (!data) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center space-y-4">
                <X className="w-12 h-12 text-rose-500 mx-auto" />
                <h1 className="text-xl font-black uppercase text-slate-900">DATA TIDAK DITEMUKAN</h1>
                <p className="text-sm text-slate-500">Silahkan hubungi admin atau periksa kembali URL.</p>
            </div>
        </div>
    );

    const u = data.employee || data.user || {};
    const j = u.jabatan || {};

    const netSalaryVal = parseFloat(data.grand_total) || 0;
    const spelledOutSalary = terbilang(netSalaryVal) ? `(${terbilang(netSalaryVal)} Rupiah)` : '(Nol Rupiah)';

    // Date calculations for signature
    const salaryDate = data.created_at ? new Date(data.created_at) : new Date();
    const formattedDateStr = `Bekasi, ${salaryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

    const activePendapatan = [
        { label: 'GAJI POKOK', value: data.gaji_pokok },
        { label: 'TUNJANGAN JABATAN', value: data.total_tunjangan_bpjs_kesehatan },
        { label: 'MASA KERJA', value: data.total_tunjangan_bpjs_ketenagakerjaan },
        { label: 'TRANSPORTASI', value: data.total_tunjangan_transport },
        { label: 'UANG MAKAN', value: data.total_tunjangan_makan },
        { label: 'REWARD KEDISIPLINAN', value: data.total_kehadiran },
        { label: 'JAGA MALAM', value: data.bonus_team },
        { label: 'INSENTIF BPJS', value: data.bonus_pribadi },
        { label: 'LEMBUR', value: data.total_lembur },
        { label: 'INSENTIF PARAMEDIS UMUM', value: data.bonus_jackpot },
        { label: 'INSENTIF TETAP', value: data.insentif_tetap },
        { label: 'JASA TINDAKAN', value: data.total_reimbursement },
        { label: 'LAIN-LAIN', value: data.total_thr },
        { label: 'JASA SIP/SIK/SIB/SIPA', value: data.jasa_sip }
    ];

    const activePotongan = [
        { label: 'CICILAN OBAT ', value: data.bayar_kasbon },
        { label: `OBAT BULAN ${data.bulan ? data.bulan.toUpperCase() : 'INI'}`, value: data.obat_bulan_ini },
        { label: 'BPJS KETENAGAKERJAAN', value: data.total_potongan_bpjs_ketenagakerjaan },
        { label: 'KOPERASI', value: data.potongan_koperasi },
        { label: 'BPJS KESEHATAN', value: data.total_potongan_bpjs_kesehatan },
        { label: 'UANG MAKAN', value: data.total_mangkir },
        { label: 'UANG TRANSPORTASI', value: data.total_izin },
        { label: 'LAIN-LAIN', value: data.total_terlambat }
    ];

    const maxRows = Math.max(activePendapatan.length, activePotongan.length);

    return (
        <div className="bg-[#525659] min-h-screen py-8 px-4 print:py-0 print:px-0 flex flex-col items-center justify-start overflow-y-auto">
            <style>
                {`
                    @media print {
                        body { background: white !important; }
                        .no-print { display: none !important; }
                        .print-content {
                            border: none !important;
                            box-shadow: none !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            width: 210mm !important;
                            height: 297mm !important;
                        }
                    }
                    .excel-grid td, .excel-grid th {
                        border: 1px solid #d1d5db;
                        font-family: 'Arial', sans-serif;
                    }
                    .excel-header {
                        font-family: 'Arial', sans-serif;
                    }
                `}
            </style>

            {/* Controls Bar */}
            <div className="no-print w-full max-w-[850px] mb-4 flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-black tracking-widest uppercase">Slip Gaji Ready</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer">
                        <Printer className="w-4 h-4" />
                        Cetak Slip Gaji
                    </button>
                    <button onClick={() => window.close()} className="bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-slate-300 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer">
                        Tutup
                    </button>
                </div>
            </div>

            {/* Main Excel-like Sheet Slip Canvas */}
            <div className="print-content bg-white w-full max-w-[850px] p-8 border border-slate-300 shadow-2xl text-black excel-header text-sm">

                {/* 1. Header Section */}
                <div className="flex justify-between items-start mb-6">
                    {/* Brand Identity / Left Column info */}
                    <div className="flex items-start gap-4">
                        {/* Elegant Cross Hospital Logo style */}
                        <img
                            src="https://meandpay.hermansyahali07.my.id/uploads/logos/logo-vertical-gradient-color-logo-png---rsthb-2025-1777203365338.png"
                            alt="Logo RS THB"
                            className="w-16 h-16 object-contain shrink-0"
                        />
                        <div>
                            <h1 className="text-base font-extrabold uppercase tracking-tight leading-tight text-slate-900">PT PERMATA BUNDA ABADI</h1>
                            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-800">RS TAMAN HARAPAN BARU</h2>
                            <p className="text-[11px] text-slate-600 leading-normal mt-0.5">
                                Jl. Kaliabang Tengah No. 2 - Bekasi
                                <br />
                                Telp. 021-88981055, hrd.rsthb@gmail.com
                            </p>
                        </div>
                    </div>

                    {/* Right-aligned Title & Month Info */}
                    <div className="text-right">
                        <h2 className="text-2xl font-black uppercase tracking-widest text-slate-900 leading-none">SLIP GAJI</h2>
                        <p className="text-xs font-bold italic text-slate-600 mt-2 capitalize">{data.bulan} {data.tahun}</p>
                    </div>
                </div>

                {/* Divider Line */}
                <div className="border-t-[3px] border-double border-slate-900 my-4" />

                {/* 2. Employee Profile Grid */}
                <div className="grid grid-cols-2 gap-x-16 mb-6 text-xs leading-relaxed">
                    <div className="space-y-1">
                        <div className="flex border-b border-slate-100 py-1">
                            <span className="w-20 font-bold text-slate-700">Nama</span>
                            <span className="font-medium text-slate-900">: {u.name}</span>
                        </div>
                        <div className="flex border-b border-slate-100 py-1">
                            <span className="w-20 font-bold text-slate-700">NIK / NIP</span>
                            <span className="font-medium text-slate-900">: {u.no_pkwt || u.id}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex border-b border-slate-100 py-1">
                            <span className="w-20 font-bold text-slate-700">Unit</span>
                            <span className="font-medium text-slate-900">: {j.nama_jabatan || '—'}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Detailed Financial Grid Table (Twin Side-By-Side Design) */}
                <table className="w-full border-collapse border border-slate-300 text-xs mt-4 excel-grid">
                    <thead>
                        <tr className="bg-slate-50 text-[11px]">
                            <th className="py-2.5 px-3 font-extrabold uppercase text-left w-[38%] border border-slate-300">PENDAPATAN</th>
                            <th className="py-2.5 px-3 font-extrabold uppercase text-right w-[12%] border border-slate-300">NILAI</th>
                            <th className="py-2.5 px-3 font-extrabold uppercase text-left w-[38%] border border-slate-300">POTONGAN</th>
                            <th className="py-2.5 px-3 font-extrabold uppercase text-right w-[12%] border border-slate-300">NILAI</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: maxRows }).map((_, index) => {
                            const pen = activePendapatan[index] || null;
                            const pot = activePotongan[index] || null;
                            return (
                                <tr key={index}>
                                    {pen ? (
                                        <>
                                            <td className="py-1.5 px-3 font-medium border border-slate-300 uppercase">{pen.label}</td>
                                            <td className="py-1.5 px-3 font-bold text-right border border-slate-300">{formatValue(pen.value)}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="py-1.5 px-3 border border-slate-300" />
                                            <td className="py-1.5 px-3 border border-slate-300" />
                                        </>
                                    )}
                                    {pot ? (
                                        <>
                                            <td className="py-1.5 px-3 font-medium border border-slate-300 uppercase">{pot.label}</td>
                                            <td className="py-1.5 px-3 font-bold text-right border border-slate-300">{formatValue(pot.value)}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="py-1.5 px-3 border border-slate-300" />
                                            <td className="py-1.5 px-3 border border-slate-300" />
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                        {/* Totals Row */}
                        <tr className="bg-slate-50 font-black">
                            <td className="py-2.5 px-3 border border-slate-300 uppercase">JUMLAH PENDAPATAN</td>
                            <td className="py-2.5 px-3 text-right border border-slate-300">{formatValue(data.total_penjumlahan)}</td>
                            <td className="py-2.5 px-3 border border-slate-300 uppercase">JUMLAH POTONGAN</td>
                            <td className="py-2.5 px-3 text-right border border-slate-300">{formatValue(data.total_pengurangan)}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Double Border Excel underline */}
                <div className="border-t-[3px] border-double border-slate-900 mt-1 mb-6" />

                {/* 4. Bottom Net Cash & Spelled out words area */}
                <div className="grid grid-cols-12 gap-6 items-start mt-6">
                    {/* Left: Net Pay prominent Box */}
                    <div className="col-span-7 flex flex-col">
                        <div className="flex items-center gap-4">
                            <span className="font-extrabold uppercase text-slate-800 shrink-0 text-sm">GAJI BERSIH</span>
                            <div className="flex-1 bg-[#D9D9D9] border-2 border-slate-900 py-3 px-6 rounded-lg text-left">
                                <span className="text-base font-black text-slate-950 tracking-tight">
                                    Rp. {formatValue(data.grand_total)}
                                </span>
                            </div>
                        </div>
                        {/* Spelled out text */}
                        <p className="text-xs font-bold italic text-slate-900 mt-2 pl-[90px] leading-relaxed">
                            {spelledOutSalary}
                        </p>

                        {/* 5. Left green summary cards for attendance */}
                        <div className="mt-8 space-y-1.5 w-[65%]">
                            <div className="flex justify-between items-center bg-[#A6E1A6] border border-slate-400 py-1.5 px-4 font-bold text-xs">
                                <span>SAKIT</span>
                                <span>-</span>
                            </div>
                            <div className="flex justify-between items-center bg-[#A6E1A6] border border-slate-400 py-1.5 px-4 font-bold text-xs">
                                <span>IZIN</span>
                                <span>{data.jumlah_izin ? `${data.jumlah_izin} Hari` : '-'}</span>
                            </div>
                            <div className="flex justify-between items-center bg-[#A6E1A6] border border-slate-400 py-1.5 px-4 font-bold text-xs">
                                <span>SISA CUTI</span>
                                <span>{u.izin_cuti ? `${u.izin_cuti} Hari` : '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Signature area */}
                    <div className="col-span-5 flex flex-col items-end pr-6">
                        <p className="text-xs font-bold text-slate-800 text-right">{formattedDateStr}</p>

                        <div className="h-28" /> {/* spacing for signature */}

                        <div className="text-center w-64 border-t-2 border-slate-900 pt-1.5">
                            <p className="text-xs font-black text-slate-950 uppercase underline">Endi Hartono, SKM, MKM, NNLP</p>
                            <p className="text-[11px] font-bold text-slate-600 mt-0.5">Manajer SDM</p>
                        </div>
                    </div>
                </div>

                {/* Footer Digital stamp note */}
                <div className="mt-12 text-center border-t border-slate-100 pt-4">
                    <p className="text-[9px] text-slate-400 font-medium italic">
                        Slip Gaji ini di-generate secara otomatis dan sah secara digital berdasarkan data kehadiran & kinerja.
                    </p>
                </div>

            </div>
        </div>
    );
}