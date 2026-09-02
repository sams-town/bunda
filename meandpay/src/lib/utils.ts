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

export async function downloadFile(url: string | null | undefined, defaultFilename = 'dokumen_template.xlsx') {
  if (!url) return;
  try {
    const formattedUrl = formatPhotoUrl(url);
    const res = await fetch(formattedUrl);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    const nameFromUrl = formattedUrl.split('/').pop()?.split('?')[0];
    a.download = nameFromUrl || defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.warn('Direct blob download failed, falling back to window.open:', err);
    window.open(formatPhotoUrl(url), '_blank');
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
