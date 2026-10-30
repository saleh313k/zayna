// src/components/common/Sidebar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { FiHome, FiCalendar, FiUsers, FiSettings, FiLogOut, FiMenu, FiX, FiCheckCircle } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { ROLES_BY_ID } from '../../constants/roles';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false); // پیش‌فرض بسته باشد

  // قفل اسکرول وقتی سایدبار باز است
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const menuItems = {
    CUSTOMER: [
      { icon: FiHome, label: t('customer.dashboard'), path: '/dashboard' },
      { icon: FiCalendar, label: t('customer.bookings'), path: '/dashboard/bookings' },
      { icon: FiSettings, label: t('customer.profile'), path: '/dashboard/profile' },
    ],
    SALON: [
      { icon: FiHome, label: t('salon.dashboard'), path: '/dashboard' },
      { icon: FiCalendar, label: t('salon.appointments'), path: '/salon/appointments' },
      { icon: FiUsers, label: t('salon.stylists'), path: '/salon/stylists' },
      { icon: FiSettings, label: t('salon.settings'), path: '/salon/settings' },
    ],
    STYLIST: [
      { icon: FiHome, label: t('stylist.dashboard'), path: '/dashboard' },
      { icon: FiCalendar, label: t('stylist.schedule'), path: '/stylist/schedule' },
      { icon: FiSettings, label: t('stylist.profile'), path: '/stylist/profile' },
    ],
    ADMIN: [
      { icon: FiHome, label: t('admin.dashboard'), path: '/admin/dashboard' },
      { icon: FiCheckCircle, label: t('admin.salonApprovals', 'Salon approvals'), path: '/admin/salons' },
      { icon: FiUsers, label: t('admin.users'), path: '/admin/users' },
      { icon: FiCalendar, label: t('admin.bookings'), path: '/admin/bookings' },
      { icon: FiSettings, label: t('admin.settings'), path: '/admin/settings' },
    ],
  };

  const items = menuItems[ROLES_BY_ID[user?.role]] || [];

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* دکمه منو - همیشه قابل مشاهده */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-24 ltr:left-4 rtl:right-4 z-50 p-2.5 bg-emerald-600 text-white rounded-lg shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'ltr:translate-x-60 rtl:-translate-x-60' : 'ltr:-translate-x-0 rtl:translate-x-0'
        }`}
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* بک‌دراپ - فقط وقتی سایدبار باز است نمایش داده شود */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* سایدبار */}
      <aside
        className={`fixed top-0 ltr:left-0 rtl:right-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'ltr:translate-x-0 rtl:-translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
        }`}
      >
        {/* هدر سایدبار */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-emerald-green">ZAYNA</h1>
          <p className="text-sm text-gray-600 mt-1">
            {ROLES_BY_ID[user?.role]?.toLowerCase()} {t('panel')}
          </p>
        </div>

        {/* آیتم‌های منو */}
        <nav className="p-4 space-y-2 overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
          {items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeSidebar} // بستن سایدبار بعد از کلیک
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-50 hover:text-emerald-green transition-all duration-200 text-dark-brown group"
            >
              <item.icon size={20} className="group-hover:text-emerald-green transition-colors" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* دکمه خروج */}
        <div className="absolute bottom-0 w-full p-4 border-t bg-white">
          <button
            onClick={() => {
              logout();
              closeSidebar();
            }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-50 transition text-red-600 hover:text-red-700"
          >
            <FiLogOut size={20} />
            <span className="font-medium">{t('nav.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
