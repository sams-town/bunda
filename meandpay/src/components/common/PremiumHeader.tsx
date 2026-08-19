import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Search, Bell, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, User, Settings, LogOut } from 'lucide-react';
import { cn, formatPhotoUrl } from '../../lib/utils';
import { Page } from '../../lib/routes';

interface PremiumHeaderProps {
  user: any;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
  unreadCount: number;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (v: boolean) => void;
  isProfileMenuOpen: boolean;
  setIsProfileMenuOpen: (v: boolean) => void;
  handleLogout: () => void;
  profileMenuRef: any;
  bellRef: any;
  previewNotifications: any[];
  handleMarkRead: (id: string) => void;
  currentPage: string;
}

// WMO Weather Code mapping
const getWeatherInfo = (code: number): { label: string; Icon: any; bg: string; color: string } => {
  if (code === 0) return { label: 'Cerah', Icon: Sun, bg: 'bg-orange-50', color: 'text-orange-500' };
  if (code <= 3) return { label: 'Berawan', Icon: Cloud, bg: 'bg-slate-100', color: 'text-slate-500' };
  if (code <= 48) return { label: 'Berkabut', Icon: Cloud, bg: 'bg-slate-100', color: 'text-slate-400' };
  if (code <= 57) return { label: 'Gerimis', Icon: CloudDrizzle, bg: 'bg-blue-50', color: 'text-blue-400' };
  if (code <= 67) return { label: 'Hujan', Icon: CloudRain, bg: 'bg-blue-50', color: 'text-blue-500' };
  if (code <= 77) return { label: 'Salju', Icon: CloudSnow, bg: 'bg-cyan-50', color: 'text-cyan-500' };
  if (code <= 82) return { label: 'Hujan Lebat', Icon: CloudRain, bg: 'bg-blue-100', color: 'text-blue-600' };
  if (code <= 86) return { label: 'Hujan Salju', Icon: CloudSnow, bg: 'bg-cyan-100', color: 'text-cyan-600' };
  if (code <= 99) return { label: 'Badai Petir', Icon: CloudLightning, bg: 'bg-yellow-50', color: 'text-yellow-600' };
  return { label: 'Cerah', Icon: Sun, bg: 'bg-orange-50', color: 'text-orange-500' };
};

export function PremiumHeader({
  user, isSidebarCollapsed, setIsSidebarCollapsed, unreadCount,
  isNotificationsOpen, setIsNotificationsOpen, isProfileMenuOpen,
  setIsProfileMenuOpen, handleLogout, profileMenuRef, bellRef,
  previewNotifications, handleMarkRead, currentPage
}: PremiumHeaderProps) {
  
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date());

  const currentHour = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"})).getHours();
  let greeting = "Good Evening";
  if (currentHour >= 5 && currentHour < 12) greeting = "Good Morning";
  else if (currentHour >= 12 && currentHour < 15) greeting = "Good Afternoon";
  else if (currentHour >= 15 && currentHour < 18) greeting = "Good Afternoon"; // Can also use Sore
  else if (currentHour >= 0 && currentHour < 5) greeting = "Good Night";

  // Weather state
  const [temperature, setTemperature] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number>(0);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Batam coordinates: 1.0456, 104.0305
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=1.0456&longitude=104.0305&current=temperature_2m,weather_code&timezone=Asia%2FJakarta'
        );
        const data = await res.json();
        if (data.current) {
          setTemperature(Math.round(data.current.temperature_2m));
          setWeatherCode(data.current.weather_code);
        }
      } catch (err) {
        console.error('Failed to fetch weather:', err);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000); // Refresh every 30 minutes
    return () => clearInterval(interval);
  }, []);

  const weather = getWeatherInfo(weatherCode);
  const WeatherIcon = weather.Icon;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0] px-8 py-5 shadow-sm">
      <div className="flex items-center justify-between">
        
        {/* Left: Breadcrumbs & Greeting */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 -ml-2 rounded-xl text-[#64748B] hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
              <span>Home</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#34959E]">{currentPage.replace('-', ' ')}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              {greeting}, {user?.name?.split(' ')[0] || 'Admin'} <span className="animate-bounce inline-block">👋</span>
            </h1>
          </div>
        </div>

        {/* Center: Search */}
        <div className="hidden lg:block max-w-md w-full px-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#34959E] transition-colors" />
            <input
              type="text"
              placeholder="Search employees, doctors, shifts..."
              className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#34959E] focus:bg-white rounded-2xl outline-none focus:ring-4 focus:ring-[#34959E]/10 transition-all text-[#0F172A] font-medium text-[13px] placeholder:text-slate-400"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
               <kbd className="hidden sm:inline-block px-2 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-400">⌘K</kbd>
            </div>
          </div>
        </div>

        {/* Right: Weather, Notifications, Profile */}
        <div className="flex items-center gap-6">
          
          <div className="hidden md:flex items-center gap-3 pr-6 border-r border-[#E2E8F0]">
            <div className={`w-10 h-10 rounded-xl ${weather.bg} flex items-center justify-center`}>
              <WeatherIcon className={`w-5 h-5 ${weather.color}`} />
            </div>
            <div>
               <p className="text-[13px] font-bold text-[#0F172A]">
                 Batam, {temperature !== null ? `${temperature}°C` : '...'}
               </p>
               <p className="text-[11px] font-medium text-[#64748B]">{today}</p>
            </div>
          </div>

          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2.5 rounded-xl text-[#64748B] hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
              )}
            </button>
            
            {/* Notifications Dropdown (Abbreviated for structure) */}
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.1)] border border-[#E2E8F0] overflow-hidden"
                >
                  <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
                    <h3 className="text-sm font-bold text-[#0F172A]">Notifications</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#34959E]/10 text-[#34959E] rounded-full">{unreadCount} New</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-2">
                     {previewNotifications.length > 0 ? previewNotifications.map((notif, i) => (
                        <div key={i} className="p-3 hover:bg-slate-50 rounded-xl mb-1 cursor-pointer transition-colors border border-transparent hover:border-slate-100" onClick={() => handleMarkRead(notif.id)}>
                           <p className="text-[13px] font-semibold text-[#0F172A]">{notif.title}</p>
                           <p className="text-[11px] text-[#64748B] mt-0.5 truncate">{notif.message}</p>
                        </div>
                     )) : (
                        <div className="p-6 text-center text-[12px] font-medium text-slate-400">All caught up! 🎉</div>
                     )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-3 p-1.5 pr-3 hover:bg-slate-100 rounded-2xl transition-all"
            >
              <img src={user?.photo_url ? formatPhotoUrl(user.photo_url) : `https://ui-avatars.com/api/?name=${user?.name}&background=34959E&color=fff`} className="w-9 h-9 rounded-xl shadow-sm" alt="Avatar" />
            </button>

            <AnimatePresence>
              {isProfileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.1)] border border-[#E2E8F0] overflow-hidden p-2"
                >
                  <div className="px-4 py-3 mb-2 border-b border-[#E2E8F0]">
                    <p className="text-[13px] font-bold text-[#0F172A]">{user?.name}</p>
                    <p className="text-[11px] font-medium text-[#64748B]">{user?.role_name || user?.is_admin}</p>
                  </div>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 rounded-xl transition-colors">
                    <User className="w-4 h-4" /> My Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 rounded-xl transition-colors">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors mt-1">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
        </div>
      </div>
    </header>
  );
}
