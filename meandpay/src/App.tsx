import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { MobileLoginPage } from './components/MobileLoginPage';
import { MobileRouter } from './MobileRouter';
import { AdminRouter } from './AdminRouter';
import { PublicAbsenPage } from './components/PublicAbsenPage';
import FinanceSalarySlipPage from './components/FinanceSalarySlipPage';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  const pathParts = location.pathname.split('/').filter(Boolean);
  const paramParts = pathParts.slice(1);
  const paramSegment = paramParts.length > 0 ? `/${paramParts.join('/')}` : '';

  useEffect(() => {
    checkAuth();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/settings/1`);
      const json = await res.json();
      if (json.success) {
        setSettings(Array.isArray(json.data) ? json.data[0] : json.data);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  useEffect(() => {
    if (settings?.name) {
      document.title = settings.name;
    }
  }, [settings]);

  // Redirect to dashboard or beranda after login or on root path
  useEffect(() => {
    if (isLoggedIn && user) {
      const isAdminUser = user.is_admin === 'admin';
      
      if (!isAdminUser) {
        if (location.pathname === '/' || location.pathname === '/dashboard') {
          navigate(`/beranda${paramSegment}`, { replace: true });
        }
      } else {
        if (location.pathname === '/' || location.pathname === '/beranda') {
          navigate(`/dashboard${paramSegment}`, { replace: true });
        }
      }
    }
  }, [location.pathname, isLoggedIn, navigate, paramSegment, user]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsCheckingAuth(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setUser(data.data);
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (err) {
      console.error(err);
      setIsLoggedIn(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-400 animate-pulse">Memverifikasi sesi...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    if (location.pathname === '/absen-masuk') {
      return <PublicAbsenPage mode="masuk" settings={settings} />;
    }
    if (location.pathname === '/absen-keluar') {
      return <PublicAbsenPage mode="keluar" settings={settings} />;
    }
    if (location.pathname === '/absen') {
      return (
        <MobileLoginPage 
          settings={settings}
          onLogin={() => {
            setIsCheckingAuth(true);
            checkAuth().then(() => navigate('/beranda', { replace: true }));
          }} 
        />
      );
    }
    if (location.pathname === '/absen_admin') {
      return <LoginPage settings={settings} onLogin={() => { setIsCheckingAuth(true); checkAuth(); }} />;
    }
    return <LoginPage settings={settings} onLogin={() => {
      setIsCheckingAuth(true);
      checkAuth().then(() => {
        const target = location.pathname === '/' ? '/dashboard' : location.pathname;
        navigate(target, { replace: true });
      });
    }} />;
  }

  // Global Routes (Available for both Admin and Workers)
  if (location.pathname === '/salary-slip' || window.location.pathname === '/salary-slip') {
    return <FinanceSalarySlipPage settings={settings} />;
  }

  const isWorker = user && user.is_admin !== 'admin';

  if (isWorker) {
    return <MobileRouter user={user} handleLogout={handleLogout} settings={settings} />;
  } else {
    return <AdminRouter user={user} handleLogout={handleLogout} settingsFromApp={settings} />;
  }
}
