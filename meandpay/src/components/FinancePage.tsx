import React from 'react';
import { motion } from 'motion/react';
import { DollarSign, TrendingUp, TrendingDown, Target, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { cn } from '../lib/utils';

const chartData = [
  { name: 'Jan', revenue: 4000, target: 4500 },
  { name: 'Feb', revenue: 3000, target: 4500 },
  { name: 'Mar', revenue: 5000, target: 4500 },
  { name: 'Apr', revenue: 4500, target: 4500 },
  { name: 'May', revenue: 6000, target: 5000 },
  { name: 'Jun', revenue: 5500, target: 5000 },
];

export function FinancePage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8 pb-20"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Keuangan & Target</h1>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Download Report</button>
          <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95">Set New Target</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <FinanceStatCard label="Monthly Revenue" value="Rp 124.5M" trend="+12.5%" isUp icon={DollarSign} color="text-indigo-600" bg="bg-indigo-50" />
        <FinanceStatCard label="Expenses" value="Rp 42.8M" trend="-2.4%" isUp={false} icon={TrendingDown} color="text-rose-600" bg="bg-rose-50" />
        <FinanceStatCard label="Net Profit" value="Rp 81.7M" trend="+18.2%" isUp icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" />
        <FinanceStatCard label="Target Progress" value="84%" trend="On Track" isUp icon={Target} color="text-amber-600" bg="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Revenue vs Target</h3>
            <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-500 outline-none cursor-pointer">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="target" stroke="#e2e8f0" strokeWidth={2} strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Budget */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Department Budget</h3>
            <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all">
              <PieChart className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-6">
            <BudgetProgress label="IT & Engineering" current={45000000} total={60000000} color="bg-indigo-500" />
            <BudgetProgress label="Marketing" current={28000000} total={35000000} color="bg-emerald-500" />
            <BudgetProgress label="Human Resources" current={12000000} total={15000000} color="bg-amber-500" />
            <BudgetProgress label="Operations" current={35000000} total={40000000} color="bg-rose-500" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FinanceStatCard({ label, value, trend, isUp, icon: Icon, color, bg }: { label: string, value: string, trend: string, isUp: boolean, icon: any, color: string, bg: string }) {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", bg, color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
      </div>
      <div className={cn(
        "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest",
        isUp ? "text-emerald-500" : "text-rose-500"
      )}>
        {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {trend}
      </div>
    </div>
  );
}

function BudgetProgress({ label, current, total, color }: { label: string, current: number, total: number, color: string }) {
  const percentage = (current / total) * 100;
  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <div className="space-y-0.5">
          <p className="text-xs font-black text-slate-800">{label}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatCurrency(current)} / {formatCurrency(total)}</p>
        </div>
        <span className="text-xs font-black text-slate-700">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}
