// ============================================
// src/components/customer/SalonList.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { salonService } from '../../services/salonService';
import Layout from '../common/Layout';
import { FiMapPin, FiPhone, FiStar } from 'react-icons/fi';

const SalonList = () => {
  const { t } = useTranslation();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    try {
      const data = await salonService.getAllSalons();     
      setSalons(data.salons);
    } catch (error) {
      console.error('Error fetching salons:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSalons = salons.filter(salon =>
    salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    salon.nameAr?.includes(searchTerm)
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-4">{t('nav.salons')}</h1>
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field max-w-md"
          />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSalons.map((salon) => (
            <Link
              key={salon.id}
              to={`/book?salon=${salon.id}`}
              className="card hover:shadow-xl transition-all group"
            >
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                {salon.logoUrl ? (
                  <img
                    src={salon.logoUrl}
                    alt={salon.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-6xl">💈</div>
                )}
              </div>

              <h3 className="text-xl font-semibold text-primary group-hover:text-accent transition-colors mb-2">
                {salon.name}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {salon.description}
              </p>

              <div className="space-y-2 text-sm text-gray-600">
                {salon.branches?.length > 0 && (
                  <div className="flex items-center">
                    <FiMapPin className="mr-2 flex-shrink-0" />
                    <span className="truncate">{salon.branches[0].address}</span>
                  </div>
                )}
                {salon.phoneNumber && (
                  <div className="flex items-center">
                    <FiPhone className="mr-2 flex-shrink-0" />
                    <span>{salon.phoneNumber}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <div className="flex items-center text-accent">
                  <FiStar className="mr-1 fill-current" />
                  <span className="font-semibold">4.8</span>
                  <span className="text-gray-500 text-sm ml-1">(124)</span>
                </div>
                <span className="text-primary font-medium group-hover:underline">
                  {t('booking.bookNow')} →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {filteredSalons.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-500">{t('common.noData')}</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SalonList;