// ============================================
// src/components/admin/SalonApprovals.jsx
// Admin: approve (or suspend) salons so they appear publicly and accept bookings.
// ============================================
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../services/api';

const SalonApprovals = () => {
  const { t } = useTranslation();
  const [salons, setSalons] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await api.get('/admin/salons', { params: { status: showAll ? 'all' : 'pending' } });
      setSalons(data.salons || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useEffect(() => { load(); }, [load]);

  const setVerified = async (id, isVerified) => {
    try {
      await api.put(`/admin/salons/${id}/verification`, { isVerified });
      toast.success(isVerified ? t('admin.salonApproved', 'Salon approved') : t('admin.salonSuspended', 'Salon suspended'));
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || t('common.error'));
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t('admin.salonApprovals', 'Salon approvals')}</h1>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          {t('admin.showAllSalons', 'Show all salons')}
        </label>
      </div>

      {loading && <p>{t('common.loading', 'Loading...')}</p>}
      {error && <p className="text-red-600">{t('common.error')}</p>}
      {!loading && !error && salons.length === 0 && (
        <p className="text-gray-600">{t('admin.noPendingSalons', 'No salons waiting for approval.')}</p>
      )}

      <div className="space-y-3">
        {salons.map((s) => (
          <div key={s.id} className="card flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">{s.name}</div>
              <div className="text-sm text-gray-600">{[s.city, s.address].filter(Boolean).join(' - ')}</div>
              <div className="text-sm text-gray-600">{[s.contactPhone, s.contactEmail].filter(Boolean).join(' | ')}</div>
              <div className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleString()}</div>
            </div>
            {s.isVerified ? (
              <button className="btn-outline" onClick={() => setVerified(s.id, false)}>{t('admin.suspend', 'Suspend')}</button>
            ) : (
              <button className="btn-primary" onClick={() => setVerified(s.id, true)}>{t('admin.approve', 'Approve')}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalonApprovals;
