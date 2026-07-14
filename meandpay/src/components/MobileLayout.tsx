import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  History, 
  Fingerprint, 
  Star, 
  User 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/beranda' },
    { icon: History, label: 'History', path: '/attendance' },
    { icon: Star, label: 'Dinas', path: '/data-dinas' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-slate-200/50 flex flex-col items-center">
      <div className="w-full max-w-[480px] min-h-screen bg-slate-50 relative pb-28 shadow-[0_0_50px_rgba(0,0,0,0.1)] border-x border-slate-200 overflow-x-hidden">
        <main className="relative z-10 min-h-screen">
          {children}
        </main>

        {/* Bottom Navigation (Centered inside frame) */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-xl border-t border-slate-100 px-8 py-4 z-[100] pb-env(safe-area-inset-bottom) shadow-[0_-10px_25px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between relative text-slate-400">
            <NavButton icon={navItems[0].icon} label={navItems[0].label} active={location.pathname === navItems[0].path || (location.pathname === '/dashboard' && navItems[0].path === '/beranda')} onClick={() => navigate(navItems[0].path)} />
            <NavButton icon={navItems[1].icon} label={navItems[1].label} active={location.pathname === navItems[1].path} onClick={() => navigate(navItems[1].path)} />
            
            <div className="absolute left-1/2 -translate-x-1/2 -top-12">
              <button 
                onClick={() => navigate('/absen')}
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all border-4 border-white active:scale-95 z-50",
                  location.pathname === '/absen' ? "bg-indigo-600 text-white shadow-indigo-500/40" : "bg-slate-900 text-white shadow-slate-900/20"
                )}
              >
                <Fingerprint className="w-8 h-8" />
              </button>
            </div>
            
            <NavButton icon={navItems[2].icon} label={navItems[2].label} active={location.pathname === navItems[2].path} onClick={() => navigate(navItems[2].path)} />
            <NavButton icon={navItems[3].icon} label={navItems[3].label} active={location.pathname === navItems[3].path} onClick={() => navigate(navItems[3].path)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function NavButton({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-colors min-w-[60px]",
        active ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
      )}
    >
      <Icon className="w-6 h-6" />
      <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
    </button>
  );
}
