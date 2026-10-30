// ============================================
// src/components/admin/Users.jsx
// Real users from GET /api/admin/users with search, role/status filters, paging, enable/disable.
// ============================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Layout from '../common/Layout';
import { FiSearch } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../constants/roles';
import { adminService } from '../../services/adminService';
import { ErrorState, PaginationBar, Spinner, formatDate } from './adminUi';

const PAGE_SIZE = 10;

const ROLE_BADGE = {
  [ROLES.ADMIN]: 'bg-red-100 text-red-800',
  [ROLES.SALON]: 'bg-blue-100 text-blue-800',
  [ROLES.STYLIST]: 'bg-purple-100 text-purple-800',
  [ROLES.CUSTOMER]: 'bg-green-100 text-green-800',
};

const Users = () => {
  const { t } = useTranslation();
  const { user: me } = useAuth();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const requestId = useRef(0);

  const roleLabel = (r) => ({
    [ROLES.ADMIN]: t('admin.roleAdmin', 'Admin'),
    [ROLES.SALON]: t('admin.roleSalon', 'Salon'),
    [ROLES.STYLIST]: t('admin.roleStylist', 'Stylist'),
    [ROLES.CUSTOMER]: t('admin.roleCustomer', 'Customer'),
  }[r] || String(r));

  // Debounce the search box so we do not hit the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const data = await adminService.getUsers({ search, role, status, page, pageSize: PAGE_SIZE });
      if (id !== requestId.current) return;
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [search, role, status, page]);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (u) => {
    if (u.isActive && !window.confirm(t('admin.confirmDisable', 'Disable this user? They will be signed out and unable to sign in.'))) return;
    setBusyId(u.id);
    try {
      await adminService.setUserActive(u.id, !u.isActive);
      toast.success(u.isActive ? t('admin.userDisabled', 'User disabled') : t('admin.userEnabled', 'User enabled'));
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">{t('admin.userManagement', 'User Management')}</h1>
          <p className="text-gray-600">{t('admin.userManagementSubtitle', 'Manage all system users')}</p>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[260px]">
              <div className="relative">
                <FiSearch className="absolute ltr:left-3 rtl:right-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('admin.searchUsers', 'Search by name, email or phone...')}
                  className="input-field ltr:pl-10 rtl:pr-10"
                />
              </div>
            </div>
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setPage(1); }}
              className="input-field min-w-[180px] w-auto"
            >
              <option value="">{t('admin.allRoles', 'All Roles')}</option>
              <option value={ROLES.CUSTOMER}>{t('admin.customers', 'Customers')}</option>
              <option value={ROLES.SALON}>{t('admin.salons', 'Salons')}</option>
              <option value={ROLES.STYLIST}>{t('admin.stylists', 'Stylists')}</option>
              <option value={ROLES.ADMIN}>{t('admin.admins', 'Admins')}</option>
            </select>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="input-field min-w-[180px] w-auto"
            >
              <option value="">{t('admin.allStatuses', 'All Statuses')}</option>
              <option value="active">{t('admin.active', 'Active')}</option>
              <option value="disabled">{t('admin.disabled', 'Disabled')}</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="card">
          {loading && users.length === 0 ? (
            <Spinner />
          ) : error ? (
            <ErrorState onRetry={load} />
          ) : users.length === 0 ? (
            <p className="text-gray-600 py-6 text-center">{t('admin.noUsers', 'No users match your filters.')}</p>
          ) : (
            <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">{t('admin.name', 'Name')}</th>
                    <th className="text-left py-3 px-4">{t('admin.contact', 'Contact')}</th>
                    <th className="text-left py-3 px-4">{t('admin.role', 'Role')}</th>
                    <th className="text-left py-3 px-4">{t('admin.status', 'Status')}</th>
                    <th className="text-left py-3 px-4">{t('admin.joinedDate', 'Joined Date')}</th>
                    <th className="text-left py-3 px-4">{t('admin.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u.id === me?.userId;
                    const locked = isSelf || u.role === ROLES.ADMIN;
                    return (
                      <tr key={u.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <p className="font-semibold">{u.fullName}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm">{u.phoneNumber || '-'}</p>
                          <p className="text-sm text-gray-600">{u.email || '-'}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`badge ${ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-800'}`}>{roleLabel(u.role)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`badge ${u.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>
                            {u.isActive ? t('admin.active', 'Active') : t('admin.disabled', 'Disabled')}
                          </span>
                        </td>
                        <td className="py-4 px-4">{formatDate(u.createdAt)}</td>
                        <td className="py-4 px-4">
                          {locked ? (
                            <span className="text-gray-400 text-sm">-</span>
                          ) : (
                            <button
                              disabled={busyId === u.id}
                              onClick={() => toggleActive(u)}
                              className={`${u.isActive ? 'text-red-600' : 'text-primary'} hover:underline text-sm disabled:opacity-50`}
                            >
                              {u.isActive ? t('admin.disable', 'Disable') : t('admin.enable', 'Enable')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!error && <PaginationBar page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />}
        </div>
      </div>
    </Layout>
  );
};

export default Users;
