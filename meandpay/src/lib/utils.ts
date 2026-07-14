import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhotoUrl(url: string | null | undefined) {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  
  const apiBase = (import.meta.env.VITE_API_MEANDPAY_DATA || '').replace(/\/$/, '');
  
  let path = url;
  if (url.startsWith('http')) {
    // If the URL is already from our production domain, return as is
    if (url.includes(apiBase) && !url.includes('localhost:4000')) {
      return url;
    }
    // If it's localhost or some other domain, extract the path and point to production
    try {
      const parsed = new URL(url);
      path = parsed.pathname;
    } catch (e) {
      path = url.split('/').pop() || '';
    }
  }
  
  const cleanPath = path.replace(/^\//, '');
  if (cleanPath.startsWith('uploads/') || cleanPath.startsWith('lemburs/') || cleanPath.startsWith('beritas/')) {
    return `${apiBase}/${cleanPath}`;
  }
  
  return `${apiBase}/uploads/${cleanPath}`;
}
