import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  className?: string;
}

export function StatCard({ title, value, change, isPositive, icon: Icon, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("p-6 rounded-2xl bg-white border border-zinc-100 shadow-sm card-hover", className)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-xl bg-zinc-50">
          <Icon className="w-5 h-5 text-zinc-600" />
        </div>
        {change && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {isPositive ? '+' : ''}{change}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-zinc-500 font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold tracking-tight text-zinc-900">{value}</h3>
      </div>
    </motion.div>
  );
}
