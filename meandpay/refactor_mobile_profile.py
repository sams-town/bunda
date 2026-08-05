import os
import re

file_path = r'c:\Users\viprs\Videos\proj\bunda\meandpay\src\components\MobileProfilePage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Header block
content = content.replace('bg-indigo-700 pt-14 pb-24 px-6 rounded-b-[4rem] relative shadow-2xl shadow-indigo-500/20 overflow-hidden', 'bg-gradient-to-b from-white to-[#F8FAFC] pt-14 pb-24 px-6 rounded-b-[40px] relative shadow-sm border-b border-[#E2E8F0] overflow-hidden')
content = content.replace('bg-white/10 rounded-full blur-3xl', 'bg-[#34959E]/5 rounded-full blur-3xl')
content = content.replace('bg-indigo-400/20 rounded-full blur-2xl', 'bg-[#34959E]/5 rounded-full blur-2xl')
content = content.replace('text-white mb-8', 'text-[#0F172A] mb-8')
content = content.replace('bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30', 'bg-white shadow-sm rounded-2xl flex items-center justify-center border border-[#E2E8F0]')
content = content.replace('bg-rose-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-rose-500/30 text-rose-100', 'bg-[#FFF0F0] rounded-2xl flex items-center justify-center border border-[#990000]/10 text-[#990000]')
content = content.replace('text-center relative z-10 text-white', 'text-center relative z-10 text-[#0F172A]')
content = content.replace('border-[6px] border-white/20 backdrop-blur-sm shadow-2xl bg-slate-100/10', 'border-[6px] border-[#F8FAFC] shadow-sm bg-white')
content = content.replace('text-indigo-100', 'text-[#64748B]')
content = content.replace('border-4 border-indigo-700', 'border-4 border-white shadow-sm')
content = content.replace('text-indigo-600', 'text-[#34959E]')
content = content.replace('text-white mt-6', 'text-[#0F172A] mt-6')
content = content.replace('text-2xl font-black text-white mt-6 tracking-tight leading-none drop-shadow-md', 'text-2xl font-black text-[#0F172A] mt-6 tracking-tight leading-none')
content = content.replace('bg-white/10 backdrop-blur-md rounded-full border border-white/20', 'bg-white shadow-sm rounded-full border border-[#E2E8F0]')
content = content.replace('text-white text-[10px]', 'text-[#64748B] text-[10px]')

# Global Replacements
content = content.replace('text-slate-400', 'text-[#64748B]')
content = content.replace('text-slate-500', 'text-[#64748B]')
content = content.replace('text-slate-800', 'text-[#0F172A]')
content = content.replace('bg-slate-50', 'bg-[#F8FAFC]')
content = content.replace('border-slate-100', 'border-[#E2E8F0]')
content = content.replace('rounded-[2.5rem]', 'rounded-[24px]')
content = content.replace('rounded-[1.8rem]', 'rounded-[18px]')
content = content.replace('shadow-slate-200/50', 'shadow-sm')
content = content.replace('rounded-[2.2rem]', 'rounded-[24px]')

# Tab content - info
content = content.replace('text-indigo-500', 'text-[#34959E]')
content = content.replace('bg-indigo-950 text-white rounded-[24px] p-8 shadow-xl shadow-indigo-900/10', 'bg-white text-[#0F172A] rounded-[24px] p-8 shadow-[0_10px_30px_rgba(15,23,42,0.06)] border border-[#E2E8F0]')
content = content.replace('text-indigo-400', 'text-[#34959E]')

# Tab content - Cuti
content = content.replace('bg-indigo-50', 'bg-[#EEF8F8]')

# Tab content - Gaji Plus / Minus
content = content.replace('bg-emerald-600 text-white rounded-[24px] p-8 shadow-xl shadow-emerald-500/20', 'bg-white text-[#0F172A] rounded-[24px] p-8 shadow-[0_10px_30px_rgba(15,23,42,0.06)] border border-[#E2E8F0]')
content = content.replace('bg-rose-600 text-white rounded-[24px] p-8 shadow-xl shadow-rose-500/20', 'bg-white text-[#0F172A] rounded-[24px] p-8 shadow-[0_10px_30px_rgba(15,23,42,0.06)] border border-[#E2E8F0]')

content = content.replace('text-emerald-100', 'text-[#64748B]')
content = content.replace('text-emerald-400', 'text-[#34959E]')
content = content.replace('bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30', 'bg-[#EEF8F8] rounded-2xl flex items-center justify-center border border-[#34959E]/10')
content = content.replace('border-white/10', 'border-[#E2E8F0]')
content = content.replace('text-rose-100', 'text-[#64748B]')
content = content.replace('text-rose-400', 'text-[#990000]')

content = content.replace('bg-emerald-700/50 text-emerald-100', 'bg-[#EEF8F8] text-[#34959E]')
content = content.replace('bg-rose-700/50 text-rose-100', 'bg-[#FFF0F0] text-[#990000]')
content = content.replace('bg-white/10 text-emerald-100', 'bg-[#EEF8F8] text-[#34959E]')
content = content.replace('bg-white/10 text-rose-100', 'bg-[#FFF0F0] text-[#990000]')
content = content.replace('text-white text-xs', 'text-[#0F172A] text-xs')

# TabButton component adjustments
content = content.replace('bg-indigo-600 text-white shadow-lg shadow-indigo-500/30', 'bg-[#34959E] text-white shadow-md shadow-[#34959E]/30')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Refactored MobileProfilePage.tsx")
