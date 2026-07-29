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
  let apiBase = (apiData || apiBaseEnv || 'https://rsthb.id/apihris').replace(/\/api$/, '').replace(/\/$/, '');
  
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
  if (cleanPath.startsWith('uploads/') || cleanPath.startsWith('lemburs/') || cleanPath.startsWith('beritas/') || cleanPath.startsWith('cuti/')) {
    return `${apiBase}/${cleanPath}`;
  }
  
  return `${apiBase}/uploads/${cleanPath}`;
}
