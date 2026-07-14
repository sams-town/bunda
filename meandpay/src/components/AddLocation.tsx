import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Save, MapPin, Crosshair, Loader2, Navigation, Map, CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, SectionTitle, FormInput, FormSelect, Field, Toast, inputCls } from './common/FormUI';

declare global { interface Window { L: any; } }

export function AddLocation({ onBack }: { onBack: () => void }) {
    const [form, setForm] = useState({ nama_lokasi: '', lat_kantor: '', long_kantor: '', radius: '100', keterangan: 'Office' });
    const [mode, setMode] = useState<'manual' | 'otomatis'>('manual');
    const [saving, setSaving] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const marker = useRef<any>(null);
    const circle = useRef<any>(null);

    useEffect(() => {
        const addL = (h: string, t: 'link' | 'script', cb?: () => void) => {
            if (document.querySelector(`${t}[${t === 'link' ? 'href' : 'src'}="${h}"]`)) return cb?.();
            const e = document.createElement(t); (e as any)[t === 'link' ? 'href' : 'src'] = h;
            if (t === 'link') (e as any).rel = 'stylesheet'; else e.onload = cb as any;
            document.head.appendChild(e);
        };
        addL('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'link');
        addL('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', 'script', () => setMapReady(true));
    }, []);

    useEffect(() => {
        if (!mapReady || !mapRef.current || mapInstance.current) return;
        const L = window.L;
        const map = L.map(mapRef.current, { center: [-6.2088, 106.8456], zoom: 12, zoomControl: false });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
        mapInstance.current = map;
        
        // Ensure map is correctly sized
        setTimeout(() => map.invalidateSize(), 100);

        map.on('click', (e: any) => setForm(p => ({ ...p, lat_kantor: e.latlng.lat.toString(), long_kantor: e.latlng.lng.toString() })));

        return () => {
            map.remove();
            mapInstance.current = null;
            marker.current = null;
            circle.current = null;
        };
    }, [mapReady]);

    useEffect(() => {
        const L = window.L;
        const map = mapInstance.current;
        if (!map || !L || !form.lat_kantor || !form.long_kantor) return;

        const lat = parseFloat(form.lat_kantor);
        const lng = parseFloat(form.long_kantor);
        const r = parseFloat(form.radius);

        if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) return;

        // Use map.whenReady to ensure the map is fully initialized before adding layers
        map.whenReady(() => {
            try {
                // Update or Create Marker
                if (marker.current) {
                    marker.current.setLatLng([lat, lng]);
                } else {
                    marker.current = L.marker([lat, lng], { draggable: true })
                        .addTo(map)
                        .on('dragend', (e: any) => {
                            const p = e.target.getLatLng();
                            setForm(prev => ({
                                ...prev,
                                lat_kantor: p.lat.toFixed(6),
                                long_kantor: p.lng.toFixed(6)
                            }));
                        });
                }

                // Update or Create/Remove Circle
                if (!isNaN(r) && isFinite(r) && r > 0) {
                    if (circle.current) {
                        circle.current.setLatLng([lat, lng]);
                        circle.current.setRadius(r);
                    } else {
                        circle.current = L.circle([lat, lng], {
                            radius: r,
                            color: '#4f46e5',
                            fillColor: '#4f46e5',
                            fillOpacity: 0.1,
                            weight: 2,
                            dashArray: '5, 5'
                        }).addTo(map);
                    }
                    
                    // Safety check for fitBounds
                    const bounds = circle.current.getBounds();
                    if (bounds && bounds.isValid()) {
                        const center = map.getCenter();
                        const dist = Math.sqrt(Math.pow(center.lat - lat, 2) + Math.pow(center.lng - lng, 2));
                        if (dist > 0.005) {
                            map.fitBounds(bounds, { animate: true });
                        }
                    }
                } else {
                    if (circle.current) {
                        circle.current.remove();
                        circle.current = null;
                    }
                    map.setView([lat, lng], 16);
                }
            } catch (err) {
                console.error('Leaflet operation failed:', err);
            }
        });
    }, [form.lat_kantor, form.long_kantor, form.radius, mapInstance.current]);

    useEffect(() => {
        // Check for location permission on mount
        if ('permissions' in navigator) {
            navigator.permissions.query({ name: 'geolocation' as PermissionName }).then(status => {
                if (status.state === 'denied') {
                    setToast({ type: 'error', message: 'Izin lokasi (GPS) diblokir. Harap aktifkan di pengaturan browser Anda agar fitur GPS dapat digunakan.' });
                }
            });
        }
    }, []);

    const handleGps = () => {
        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (p) => { 
                setForm(prev => ({ ...prev, lat_kantor: p.coords.latitude.toString(), long_kantor: p.coords.longitude.toString() })); 
                setGettingLocation(false); 
            },
            (err) => { 
                setGettingLocation(false);
                let msg = 'Gagal mengambil lokasi.';
                if (err.code === err.PERMISSION_DENIED) {
                    msg = 'Izin lokasi ditolak. Harap aktifkan "Location Access" di browser Anda.';
                } else if (err.code === err.POSITION_UNAVAILABLE) {
                    msg = 'Informasi lokasi tidak tersedia.';
                } else if (err.code === err.TIMEOUT) {
                    msg = 'Waktu permintaan lokasi habis.';
                }
                setToast({ type: 'error', message: msg });
            }, 
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSubmit = async () => {
        if (!form.nama_lokasi || !form.lat_kantor || !form.long_kantor) return setToast({ type: 'error', message: 'Lengkapi data' });
        setSaving(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/lokasi`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(form),
            });
            if ((await res.json()).success) { setToast({ type: 'success', message: 'Berhasil' }); setTimeout(onBack, 1500); }
            else throw new Error();
        } catch { setToast({ type: 'error', message: 'Gagal' }); } finally { setSaving(false); }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto pb-20 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex gap-4 items-center">
                    <button onClick={onBack} className="p-2.5 bg-white border rounded-xl shadow-sm"><ArrowLeft/></button>
                    <div><h1 className="text-xl font-bold">Tambah Lokasi Kantor</h1><p className="text-sm text-slate-400">Tentukan titik koordinat pada peta</p></div>
                </div>
                <button onClick={handleSubmit} disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2">
                    {saving ? <Loader2 className="animate-spin" /> : <Save />} Simpan
                </button>
            </div>

            <div className="grid grid-cols-5 gap-6 h-[500px]">
                <Card className="col-span-2 space-y-4 overflow-y-auto">
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-4">
                        {['manual', 'otomatis'].map(m => <button key={m} onClick={() => setMode(m as any)} className={cn("flex-1 py-2 rounded-lg text-xs font-bold uppercase", mode === m ? "bg-white shadow-sm text-indigo-600" : "text-slate-400")}>{m}</button>)}
                    </div>
                    <FormInput label="Nama Lokasi" value={form.nama_lokasi} onChange={(n:any,v:any)=>setForm({...form,nama_lokasi:v})} placeholder="Kantor Pusat" />
                    {mode === 'manual' ? (
                        <div className="grid grid-cols-2 gap-3">
                            <FormInput label="Lat" value={form.lat_kantor} onChange={(n:any,v:any)=>setForm({...form,lat_kantor:v})} />
                            <FormInput label="Long" value={form.long_kantor} onChange={(n:any,v:any)=>setForm({...form,long_kantor:v})} />
                        </div>
                    ) : (
                        <button onClick={handleGps} className="w-full py-3 border-2 border-dashed rounded-xl text-xs font-bold text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                            {gettingLocation ? 'Mencari...' : 'Ambil dari GPS'}
                        </button>
                    )}
                    <FormInput label="Radius (m)" type="number" value={form.radius} onChange={(n:any,v:any)=>setForm({...form,radius:v})} />
                    <FormSelect label="Jenis" options={['Office', 'Patroli']} value={form.keterangan} onChange={(n:any,v:any)=>setForm({...form,keterangan:v})} />
                </Card>

                <div className="col-span-3 bg-white rounded-2xl border overflow-hidden relative">
                    {!mapReady && <div className="absolute inset-0 bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" /></div>}
                    <div ref={mapRef} className="size-full z-0" />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 bg-slate-900/80 text-white text-[10px] rounded-lg">Klik peta untuk pindah titik</div>
                </div>
            </div>
            <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
        </motion.div>
    );
}