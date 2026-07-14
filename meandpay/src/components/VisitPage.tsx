import React from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

interface VisitRecord {
  id: string;
  employeeName: string;
  location: string;
  date: string;
  time: string;
  description: string;
  photo: string;
}

const visitRecords: VisitRecord[] = [
  { id: '1', employeeName: 'Bintang Ridwan Firdaus', location: 'Client Site A', date: '2026-02-24', time: '10:30', description: 'Meeting with potential client for Q2 project', photo: 'https://picsum.photos/seed/visit1/200/300' },
  { id: '2', employeeName: 'Maysaroh', location: 'Exhibition Hall', date: '2026-02-24', time: '14:00', description: 'Booth setup for marketing event', photo: 'https://picsum.photos/seed/visit2/200/300' },
  { id: '3', employeeName: 'Elit Mutamimi Rahman', location: 'Studio X', date: '2026-02-23', time: '09:00', description: 'Content shooting for social media campaign', photo: 'https://picsum.photos/seed/visit3/200/300' }
];

export function VisitPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8 pb-20"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Visit & Kinerja</h1>
          <p className="text-slate-500 font-medium">Track external visits, field work, and employee performance logs.</p>
        </div>
        <button className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95">
          <Plus className="w-5 h-5" />
          Tambah Kunjungan
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search employee or location..." className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
          </div>
          <div className="flex items-center gap-3">
            <button className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-all">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">No.</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Nama Pegawai</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Lokasi Kunjungan</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Tanggal & Waktu</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Keterangan</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Foto Bukti</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right border-b border-slate-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visitRecords.map((item, index) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-6 px-8 text-sm font-black text-slate-300 group-hover:text-slate-900 transition-colors">{(index + 1).toString().padStart(2, '0')}</td>
                  <td className="py-6 px-8">
                    <span className="text-sm font-black text-slate-900">{item.employeeName}</span>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      {item.location}
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <div className="text-sm font-bold text-slate-900">{item.date}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.time}</div>
                  </td>
                  <td className="py-6 px-8 text-sm font-bold text-slate-600 max-w-[250px] truncate">{item.description}</td>
                  <td className="py-6 px-8">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm group/img relative cursor-pointer">
                      <img src={item.photo} alt="" className="w-full h-full object-cover transition-transform group-hover/img:scale-110" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex items-center justify-end gap-2  transition-opacity">
                      <button className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"><ExternalLink className="w-4 h-4" /></button>
                      <button className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
