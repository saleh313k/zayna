// ============================================
// src/components/admin/SalonApprovalsTable.jsx
// Salon approval table, shared by the admin dashboard (pending only, first rows) and the
// Salon approvals page (pending / all, paginated). Same table design as the other admin tables.
// ============================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { adminService } from '../../services/adminService';
import { ErrorState, PaginationBar, Spinner, formatDate } from './adminUi';

const SalonApprovalsTable = ({
  status = 'pending',
  pageSize = 10,
  paginated = true,
  title,
  headerAction,
  onChanged,
}) => {
  const { t } = useTranslation();
  const [salons, setSalons] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const data = await adminService.getSalons({ status, page, pageSize });
      if (id !== requestId.current) return; // a newer request superseded this one
      setSalons(data.salons || []);
      setTotal(data.total || 0);
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [status, page, pageSize]);

  useEffect(() => { setPage(1); }, [status]);
  useEffect(() => { load(); }, [load]);

  const setVerified = async (salon, isVerified) => {
    if (!isVerified && !window.confirm(t('admin.confirmSuspend', 'Suspend this salon? It will disappear from the public list.'))) return;
    setBusyId(salon.id);
    try {
      await adminService.setSalonVerification(salon.id, isVerified);
      toast.success(isVerified ? t('admin.salonApproved', 'Salon approved') : t('admin.salonSuspended', 'Salon suspended'));
      // If the page just emptied (last row on a later page), step back one page.
      if (salons.length === 1 && page > 1 && status !== 'all') setPage(page - 1);
      else await load();
      onChanged?.();
    } catch (e) {
      toast.error(e.response?.data?.message || t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {headerAction}
      </div>

      {loading && salons.length === 0 ? (
        <Spinner />
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : salons.length === 0 ? (
        <p className="text-gray-600 py-6 text-center">
          {status === 'all' ? t('admin.noSalons', 'No salons yet.') : t('admin.noPendingSalons', 'No salons waiting for approval.')}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">{t('admin.salon', 'Salon')}</th>
                <th className="text-left py-3 px-4">{t('admin.contact', 'Contact')}</th>
                <th className="text-left py-3 px-4">{t('admin.location', 'Location')}</th>
                <th className="text-left py-3 px-4">{t('admin.submitted', 'Submitted')}</th>
                <th className="text-left py-3 px-4">{t('admin.status', 'Status')}</th>
                <th className="text-left py-3 px-4">{t('admin.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {salons.map((s) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-sm text-gray-600">{s.ownerName}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm">{s.contactPhone}</p>
                    <p className="text-sm text-gray-600">{s.contactEmail}</p>
                  </td>
                  <td className="py-4 px-4 text-sm">{[s.city, s.address].filter(Boolean).join(' - ') || '-'}</td>
                  <td className="py-4 px-4">{formatDate(s.createdAt)}</td>
                  <td className="py-4 px-4">
                    <span className={`badge ${s.isVerified ? 'badge-confirmed' : 'badge-pending'}`}>
                      {s.isVerified ? t('admin.approved', 'Approved') : t('admin.pending', 'Pending')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {s.isVerified ? (
                      <button
                        className="text-red-600 hover:underline text-sm disabled:opacity-50"
                        disabled={busyId === s.id}
                        onClick={() => setVerified(s, false)}
                      >
                        {t('admin.suspend', 'Suspend')}
                      </button>
                    ) : (
                      <button
                        className="btn-primary py-1 px-4 text-sm disabled:opacity-50"
                        disabled={busyId === s.id}
                        onClick={() => setVerified(s, true)}
                      >
                        {t('admin.approve', 'Approve')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paginated && !error && <PaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} />}
    </div>
  );
};

export default SalonApprovalsTable;
