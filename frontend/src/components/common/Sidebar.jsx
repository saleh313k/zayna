// src/components/common/Sidebar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Home, Calendar, Users, Settings, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = {
    Customer: [
      { icon: Home, label: t('dashboard'), path: '/dashboard' },
      { icon: Calendar, label: t('my_bookings'), path: '/dashboard/bookings' },
      { icon: Settings, label: t('profile'), path: '/dashboard/profile' },
    ],
    Salon: [
      { icon: Home, label: t('dashboard'), path: '/dashboard' },
      { icon: Calendar, label: t('appointments'), path: '/dashboard/appointments' },
      { icon: Users, label: t('stylists'), path: '/dashboard/stylists' },
      { icon: Settings, label: t('settings'), path: '/dashboard/settings' },
    ],
    Stylist: [
      { icon: Home, label: t('dashboard'), path: '/dashboard' },
      { icon: Calendar, label: t('my_schedule'), path: '/dashboard/schedule' },
      { icon: Settings, label: t('profile'), path: '/dashboard/profile' },
    ],
    Admin: [
      { icon: Home, label: t('dashboard'), path: '/dashboard' },
      { icon: Users, label: t('users'), path: '/dashboard/users' },
      { icon: Calendar, label: t('bookings'), path: '/dashboard/bookings' },
      { icon: Settings, label: t('settings'), path: '/dashboard/settings' },
    ],
  };

  const items = menuItems[user?.role] || [];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-emerald-green text-white rounded-lg"
      >
        <Menu size={24} />
      </button>

      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static w-64 bg-white h-screen shadow-lg transition-transform duration-300 z-40`}
      >
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-emerald-green">ZAYNA</h1>
          <p className="text-sm text-gray-600 mt-1">{user?.role} {t('panel')}</p>
        </div>

        <nav className="p-4 space-y-2">
          {items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-emerald-green hover:bg-opacity-10 transition text-dark-brown"
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-50 transition text-red-600"
          >
            <LogOut size={20} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}