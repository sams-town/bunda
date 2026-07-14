import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  MapPin, 
  Search, 
  Plus, 
  Loader2,
  Navigation,
  CheckCircle2,
  Clock,
  ExternalLink,
  Map as MapIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

interface OfficeLocation {
  id: string;
  nama_lokasi: string;
  lat: string;
  long: string;
  radius: string;
  is_active: string;
}

export function MobileLocationsPage() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/lokasi`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setLocations(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = locations.filter(loc => 
    loc.nama_lokasi.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Header */}
      <div className="bg-indigo-700 pt-12 pb-24 px-6 rounded-b-[3.5rem] relative shadow-2xl shadow-indigo-500/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="flex items-center justify-between relative z-10 text-white mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/beranda')} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-black tracking-tight">Titik Kantor</h1>
          </div>
          <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
            <Navigation className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input 
            type="text" 
            placeholder="Cari nama lokasi kantor..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-3 pl-12 pr-6 text-white placeholder:text-white/40 outline-none focus:bg-white/20 transition-all font-bold text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-10 relative z-20 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memetakan lokasi...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
             <MapIcon className="w-12 h-12 text-slate-200 mb-2" />
             <p className="text-xs font-bold text-slate-400">Lokasi tidak ditemukan</p>
          </div>
        ) : (
          filtered.map((item, i) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/20 border border-slate-100 relative group"
            >
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-inner shrink-0 group-hover:bg-indigo-600 transition-colors duration-500 group-hover:text-white">
                    <MapPin className="w-8 h-8" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <h3 className="text-base font-black text-slate-800 truncate tracking-tight">{item.nama_lokasi}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                       <p className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">Radius: {item.radius}m</p>
                       <span className={cn(
                          "w-2 h-2 rounded-full",
                          item.is_active === '1' ? "bg-emerald-500" : "bg-slate-300"
                       )} />
                    </div>
                 </div>
              </div>

              <div className="flex gap-2">
                 <button 
                   onClick={() => window.open(`http://maps.google.com/maps?q=${item.lat},${item.long}`, '_blank')}
                   className="flex-1 py-3 bg-slate-50 rounded-2xl flex items-center justify-center gap-2 border border-slate-100 active:scale-95 transition-all"
                 >
                    <MapIcon className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Buka Map</span>
                 </button>
                 <button className="flex-1 py-3 bg-indigo-600 rounded-2xl flex items-center justify-center gap-2 text-white active:scale-95 transition-all shadow-lg shadow-indigo-600/20">
                    <Clock className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Gunakan</span>
                 </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
