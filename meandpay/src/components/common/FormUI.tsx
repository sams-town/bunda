import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    X, CheckCircle, AlertCircle, ChevronDown, Search,
    User, Mail, Phone, MapPin, Lock, Shield, 
    Building2, Briefcase, FileText, CreditCard, 
    Heart, Hash, Landmark, TrendingUp, Minus, 
    Clock, Calendar
} from 'lucide-react';
import { cn } from '../../lib/utils';

/* ─── Styles ──────────────────────────────────────────────── */
export const inputCls = (hasIcon = true, disabled = false) => cn(
    "w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all",
    hasIcon ? "pl-10 pr-4" : "px-4",
    disabled && "opacity-50 cursor-not-allowed bg-slate-100"
);

/* ─── Components ──────────────────────────────────────────── */
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm p-6", className)}>{children}</div>;
}

export function SectionTitle({ icon: Icon, title, color = "text-indigo-600", bg = "bg-indigo-50" }: any) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", bg)}>
                <Icon className={cn("w-4 h-4", color)} />
            </div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
        </div>
    );
}

export function Field({ label, children, error, required }: any) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            {children}
            {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
        </div>
    );
}

export function FormInput({ label, name, placeholder, type = 'text', icon: Icon, maxLength, disabled = false, value, onChange, error, required }: any) {
    return (
        <Field label={label} error={error} required={required}>
            <div className="relative">
                {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />}
                <input
                    type={type} name={name} placeholder={placeholder} maxLength={maxLength} disabled={disabled} value={value}
                    onChange={(e) => onChange(name, e.target.value)}
                    className={cn(inputCls(!!Icon, disabled), error && "border-rose-300 focus:ring-rose-50")}
                />
            </div>
        </Field>
    );
}

export function FormSelect({ label, name, placeholder, options, icon: Icon, value, onChange, error, required }: any) {
    const opts = (options || []).map((o: any) => typeof o === 'string' ? { value: o, label: o } : o);
    return (
        <Field label={label} error={error} required={required}>
            <div className="relative">
                {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />}
                <select 
                    name={name} value={value} onChange={(e) => onChange(name, e.target.value)}
                    className={cn(inputCls(!!Icon), "appearance-none cursor-pointer pr-8", error && "border-rose-300")}
                >
                    <option value="">{placeholder}</option>
                    {opts.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
        </Field>
    );
}

export function LeaveCard({ label, name, unit, color, value, onChange }: any) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className={cn("h-1", color)} />
            <div className="p-5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">{label}</p>
                <div className="flex items-end gap-1.5">
                    <input type="number" name={name} value={value} onChange={(e) => onChange(name, e.target.value)} className="w-16 text-2xl font-bold text-slate-900 bg-transparent border-none outline-none focus:text-indigo-600 transition-colors" />
                    <span className="text-xs text-slate-400 mb-1">{unit}</span>
                </div>
            </div>
        </div>
    );
}

export function SalaryInput({ label, name, period, isDeduction = false, value, onChange, hideRp = false, required }: any) {
    const fmt = (v: any) => String(v).replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-600">
                    {label} {required && <span className="text-rose-500">*</span>}
                </p>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", isDeduction ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-600")}>{period}</span>
            </div>
            <div className="relative">
                {!hideRp && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">Rp</span>}
                <input
                    type="text" name={name} value={hideRp ? value : fmt(value)}
                    onChange={(e) => onChange(name, e.target.value.replace(/\D/g, ''))}
                    className={cn("w-full pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400 text-right", hideRp ? "pl-3" : "pl-9")}
                />
            </div>
        </div>
    );
}

export function FormSearchSelect({ label, name, placeholder, options, icon: Icon, value, onChange, error, disabled = false, required }: any) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const ref = React.useRef<HTMLDivElement>(null);

    const opts = (options || []).map((o: any) => typeof o === 'string' ? { value: o, label: o } : o);
    const filtered = opts.filter((o: any) => o.label.toLowerCase().includes(search.toLowerCase()));
    const selected = opts.find((o: any) => o.value === value);

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <Field label={label} error={error} required={required}>
            <div className="relative" ref={ref}>
                <div 
                    onClick={() => !disabled && setOpen(!open)}
                    className={cn(
                        inputCls(!!Icon, disabled), 
                        "flex items-center justify-between cursor-pointer pr-10 truncate", 
                        error && "border-rose-300",
                        open && "border-indigo-400 ring-4 ring-indigo-50 shadow-sm"
                    )}
                >
                    {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />}
                    <span className={cn("truncate font-bold text-xs uppercase tracking-tight", !selected && "text-slate-300")}>{selected ? selected.label : placeholder}</span>
                    <ChevronDown className={cn("absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform duration-300", open && "rotate-180")} />
                </div>

                <AnimatePresence>
                    {open && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 4, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                            className="absolute z-[999] top-full left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden mt-1"
                        >
                            <div className="p-2 border-b bg-slate-50/50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                    <input 
                                        autoFocus
                                        type="text" 
                                        placeholder="Ketik untuk mencari..." 
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-indigo-400 transition-all placeholder:text-slate-300"
                                    />
                                    {search && (
                                        <button onClick={(e) => { e.stopPropagation(); setSearch(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500 transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
                                {filtered.length > 0 ? filtered.map((o: any) => (
                                    <button
                                        key={o.value}
                                        onClick={() => { onChange(name, o.value); setOpen(false); setSearch(''); }}
                                        className={cn(
                                            "w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group",
                                            o.value === value ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        <span className="truncate">{o.label}</span>
                                        {o.value === value && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                    </button>
                                )) : (
                                    <div className="py-10 text-center">
                                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Tidak ada hasil</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Field>
    );
}

export function Toast({ type, message, onClose }: any) {
    useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn("fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm font-semibold", type === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800")}>
            {type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-rose-500" />}
            {message}
            <button onClick={onClose} className="ml-2 opacity-50"><X className="w-4 h-4" /></button>
        </motion.div>
    );
}
