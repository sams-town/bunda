import os
import re

file_path = r'c:\Users\viprs\Videos\proj\bunda\meandpay\src\components\MobileBerandaPage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Backgrounds
content = content.replace('bg-[#F0F4FF]', 'bg-[#F8FAFC]')
content = content.replace('bg-slate-200/50', 'bg-[#F8FAFC]')
content = content.replace('bg-slate-50/60', 'bg-white')
content = content.replace('bg-slate-50', 'bg-white')

# 2. Hero Header
content = content.replace('bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600', 'bg-gradient-to-b from-white to-[#F8FAFC]')
content = content.replace('text-white/60', 'text-[#64748B]')
content = content.replace('text-white text-base', 'text-[#0F172A] text-base')
content = content.replace('border-white/30 shadow-xl bg-white/20', 'border-[#E2E8F0] shadow-sm bg-white')
content = content.replace('text-white text-5xl', 'text-[#34959E] text-5xl')
content = content.replace('text-white/50 text-[11px]', 'text-[#64748B] text-[11px]')
content = content.replace('bg-white/10 backdrop-blur-md rounded-2xl', 'bg-white shadow-sm rounded-2xl')
content = content.replace('border border-white/20', 'border border-[#E2E8F0]')
content = content.replace('bg-white/15 backdrop-blur-md', 'bg-white shadow-sm')
content = content.replace('text-white text-[9px]', 'text-white text-[9px]')

# 3. Quick Absen CTA
content = content.replace('from-indigo-600 to-violet-600', 'from-[#34959E] to-[#287B83]')
content = content.replace('shadow-indigo-500/25', 'shadow-[0_10px_30px_rgba(52,149,158,0.25)]')
content = content.replace('rounded-[2rem]', 'rounded-[24px]')
content = content.replace('text-indigo-600', 'text-[#34959E]')

# 4. Card styling
content = content.replace('rounded-[2.5rem]', 'rounded-[24px]')
content = content.replace('rounded-[1.75rem]', 'rounded-[24px]')
content = content.replace('shadow-2xl shadow-indigo-500/10', 'shadow-[0_10px_30px_rgba(15,23,42,0.06)]')
content = content.replace('border border-white', 'border border-[#E2E8F0]')
content = content.replace('border border-slate-100', 'border border-[#E2E8F0]')

# 5. Fix icons in Hero header specifically
content = re.sub(r'Bell className="w-5 h-5 text-white"', 'Bell className="w-5 h-5 text-[#34959E]"', content)
content = re.sub(r'User className="w-6 h-6 text-white"', 'User className="w-6 h-6 text-[#64748B]"', content)

# 6. Colors for Layanan Cepat (Replace arbitrary colors with our palette)
content = content.replace('from-indigo-500 to-indigo-600', 'from-[#34959E] to-[#287B83]')
content = content.replace('from-sky-500 to-sky-600', 'from-[#FB9917] to-[#D97706]')
content = content.replace('from-amber-500 to-amber-600', 'from-[#287B83] to-[#1E5C62]')
content = content.replace('from-yellow-400 to-orange-500', 'from-[#FB9917] to-[#D97706]')
content = content.replace('from-rose-500 to-pink-600', 'from-[#990000] to-[#7A0000]')
content = content.replace('from-teal-500 to-emerald-600', 'from-[#34959E] to-[#287B83]')
content = content.replace('from-slate-600 to-slate-700', 'from-[#64748B] to-[#475569]')
content = content.replace('from-violet-500 to-purple-600', 'from-[#64748B] to-[#475569]')

# 7. Colors for all menus
def map_menu_color(match):
    color = match.group(0)
    if 'sky' in color or 'indigo' in color or 'teal' in color or 'emerald' in color or 'blue' in color:
        return "bg-[#EEF8F8] text-[#34959E]"
    if 'amber' in color or 'yellow' in color or 'orange' in color:
        return "bg-[#FFF4E5] text-[#FB9917]"
    if 'rose' in color or 'red' in color or 'pink' in color:
        return "bg-[#FFF0F0] text-[#990000]"
    return "bg-[#F8FAFC] text-[#64748B]"

content = re.sub(r'bg-[a-z]+-50 text-[a-z]+-600', map_menu_color, content)

# 8. Activity / Dashboard stats
content = content.replace('bg-indigo-50', 'bg-[#EEF8F8]')
content = content.replace('text-indigo-500', 'text-[#34959E]')
content = content.replace('text-indigo-600', 'text-[#34959E]')
content = content.replace('bg-emerald-50', 'bg-[#EEF8F8]')
content = content.replace('text-emerald-500', 'text-[#34959E]')
content = content.replace('text-emerald-600', 'text-[#34959E]')
content = content.replace('bg-rose-50', 'bg-[#FFF0F0]')
content = content.replace('text-rose-500', 'text-[#990000]')
content = content.replace('text-rose-600', 'text-[#990000]')
content = content.replace('bg-amber-50', 'bg-[#FFF4E5]')
content = content.replace('text-amber-500', 'text-[#FB9917]')
content = content.replace('text-amber-600', 'text-[#FB9917]')
content = content.replace('bg-orange-50', 'bg-[#FFF4E5]')
content = content.replace('text-orange-500', 'text-[#FB9917]')
content = content.replace('text-orange-600', 'text-[#FB9917]')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Refactored MobileBerandaPage.tsx")
