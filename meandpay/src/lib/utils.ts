import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhotoUrl(url: string | null | undefined) {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  
  const apiData = import.meta.env.VITE_API_MEANDPAY_DATA;
  const apiBaseEnv = import.meta.env.VITE_API_MEANDPAY;
  let apiBase = (apiData || apiBaseEnv || 'https://hris.rsbundahalimah.com').replace(/\/api$/, '').replace(/\/$/, '');
  
  if (!apiBase.startsWith('http')) {
    // If it's a relative path, use the current origin
    apiBase = window.location.origin;
  }
  
  let path = url;
  if (url.startsWith('http')) {
    if (url.includes(apiBase) && !url.includes('localhost:4000')) {
      return url;
    }
    try {
      const parsed = new URL(url);
      path = parsed.pathname;
    } catch (e) {
      path = url.split('/').pop() || '';
    }
  }
  
  const cleanPath = path.replace(/^\//, '');
  if (cleanPath.startsWith('uploads/') || cleanPath.startsWith('lemburs/') || cleanPath.startsWith('beritas/') || cleanPath.startsWith('cuti/') || cleanPath.startsWith('kontraks/')) {
    // Determine if we need to inject /api/ before the static folder
    // If apiBase doesn't end with /api, we prepend /api so Nginx proxies it to backend
    const hasApiSuffix = import.meta.env.VITE_API_MEANDPAY?.endsWith('/api');
    if (hasApiSuffix && !apiBase.endsWith('/api')) {
      return `${apiBase}/api/${cleanPath}`;
    }
    return `${apiBase}/${cleanPath}`;
  }
  
  const hasApiSuffix = import.meta.env.VITE_API_MEANDPAY?.endsWith('/api');
  if (hasApiSuffix && !apiBase.endsWith('/api')) {
    return `${apiBase}/api/uploads/${cleanPath}`;
  }
  return `${apiBase}/uploads/${cleanPath}`;
}

/**
 * downloadTemplate — use the backend's dedicated download endpoint.
 * This forces Content-Disposition: attachment on all browsers including iOS/Android.
 * type: 'form_cuti' | 'form_lembur' | 'slip_gaji'
 */
export function downloadTemplate(type: 'form_cuti' | 'form_lembur' | 'slip_gaji') {
  const apiBase = import.meta.env.VITE_API_MEANDPAY || 'https://hris.rsbundahalimah.com/api';
  const url = `${apiBase}/settings/download-template?type=${type}`;
  // Use an invisible anchor click — the server sends Content-Disposition: attachment
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export interface LeaveTemplateData {
  nama: string;
  nik: string;
  departemen: string;
  tanggal_mulai_kerja: string;
  dari_tanggal: string;
  sampai_tanggal: string;
  jumlah_hari: string;
  alasan_cuti: string;
  tanggal_pengajuan: string;
}

export async function downloadFilledLeaveTemplate(data: LeaveTemplateData) {
  const apiBase = import.meta.env.VITE_API_MEANDPAY || 'https://hris.rsbundahalimah.com/api';
  const url = `${apiBase}/settings/download-template?type=form_cuti`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const buffer = await res.arrayBuffer();

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.worksheets[0];

    const fillNextToLabel = (label: string, value: string) => {
      if (!value || value === '.......' || value === '-') return;
      sheet.eachRow((row) => {
        row.eachCell((cell) => {
          const text = String(cell.value || '').trim().toLowerCase();
          if (text === label.toLowerCase() || text.includes(label.toLowerCase())) {
            const nextCol = cell.col + 1;
            const targetCell = sheet.getCell(cell.row, nextCol);
            targetCell.value = value;
            targetCell.font = targetCell.font || { size: 10 };
            targetCell.alignment = { ...(targetCell.alignment || {}), horizontal: 'left', vertical: 'middle' };
          }
        });
      });
    };

    fillNextToLabel('Nama', data.nama);
    fillNextToLabel('NIK', data.nik);
    fillNextToLabel('Departemen / Unit', data.departemen);
    fillNextToLabel('Departemen/Unit', data.departemen);
    fillNextToLabel('Tgl Mulai Kerja Awal', data.tanggal_mulai_kerja);
    fillNextToLabel('Tgl Mulai Kerja', data.tanggal_mulai_kerja);
    fillNextToLabel('Dari', data.dari_tanggal);
    fillNextToLabel('s/d', data.sampai_tanggal);
    fillNextToLabel('Jumlah Hari', data.jumlah_hari);
    fillNextToLabel('Alasan Cuti', data.alasan_cuti);
    fillNextToLabel('TANGGAL PENGAJUAN', data.tanggal_pengajuan);
    fillNextToLabel('Tanggal Pengajuan', data.tanggal_pengajuan);

    const out = await workbook.xlsx.writeBuffer();
    const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `Form_Cuti_${data.nama.replace(/\s+/g, '_')}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Failed to fill leave template:', err);
    downloadTemplate('form_cuti');
  }
}

/**
 * downloadFile — generic blob download for arbitrary file URLs.
 * Falls back to window.open if fetch fails.
 */
export async function downloadFile(url: string | null | undefined, defaultFilename = 'dokumen_template.xlsx') {
  if (!url) return;
  // url is already a fully-formed absolute URL (already formatted before being stored in state)
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    const nameFromUrl = url.split('/').pop()?.split('?')[0];
    a.download = nameFromUrl || defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.warn('Blob download failed, opening in new tab:', err);
    window.open(url, '_blank');
  }
}

export const compressImage = async (fileOrDataUrl: File | string, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');
      
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    
    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
};

export const compressImageFile = async (file: File, maxWidth = 800, quality = 0.7): Promise<File> => {
  const dataUrl = await compressImage(file, maxWidth, quality);
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], file.name || 'image.jpg', { type: 'image/jpeg' });
};
