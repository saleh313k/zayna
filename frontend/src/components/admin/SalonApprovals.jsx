// ============================================
// src/components/admin/SalonApprovals.jsx
// ============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../common/Layout';
import SalonApprovalsTable from './SalonApprovalsTable';

const SalonApprovals = () => {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">{t('admin.salonApprovals', 'Salon approvals')}</h1>
          <p className="text-gray-600">{t('admin.salonApprovalsSubtitle', 'Review new salons before they appear on Zayna')}</p>
        </div>

        <SalonApprovalsTable
          status={showAll ? 'all' : 'pending'}
          title={showAll ? t('admin.allSalons', 'All salons') : t('admin.pendingSalons', 'Pending salons')}
          headerAction={
            <label className="text-sm flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              {t('admin.showAllSalons', 'Show all salons')}
            </label>
          }
        />
      </div>
    </Layout>
  );
};

export default SalonApprovals;
