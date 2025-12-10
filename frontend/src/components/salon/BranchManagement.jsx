// frontend/src/components/salon/BranchManagement.jsx
import { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import api from '../../services/api';

export default function BranchManagement() {
  const { t } = useLanguage();
  const [branches, setBranches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const salonId = localStorage.getItem('salonId');
      const response = await api.get(`/Salon/${salonId}/branches`);
      if (response.data.success) {
        setBranches(response.data.branches);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-dark-brown">{t('branches')}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-green text-white px-6 py-3 rounded-lg hover:bg-opacity-90"
        >
          <Plus size={20} />
          {t('add_branch')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {branches.map((branch) => (
          <div key={branch.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-dark-brown">{branch.branchName}</h3>
                <p className="text-sm text-gray-600 mt-1">{branch.city}</p>
              </div>
              <span className={`px-3 py-1 text-xs rounded-full ${
                branch.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {branch.isActive ? t('active') : t('inactive')}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="mt-1 text-gray-400" />
                <span className="text-gray-600">{branch.addressLine}</span>
              </div>
              {branch.phoneNumber && (
                <p className="text-gray-600">📞 {branch.phoneNumber}</p>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setEditingBranch(branch);
                  setShowModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-warm-gold text-white py-2 rounded-lg hover:bg-opacity-90"
              >
                <Edit size={16} />
                {t('edit')}
              </button>
              <button className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-opacity-90">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}