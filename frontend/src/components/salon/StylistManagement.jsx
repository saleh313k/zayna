// frontend/src/components/salon/StylistManagement.jsx
import { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { Plus, Edit, UserX } from 'lucide-react';
import api from '../../services/api';

export default function StylistManagement() {
  const { t } = useLanguage();
  const [stylists, setStylists] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchStylists();
  }, []);

  const fetchStylists = async () => {
    try {
      const salonId = localStorage.getItem('salonId');
      const response = await api.get(`/Salon/${salonId}/stylists`);
      if (response.data.success) {
        setStylists(response.data.stylists);
      }
    } catch (error) {
      console.error('Failed to fetch stylists:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-dark-brown">{t('stylists')}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-green text-white px-6 py-3 rounded-lg hover:bg-opacity-90"
        >
          <Plus size={20} />
          {t('add_stylist')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stylists.map((stylist) => (
          <div key={stylist.id} className="bg-white rounded-lg shadow p-6">
            <div className="text-center mb-4">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-3xl text-gray-400">👤</span>
              </div>
              <h3 className="font-semibold text-lg text-dark-brown">{stylist.fullName}</h3>
              <p className="text-sm text-gray-600">{stylist.yearsOfExperience} {t('years_experience')}</p>
            </div>

            <div className="flex items-center justify-center gap-1 mb-4">
              <span className="text-warm-gold">⭐</span>
              <span className="font-medium">{stylist.rating.toFixed(1)}</span>
              <span className="text-sm text-gray-600">({stylist.totalReviews})</span>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 bg-warm-gold text-white py-2 rounded-lg hover:bg-opacity-90">
                <Edit size={16} />
                {t('edit')}
              </button>
              <button className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-opacity-90">
                <UserX size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {stylists.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {t('no_stylists_found')}
        </div>
      )}
    </div>
  );
}
