import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, Shield, Bell, Globe, Database, Key, HelpCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

export function SettingsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingId, setSettingId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formCutiFile, setFormCutiFile] = useState<File | null>(null);
  const [formCutiPreview, setFormCutiPreview] = useState<string | null>(null);

  const [formLemburFile, setFormLemburFile] = useState<File | null>(null);
  const [formLemburPreview, setFormLemburPreview] = useState<string | null>(null);

  const [slipGajiFile, setSlipGajiFile] = useState<File | null>(null);
  const [slipGajiPreview, setSlipGajiPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    alamat: '',
    phone: '',
    whatsapp: '',
    api_url: '',
    api_whatsapp: '',
    footer: ''
  });

  const getFileUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    let cleanPath = path.replace(/^\//, '');
    if (cleanPath.startsWith('uploads/')) cleanPath = cleanPath.slice(8);
    const apiData = import.meta.env.VITE_API_MEANDPAY_DATA;
    const apiBase = import.meta.env.VITE_API_MEANDPAY;
    let base = (apiData || apiBase || 'https://rsthb.id/apihris').replace(/\/api$/, '').replace(/\/$/, '');
    if (!base.startsWith('http')) {
      base = 'https://rsthb.id/apihris';
    }
    return `${base}/uploads/${cleanPath}`;
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/settings/1`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      console.log('Settings fetched:', json);
      if (json.success && json.data) {
        const data = json.data;
        const item = Array.isArray(data) ? data[0] : data;
        
        if (item) {
          setSettingId(item.id);
          setFormData({
            name: item.name || '',
            email: item.email || '',
            alamat: item.alamat || '',
            phone: item.phone || '',
            whatsapp: item.whatsapp || '',
            api_url: item.api_url || '',
            api_whatsapp: item.api_whatsapp || '',
            footer: item.footer || ''
          });
          if (item.logo) {
            setLogoPreview(getFileUrl(item.logo));
          }
          if (item.file_form_cuti) setFormCutiPreview(getFileUrl(item.file_form_cuti));
          if (item.file_form_lembur) setFormLemburPreview(getFileUrl(item.file_form_lembur));
          if (item.file_slip_gaji) setSlipGajiPreview(getFileUrl(item.file_slip_gaji));
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
      addToast({ type: 'error', message: 'Gagal memuat pengaturan' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const fd = new FormData();
      Object.keys(formData).forEach(key => {
        fd.append(key, formData[key as keyof typeof formData]);
      });
      if (logoFile) {
        fd.append('logo', logoFile);
      }
      if (formCutiFile) {
        fd.append('form_cuti', formCutiFile);
      }
      if (formLemburFile) {
        fd.append('form_lembur', formLemburFile);
      }
      if (slipGajiFile) {
        fd.append('slip_gaji', slipGajiFile);
      }

      const url = settingId
        ? `${import.meta.env.VITE_API_MEANDPAY}/settings/${settingId}`
        : `${import.meta.env.VITE_API_MEANDPAY}/settings`;

        console.log('url',url)

      const method = settingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: fd
      });
      const json = await res.json();
      if (json.success) {
        addToast({ type: 'success', message: 'Pengaturan berhasil disimpan' });
        
        // Reset file states
        setLogoFile(null);
        setFormCutiFile(null);
        setFormLemburFile(null);
        setSlipGajiFile(null);

        if (!settingId && json.data?.id) {
          setSettingId(json.data.id);
        }
        
        // Refresh data to get the latest file URLs from server
        fetchSettings();
      } else {
        addToast({ type: 'error', message: json.message || 'Gagal menyimpan pengaturan' });
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Terdapat masalah pada server' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-8 pb-20"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Settings</h1>
          <p className="text-slate-500 font-medium">Manage your account and system preferences.</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Company Information</h3>
            {formData.name && (
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Informasi Terisi</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Perusahaan</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="HRIS"
                    className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="samstown31@gmail.com"
                    className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Footer Text (di Login & Dashboard)</label>
                <input
                  type="text"
                  value={formData.footer}
                  onChange={(e) => setFormData({ ...formData, footer: e.target.value })}
                  placeholder="© 2026 HRIS Platform"
                  className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat</label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Bogor"
                  className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-50">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telfon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="628988531672"
                    className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor Whatsapp (untuk notifikasi - berawalan 62)</label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="628988531672"
                    className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">API Configuration</h3>
                {formData.api_url && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Konfigurasi Terisi</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Api URL</label>
                  <input
                    type="url"
                    value={formData.api_url}
                    onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                    placeholder="https://api.example.com"
                    className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Api Key Whatsapp</label>
                  <input
                    type="text"
                    value={formData.api_whatsapp}
                    onChange={(e) => setFormData({ ...formData, api_whatsapp: e.target.value })}
                    placeholder="Api Key Whatsapp"
                    className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-6 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logo</label>
                  {logoPreview && logoPreview.startsWith('http') && (
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">File Terisi</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative group">
                      <img src={logoPreview} alt="Logo Preview" className="h-20 w-auto object-contain bg-slate-50 p-2 rounded-xl border border-slate-200" />
                      {logoPreview.startsWith('http') && (
                        <a 
                          href={logoPreview} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold"
                        >
                          View Full
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="h-20 w-20 bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      No Logo
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Dokumen & Template</h3>
                {(formCutiPreview || formLemburPreview || slipGajiPreview) && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Template Aktif</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Form Cuti</label>
                      {formCutiPreview && formCutiPreview.startsWith('http') && (
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Terisi</span>
                      )}
                    </div>
                  <div className="flex items-center gap-4">
                    {formCutiPreview ? (
                      <div className="relative group">
                        <div className="h-20 w-32 bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 break-words text-center overflow-hidden">
                          {formCutiPreview.split('/').pop()}
                        </div>
                        {formCutiPreview.startsWith('http') && (
                          <a 
                            href={formCutiPreview} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold"
                          >
                            View File
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="h-20 w-32 bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        Tidak ada file
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setFormCutiFile(file);
                            setFormCutiPreview(URL.createObjectURL(file));
                          }
                        }}
                        className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Form Lembur</label>
                      {formLemburPreview && formLemburPreview.startsWith('http') && (
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Terisi</span>
                      )}
                    </div>
                  <div className="flex items-center gap-4">
                    {formLemburPreview ? (
                      <div className="relative group">
                        <div className="h-20 w-32 bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 break-words text-center overflow-hidden">
                          {formLemburPreview.split('/').pop()}
                        </div>
                        {formLemburPreview.startsWith('http') && (
                          <a 
                            href={formLemburPreview} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold"
                          >
                            View File
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="h-20 w-32 bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        Tidak ada file
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setFormLemburFile(file);
                            setFormLemburPreview(URL.createObjectURL(file));
                          }
                        }}
                        className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Slip Gaji</label>
                      {slipGajiPreview && slipGajiPreview.startsWith('http') && (
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Terisi</span>
                      )}
                    </div>
                  <div className="flex items-center gap-4">
                    {slipGajiPreview ? (
                      <div className="relative group">
                        <div className="h-20 w-32 bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 break-words text-center overflow-hidden">
                          {slipGajiPreview.split('/').pop()}
                        </div>
                        {slipGajiPreview.startsWith('http') && (
                          <a 
                            href={slipGajiPreview} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold"
                          >
                            View File
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="h-20 w-32 bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        Tidak ada file
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setSlipGajiFile(file);
                            setSlipGajiPreview(URL.createObjectURL(file));
                          }
                        }}
                        className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="pt-4 flex justify-end gap-4">
          <button
            onClick={fetchSettings}
            disabled={loading || saving}
            className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            Reset
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || saving}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </motion.div>
  );
}


