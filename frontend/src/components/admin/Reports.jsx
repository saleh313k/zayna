// ============================================
// src/components/admin/Reports.jsx
// ============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../common/Layout';
import { FiDownload, FiCalendar, FiTrendingUp } from 'react-icons/fi';

const Reports = () => {
  const { t } = useTranslation();
  const [reportType, setReportType] = useState('revenue');
  const [dateRange, setDateRange] = useState('month');

  const reports = [
    { name: 'Revenue Report', type: 'revenue', icon: '💰' },
    { name: 'Bookings Report', type: 'bookings', icon: '📅' },
    { name: 'Customer Report', type: 'customers', icon: '👥' },
    { name: 'Salon Performance', type: 'salons', icon: '🏪' },
    { name: 'Payment Report', type: 'payments', icon: '💳' },
    { name: 'Cancellation Report', type: 'cancellations', icon: '❌' }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Generate and download system reports</p>
        </div>

        {/* Report Type Selection */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {reports.map((report) => (
            <button
              key={report.type}
              onClick={() => setReportType(report.type)}
              className={`card text-left hover:shadow-xl transition-all ${
                reportType === report.type ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{report.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold">{report.name}</p>
                  <p className="text-sm text-gray-600">View detailed analytics</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Report Configuration */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Report Configuration</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="input-field"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Format</label>
              <select className="input-field">
                <option>PDF</option>
                <option>Excel</option>
                <option>CSV</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="btn-primary w-full flex items-center justify-center space-x-2">
                <FiDownload />
                <span>Generate Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Report Preview */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Report Preview</h2>
            <span className="badge badge-confirmed">
              <FiTrendingUp className="inline mr-1" />
              +12% from last period
            </span>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">42,850 OMR</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
              <p className="text-2xl font-bold text-blue-600">1,432</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Avg. Booking Value</p>
              <p className="text-2xl font-bold text-purple-600">29.9 OMR</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
              <p className="text-2xl font-bold text-orange-600">94%</p>
            </div>
          </div>

          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FiCalendar className="mx-auto text-5xl text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Select parameters above to generate report</p>
            <button className="btn-primary">
              Generate Full Report
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;