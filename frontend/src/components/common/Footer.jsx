// frontend/src/components/common/Footer.jsx
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-dark-brown text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-warm-gold mb-4">ZAYNA</h3>
            <p className="text-sm text-gray-300">{t('your_time_to_shine')}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('quick_links')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-warm-gold">{t('about_us')}</a></li>
              <li><a href="#" className="hover:text-warm-gold">{t('contact')}</a></li>
              <li><a href="#" className="hover:text-warm-gold">{t('terms')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('contact_us')}</h4>
            <p className="text-sm text-gray-300">support@zayna.om</p>
            <p className="text-sm text-gray-300">+968 1234 5678</p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>© 2025 ZAYNA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}