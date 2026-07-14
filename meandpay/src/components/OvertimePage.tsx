import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AddOvertime } from './AddOvertime';

interface OvertimeRequest {
  id: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  reason: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  approver: string;
}

const overtimeRequests: OvertimeRequest[] = [
  { id: '1', employeeName: 'Dhifan Muhammad', date: '2026-02-24', startTime: '17:00', endTime: '20:00', duration: '3h', reason: 'Finishing monthly report', status: 'Approved', approver: 'Super Admin' },
  { id: '2', employeeName: 'Cut Putri Nurul Husna', date: '2026-02-24', startTime: '17:00', endTime: '19:00', duration: '2h', reason: 'Data entry backlog', status: 'Pending', approver: '-' },
  { id: '3', employeeName: 'Elit Mutamimi Rahman', date: '2026-02-23', startTime: '18:00', endTime: '21:00', duration: '3h', reason: 'Content production', status: 'Approved', approver: 'Super Admin' }
];

export function OvertimePage() {
  const [isAdding, setIsAdding] = React.useState(false);

  if (isAdding) {
    return <AddOvertime onBack={() => setIsAdding(false)} />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8 pb-20"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Lembur (Overtime)</h1>
          <p className="text-slate-500 font-medium">Manage and approve employee overtime requests and compensation.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Tambah Lembur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Overtime Hours" value="45h" icon={Clock} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard title="Pending Approval" value="12" icon={TrendingUp} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="Approved This Month" value="28" icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search employee..." className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
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
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Tanggal</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Waktu</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Durasi</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Alasan</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Status</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right border-b border-slate-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {overtimeRequests.map((item, index) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-6 px-8 text-sm font-black text-slate-300 group-hover:text-slate-900 transition-colors">{(index + 1).toString().padStart(2, '0')}</td>
                  <td className="py-6 px-8">
                    <span className="text-sm font-black text-slate-900">{item.employeeName}</span>
                  </td>
                  <td className="py-6 px-8 text-sm font-bold text-slate-600">{item.date}</td>
                  <td className="py-6 px-8 text-sm font-bold text-slate-600">{item.startTime} - {item.endTime}</td>
                  <td className="py-6 px-8 text-sm font-black text-indigo-600">{item.duration}</td>
                  <td className="py-6 px-8 text-sm font-bold text-slate-600 max-w-[200px] truncate">{item.reason}</td>
                  <td className="py-6 px-8">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      item.status === 'Approved' ? "bg-emerald-50 text-emerald-600" : 
                      item.status === 'Pending' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex items-center justify-end gap-2  transition-opacity">
                      <button className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"><Edit2 className="w-4 h-4" /></button>
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

function StatCard({ title, value, icon: Icon, color, bg }: { title: string, value: string, icon: any, color: string, bg: string }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/30 flex items-center gap-6">
      <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner", bg, color)}>
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
      </div>
    </div>
  );
}
