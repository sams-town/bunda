import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Loader2, X, Info } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastType = 'success' | 'error' | 'loading' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    addToast: (toast: Omit<Toast, 'id'>) => string;
    removeToast: (id: string) => void;
    updateToast: (id: string, updates: Partial<Omit<Toast, 'id'>>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Date.now().toString() + Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { ...toast, id }]);

        if (toast.type !== 'loading') {
            const duration = toast.duration || 4000;
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const updateToast = useCallback((id: string, updates: Partial<Omit<Toast, 'id'>>) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

        if (updates.type && updates.type !== 'loading') {
            const duration = updates.duration || 4000;
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast, updateToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onClose }: { key?: string | number, toast: Toast, onClose: () => void }) {
    const config = {
        success: {
            icon: CheckCircle2,
            bg: 'bg-white',
            border: 'border-emerald-200',
            iconColor: 'text-emerald-500',
            iconBg: 'bg-emerald-50',
            shadow: 'shadow-emerald-500/10',
            progressColor: 'bg-emerald-500',
        },
        error: {
            icon: AlertCircle,
            bg: 'bg-white',
            border: 'border-rose-200',
            iconColor: 'text-rose-500',
            iconBg: 'bg-rose-50',
            shadow: 'shadow-rose-500/10',
            progressColor: 'bg-rose-500',
        },
        loading: {
            icon: Loader2,
            bg: 'bg-white',
            border: 'border-indigo-200',
            iconColor: 'text-indigo-500',
            iconBg: 'bg-indigo-50',
            shadow: 'shadow-indigo-500/10',
            progressColor: 'bg-indigo-500',
        },
        info: {
            icon: Info,
            bg: 'bg-white',
            border: 'border-sky-200',
            iconColor: 'text-sky-500',
            iconBg: 'bg-sky-50',
            shadow: 'shadow-sky-500/10',
            progressColor: 'bg-sky-500',
        }
    }[toast.type];

    const Icon = config.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
                "pointer-events-auto rounded-2xl border p-4 shadow-xl backdrop-blur-xl flex items-start gap-3.5 relative overflow-hidden",
                config.bg,
                config.border,
                config.shadow
            )}
        >
            <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                config.iconBg
            )}>
                <Icon className={cn(
                    "w-5 h-5",
                    config.iconColor,
                    toast.type === 'loading' && "animate-spin"
                )} />
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-black text-slate-900 tracking-tight">{toast.title}</p>
                {toast.message && (
                    <p className="text-xs font-medium text-slate-500 mt-0.5 leading-relaxed">{toast.message}</p>
                )}
            </div>

            {toast.type !== 'loading' && (
                <button
                    onClick={onClose}
                    className="p-1.5 -mr-1 -mt-0.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-all shrink-0"
                >
                    <X className="w-4 h-4" />
                </button>
            )}

            {/* Progress bar for auto-dismiss */}
            {toast.type !== 'loading' && (
                <motion.div
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
                    className={cn(
                        "absolute bottom-0 left-0 right-0 h-0.5 origin-left",
                        config.progressColor
                    )}
                />
            )}

            {/* Pulse animation for loading */}
            {toast.type === 'loading' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-100 overflow-hidden">
                    <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                        className="w-1/3 h-full bg-indigo-500 rounded-full"
                    />
                </div>
            )}
        </motion.div>
    );
}
