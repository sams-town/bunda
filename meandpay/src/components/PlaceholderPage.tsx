import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface PlaceholderPageProps {
  key?: React.Key;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color?: string;
}

export function PlaceholderPage({ title, subtitle, icon: Icon, color = "text-indigo-600" }: PlaceholderPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col items-center justify-center text-center p-10"
    >
      <div className={cn("w-24 h-24 rounded-[2rem] bg-white shadow-2xl shadow-slate-200/50 flex items-center justify-center mb-8 border border-slate-100", color)}>
        <Icon className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">{title}</h1>
      <p className="text-slate-500 font-medium max-w-md mx-auto">
        {subtitle}. This module is currently being modernized to match the new MeAndPay aesthetic.
      </p>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse flex flex-col p-6 justify-between">
            <div className="w-1/2 h-2 bg-slate-100 rounded"></div>
            <div className="w-full h-8 bg-slate-50 rounded-xl"></div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
