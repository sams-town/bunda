import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Save, Loader2, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, SectionTitle, FormInput, FormSelect, Toast } from './common/FormUI';

declare global { interface Window { L: any; } }

export function EditLocation({ locationId, onBack }: { locationId: string; onBack: () => void }) {
    const [form, setForm] = useState({ nama_lokasi: '', lat_kantor: '', long_kantor: '', radius: '', keterangan: '' });
    const [mode, setMode] = useState<'manual' | 'otomatis'>('manual');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const marker = useRef<any>(null);
    const circle = useRef<any>(null);

    useEffect(() => {
        const fetchLoc = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/lokasi/${locationId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
                const json = await res.json();
                if (json.success && json.data) setForm(json.data);
            } catch { setToast({ type: 'error', message: 'Gagal muat data' }); } finally { setLoading(false); }
        };
        fetchLoc();

        const addL = (h: string, t: 'link' | 'script', cb?: () => void) => {
            if (document.querySelector(`${t}[${t === 'link' ? 'href' : 'src'}="${h}"]`)) return cb?.();
            const e = document.createElement(t); (e as any)[t === 'link' ? 'href' : 'src'] = h;
            if (t === 'link') (e as any).rel = 'stylesheet'; else e.onload = cb as any;
            document.head.appendChild(e);
        };
        addL('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'link');
        addL('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', 'script', () => setMapReady(true));
    }, [locationId]);

    useEffect(() => {
        if (!mapReady || !mapRef.current || mapInstance.current || loading) return;
        const L = window.L;
        const lat = parseFloat(form.lat_kantor) || -6.2;
        const lng = parseFloat(form.long_kantor) || 106.8;
        
        const map = L.map(mapRef.current, { 
            center: [lat, lng], 
            zoom: 15, 
            zoomControl: false 
        });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
        mapInstance.current = map;

        // Ensure map is correctly sized after modal opens or data loads
        setTimeout(() => map.invalidateSize(), 150);

        map.on('click', (e: any) => setForm(p => ({ ...p, lat_kantor: e.latlng.lat.toString(), long_kantor: e.latlng.lng.toString() })));

        return () => {
            map.remove();
            mapInstance.current = null;
            marker.current = null;
            circle.current = null;
        };
    }, [mapReady, loading]);

    useEffect(() => {
        const L = window.L;
        const map = mapInstance.current;
        if (!map || !L || !form.lat_kantor || !form.long_kantor) return;

        const lat = parseFloat(form.lat_kantor);
        const lng = parseFloat(form.long_kantor);
        const r = parseFloat(form.radius);

        if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) return;

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
                    
                    const bounds = circle.current.getBounds();
                    if (bounds && bounds.isValid()) {
                        map.fitBounds(bounds, { animate: true });
                    }
                } else {
                    if (circle.current) {
                        circle.current.remove();
                        circle.current = null;
                    }
                    map.setView([lat, lng], 15);
                }
            } catch (err) {
                console.error('Leaflet operation failed:', err);
            }
        });
    }, [form.lat_kantor, form.long_kantor, form.radius, mapInstance.current]);

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/lokasi/${locationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(form),
            });
            if ((await res.json()).success) { setToast({ type: 'success', message: 'Berhasil' }); setTimeout(onBack, 1500); }
            else throw new Error();
        } catch { setToast({ type: 'error', message: 'Gagal' }); } finally { setSaving(false); }
    };

    if (loading) return <div className="flex items-center justify-center py-40 gap-3 text-slate-400"><Loader2 className="animate-spin" /> Memuat...</div>;

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto pb-20 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex gap-4 items-center"><button onClick={onBack} className="p-2.5 bg-white border rounded-xl shadow-sm"><ArrowLeft/></button><div><h1 className="text-xl font-bold">Edit Lokasi</h1><p className="text-sm text-slate-400">{form.nama_lokasi}</p></div></div>
                <button onClick={handleSubmit} disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2">{saving ? <Loader2 className="animate-spin" /> : <Save />} Simpan</button>
            </div>

            <div className="grid grid-cols-5 gap-6 h-[500px]">
                <Card className="col-span-2 space-y-4 overflow-y-auto">
                    <FormInput label="Nama Lokasi" value={form.nama_lokasi} onChange={(n:any,v:any)=>setForm({...form,nama_lokasi:v})} />
                    <div className="grid grid-cols-2 gap-3">
                        <FormInput label="Lat" value={form.lat_kantor} onChange={(n:any,v:any)=>setForm({...form,lat_kantor:v})} />
                        <FormInput label="Long" value={form.long_kantor} onChange={(n:any,v:any)=>setForm({...form,long_kantor:v})} />
                    </div>
                    <FormInput label="Radius (m)" type="number" value={form.radius} onChange={(n:any,v:any)=>setForm({...form,radius:v})} />
                    <FormSelect label="Jenis" options={['Office', 'Patroli']} value={form.keterangan} onChange={(n:any,v:any)=>setForm({...form,keterangan:v})} />
                </Card>
                <div className="col-span-3 bg-white rounded-2xl border overflow-hidden relative"><div ref={mapRef} className="size-full z-0" /></div>
            </div>
            <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
        </motion.div>
    );
}
