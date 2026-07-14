import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

const transactions: Transaction[] = [
  { id: '1', title: 'Apple Store', category: 'Technology', amount: -1299, date: 'Today, 2:45 PM', status: 'completed' },
  { id: '2', title: 'Salary Deposit', category: 'Income', amount: 4500, date: 'Yesterday', status: 'completed' },
  { id: '3', title: 'Starbucks Coffee', category: 'Food & Drink', amount: -5.50, date: 'Yesterday', status: 'completed' },
  { id: '4', title: 'Netflix Subscription', category: 'Entertainment', amount: -15.99, date: 'Feb 22, 2024', status: 'pending' },
  { id: '5', title: 'Uber Trip', category: 'Transport', amount: -24.50, date: 'Feb 21, 2024', status: 'completed' },
];

export function TransactionList() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-zinc-900">Recent Transactions</h2>
        <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700">View All</button>
      </div>
      <div className="space-y-3">
        {transactions.map((tx, index) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-4 rounded-xl bg-white border border-zinc-100 hover:border-emerald-100 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                tx.amount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-zinc-50 text-zinc-600"
              )}>
                {tx.title[0]}
              </div>
              <div>
                <p className="font-semibold text-zinc-900 group-hover:text-emerald-600 transition-colors">{tx.title}</p>
                <p className="text-xs text-zinc-500">{tx.category} • {tx.date}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "font-bold",
                tx.amount > 0 ? "text-emerald-600" : "text-zinc-900"
              )}>
                {tx.amount > 0 ? '+' : ''}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tx.amount)}
              </p>
              <p className={cn(
                "text-[10px] uppercase tracking-wider font-bold",
                tx.status === 'completed' ? "text-emerald-500" : tx.status === 'pending' ? "text-amber-500" : "text-rose-500"
              )}>
                {tx.status}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
