import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, Stethoscope, Database, UserX, Calendar as CalendarIcon, 
  Activity, Clock, UserPlus, FileSignature, CreditCard, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface PremiumDashboardProps {
  dashboardStats: any;
  calendarDate: Date;
  setCalendarDate: (d: Date) => void;
  calendarView: 'month' | 'week' | 'day' | 'list';
  setCalendarView: (v: 'month' | 'week' | 'day' | 'list') => void;
}

export function PremiumDashboard({
  dashboardStats, calendarDate, setCalendarDate, calendarView, setCalendarView
}: PremiumDashboardProps) {

  const navigate = useNavigate();

  // --- STAT CARDS ---
  function PremiumStatCard({ title, value, trend, icon: Icon, color, bg, border }: any) {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        className="relative bg-white h-[170px] p-6 rounded-[24px] border border-[#E2E8F0] shadow-[0_12px_40px_rgba(15,23,42,0.04)] hover:shadow-[0_18px_50px_rgba(15,23,42,0.12)] transition-all flex flex-col justify-between overflow-hidden group shrink-0 w-[280px] snap-start"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white to-transparent opacity-50 pointer-events-none" />
        
        <div className="flex justify-between items-start z-10">
           <div className={cn("w-12 h-12 rounded-[16px] flex items-center justify-center transition-transform group-hover:scale-110", bg, color)}>
              <Icon className="w-6 h-6 stroke-[2.5]" />
           </div>
           {trend && (
             <div className={cn("px-2.5 py-1 rounded-full text-[11px] font-bold border", border, color, bg)}>
                {trend}
             </div>
           )}
        </div>

        <div className="z-10 mt-4">
           <h3 className="text-3xl font-extrabold text-[#0F172A] tracking-tight mb-1">{value}</h3>
           <p className="text-[13px] font-bold text-[#64748B]">{title}</p>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-10 opacity-20 pointer-events-none">
           <svg viewBox="0 0 100 20" preserveAspectRatio="none" className={cn("w-full h-full", color)}>
              <path d="M0,20 L10,15 L20,18 L30,5 L40,12 L50,2 L60,10 L70,8 L80,18 L90,10 L100,0 L100,20 Z" fill="currentColor" opacity="0.1" />
              <path d="M0,20 L10,15 L20,18 L30,5 L40,12 L50,2 L60,10 L70,8 L80,18 L90,10 L100,0" fill="none" stroke="currentColor" strokeWidth="1.5" />
           </svg>
        </div>
      </motion.div>
    );
  }

  const att = dashboardStats?.attendance || {};
  const present = att.masuk || 0;
  const late = att.izin_telat || 0;
  const leave = (att.cuti || 0) + (att.izin || 0) + (att.sakit || 0);
  const absent = att.alfa || 0;
  const totalAtt = present + late + leave + absent;
  
  const presentPct = totalAtt > 0 ? Math.round((present / totalAtt) * 100) : 0;
  const latePct = totalAtt > 0 ? Math.round((late / totalAtt) * 100) : 0;
  const leavePct = totalAtt > 0 ? Math.round((leave / totalAtt) * 100) : 0;
  const absentPct = totalAtt > 0 ? Math.round((absent / totalAtt) * 100) : 0;

  const statCards = [
    <PremiumStatCard key="staff" title="Total Employees" value={dashboardStats?.total_pegawai || '0'} icon={Users} color="text-[#34959E]" bg="bg-[#34959E]/10" border="border-[#34959E]/20" />,
    <PremiumStatCard key="dokter" title="Total Doctors" value={dashboardStats?.total_dokter || '0'} icon={Stethoscope} color="text-[#2F7F87]" bg="bg-[#2F7F87]/10" border="border-[#2F7F87]/20" />,
    <PremiumStatCard key="masuk" title="Present Today" value={present} trend={presentPct + "% Rate"} icon={Database} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-200" />,
    <PremiumStatCard key="cuti" title="On Leave" value={leave} trend={leavePct + "%"} icon={CalendarIcon} color="text-[#FB9917]" bg="bg-[#FB9917]/10" border="border-[#FB9917]/20" />,
    <PremiumStatCard key="alfa" title="Absent" value={absent} trend={absentPct + "%"} icon={UserX} color="text-[#990000]" bg="bg-[#990000]/10" border="border-[#990000]/20" />
  ];

  // --- QUICK ACTIONS ---
  const quickActions = [
    { icon: UserPlus, label: "Add Employee", path: '/employees', color: "text-[#34959E]", bg: "bg-[#34959E]/10" },
    { icon: FileSignature, label: "Approve Leave", path: '/leave', color: "text-[#FB9917]", bg: "bg-[#FB9917]/10" },
    { icon: CalendarIcon, label: "Shift Schedule", path: '/shift', color: "text-[#2F7F87]", bg: "bg-[#2F7F87]/10" },
    { icon: CreditCard, label: "Process Payroll", path: '/finance-payroll', color: "text-[#990000]", bg: "bg-[#990000]/10" }
  ];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-32 relative bg-[#F8FAFC]">
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-[#EEF6F7]/50 to-transparent pointer-events-none" />
      <div className="absolute top-20 right-10 w-[600px] h-[600px] bg-[#34959E]/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute top-40 left-10 w-[500px] h-[500px] bg-[#FB9917]/5 rounded-full filter blur-[100px] pointer-events-none" />
      
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden flex items-center justify-center">
         <Activity className="w-[1000px] h-[1000px] text-[#34959E]" strokeWidth={0.5} />
      </div>

      <div className="relative z-10 p-8 space-y-12 max-w-7xl mx-auto">
         
         <section>
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-lg font-bold text-[#0F172A]">Hospital Overview</h2>
               <button onClick={() => navigate('/data-attendance')} className="text-[13px] font-bold text-[#34959E] hover:text-[#2F7F87]">View Full Report &rarr;</button>
            </div>
            <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-6 snap-x px-2 -mx-2">
               {statCards}
            </div>
         </section>

         <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white p-8 rounded-[24px] border border-[#E2E8F0] shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
               <h2 className="text-lg font-bold text-[#0F172A] mb-6">Quick Actions</h2>
               <div className="grid grid-cols-2 gap-4">
                  {quickActions.map((action, i) => (
                     <motion.button
                        key={i}
                        onClick={() => navigate(action.path)}
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex flex-col items-center justify-center p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[20px] hover:border-[#34959E]/30 hover:bg-white transition-all group"
                     >
                        <div className={cn("w-12 h-12 rounded-[14px] flex items-center justify-center mb-3 transition-colors", action.bg, action.color, "group-hover:bg-[#34959E] group-hover:text-white")}>
                           <action.icon className="w-5 h-5" />
                        </div>
                        <span className="text-[12px] font-bold text-[#475569] group-hover:text-[#0F172A] text-center leading-tight">{action.label}</span>
                     </motion.button>
                  ))}
               </div>
            </div>

            <div className="lg:col-span-2 bg-white p-8 rounded-[24px] border border-[#E2E8F0] shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-bold text-[#0F172A]">Weekly Attendance Summary</h2>
                  <div className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[12px] font-bold text-[#475569] flex items-center gap-2 cursor-pointer">
                     This Week <ChevronDown className="w-3 h-3" />
                  </div>
               </div>

               <div className="flex flex-col h-[220px] justify-between">
                  <div className="flex items-end gap-2 h-[120px] mb-6 border-b border-[#E2E8F0] pb-2">
                     {[presentPct, latePct, leavePct, absentPct, Math.max(50, presentPct), Math.min(100, presentPct + 10), presentPct].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                           <motion.div 
                             initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.5, delay: i*0.1 }}
                             className="w-full max-w-[32px] bg-[#34959E]/20 hover:bg-[#34959E] rounded-t-[8px] transition-colors cursor-pointer"
                           />
                           <span className="text-[10px] font-bold text-[#64748B] mt-2 group-hover:text-[#0F172A]">
                              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}
                           </span>
                        </div>
                     ))}
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                     <div>
                        <p className="text-[11px] font-bold text-[#64748B] uppercase mb-1">Present</p>
                        <p className="text-xl font-extrabold text-[#0F172A]">{presentPct}%</p>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2"><div style={{width: `${presentPct}%`}} className="h-full bg-[#34959E] rounded-full"></div></div>
                     </div>
                     <div>
                        <p className="text-[11px] font-bold text-[#64748B] uppercase mb-1">Late</p>
                        <p className="text-xl font-extrabold text-[#0F172A]">{latePct}%</p>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2"><div style={{width: `${latePct}%`}} className="h-full bg-[#FB9917] rounded-full"></div></div>
                     </div>
                     <div>
                        <p className="text-[11px] font-bold text-[#64748B] uppercase mb-1">Leave</p>
                        <p className="text-xl font-extrabold text-[#0F172A]">{leavePct}%</p>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2"><div style={{width: `${leavePct}%`}} className="h-full bg-[#2F7F87] rounded-full"></div></div>
                     </div>
                     <div>
                        <p className="text-[11px] font-bold text-[#64748B] uppercase mb-1">Absent</p>
                        <p className="text-xl font-extrabold text-[#0F172A]">{absentPct}%</p>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2"><div style={{width: `${absentPct}%`}} className="h-full bg-[#990000] rounded-full"></div></div>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         <section>
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-[0_12px_40px_rgba(15,23,42,0.04)] overflow-hidden"
            >
               <div className="p-8 border-b border-[#E2E8F0] flex flex-col md:flex-row items-center justify-between gap-6 bg-[#F8FAFC]/50">
                  <div className="flex items-center gap-4">
                     <div className="flex bg-white p-1 rounded-[16px] border border-[#E2E8F0] shadow-sm">
                        <button onClick={() => { const d = new Date(calendarDate); d.setMonth(d.getMonth()-1); setCalendarDate(d); }} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5 text-[#64748B]" /></button>
                        <button onClick={() => { const d = new Date(calendarDate); d.setMonth(d.getMonth()+1); setCalendarDate(d); }} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronRight className="w-5 h-5 text-[#64748B]" /></button>
                     </div>
                     <button onClick={() => setCalendarDate(new Date())} className="px-5 py-2.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] rounded-[16px] text-[13px] font-bold shadow-sm transition-all active:scale-95">Today</button>
                  </div>
                  
                  <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                     {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(calendarDate)}
                  </h2>

                  <div className="flex bg-[#F8FAFC] p-1 rounded-[16px] border border-[#E2E8F0]">
                     {['month','week','day','list'].map(v => (
                        <button 
                          key={v} 
                          onClick={() => setCalendarView(v as any)} 
                          className={cn("px-5 py-2 text-[12px] font-bold capitalize rounded-[12px] transition-all", calendarView === v ? "bg-white text-[#34959E] shadow-sm border border-[#E2E8F0]" : "text-[#64748B] hover:text-[#0F172A]")}
                        >{v}</button>
                     ))}
                  </div>
               </div>

               <div className="p-0 overflow-x-auto">
                  <table className="w-full min-w-[1000px] border-collapse">
                     <thead>
                        <tr>
                           {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                              <th key={d} className="py-6 px-4 text-[12px] font-bold text-[#64748B] text-center border-b border-[#E2E8F0] bg-[#F8FAFC]/50 uppercase tracking-widest">{d}</th>
                           ))}
                        </tr>
                     </thead>
                     <tbody>
                        {(() => {
                           const year = calendarDate.getFullYear();
                           const month = calendarDate.getMonth();
                           const firstDay = new Date(year, month, 1).getDay();
                           const daysInMonth = new Date(year, month + 1, 0).getDate();
                           const today = new Date();
                           
                           const events = dashboardStats?.calendar_events || [];

                           const rows = [];
                           let dayCount = 1;

                           for (let i = 0; i < 6; i++) {
                              const cells = [];
                              for (let j = 0; j < 7; j++) {
                                 const cellIndex = i * 7 + j;
                                 if (cellIndex < firstDay || dayCount > daysInMonth) {
                                    cells.push(<td key={j} className="h-36 p-4 border-r border-b border-[#E2E8F0] bg-[#F8FAFC]/30"></td>);
                                 } else {
                                    const currentDay = dayCount;
                                    const isToday = today.getDate() === currentDay && today.getMonth() === month && today.getFullYear() === year;
                                    
                                    const dayEvents = events.filter((e: any) => {
                                      const eventDate = new Date(e.date);
                                      return eventDate.getDate() === currentDay && eventDate.getMonth() === month && eventDate.getFullYear() === year;
                                    });

                                    cells.push(
                                       <td key={j} className={cn("h-36 p-2 border-r border-b border-[#E2E8F0] align-top transition-colors hover:bg-slate-50/50 group relative cursor-pointer", isToday ? "bg-[#EAF8F8]/40" : "")}>
                                          <div className="flex justify-between items-center px-1 mb-2">
                                             <span className={cn("text-[13px] font-bold", isToday ? "text-[#34959E] bg-white shadow-sm w-7 h-7 flex items-center justify-center rounded-full" : "text-[#0F172A]")}>{currentDay}</span>
                                          </div>
                                          <div className="space-y-1.5 px-1 max-h-[80px] overflow-y-auto scrollbar-hide">
                                             {dayEvents.map((evt: any, idx: number) => {
                                                const bgCol = evt.color?.includes('orange') ? 'bg-[#FB9917]/10 border-[#FB9917]/20 text-[#FB9917]' :
                                                              evt.color?.includes('rose') || evt.color?.includes('red') ? 'bg-[#990000]/10 border-[#990000]/20 text-[#990000]' :
                                                              'bg-[#34959E]/10 border-[#34959E]/20 text-[#34959E]';
                                                
                                                return (
                                                  <div key={idx} className={cn("px-2 py-1.5 text-[10px] font-bold rounded-lg truncate border", bgCol)}>
                                                     {evt.label}
                                                  </div>
                                                );
                                             })}
                                          </div>
                                       </td>
                                    );
                                    dayCount++;
                                 }
                              }
                              rows.push(<tr key={i}>{cells}</tr>);
                              if (dayCount > daysInMonth) break;
                           }
                           return rows;
                        })()}
                     </tbody>
                  </table>
               </div>
            </motion.div>
         </section>
      </div>
    </div>
  );
}
