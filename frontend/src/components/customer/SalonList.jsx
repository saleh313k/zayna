
// ============================================
// src/components/customer/SalonList.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { salonService } from '../../services/salonService';
import { bookingService } from '../../services/bookingService';
import { formatMoney, localized } from '../../utils/bookingFormat';
import Layout from '../common/Layout';
import { FiMapPin, FiPhone, FiStar } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toSlug } from './SalonDetail';


const SalonList = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [revealedPhones, setRevealedPhones] = useState({});
  // Registered, approved salons that can be booked online with Zayna (separate from the directory below).
  const [bookable, setBookable] = useState([]);

  useEffect(() => {
    let alive = true;
    bookingService.getBookableSalons()
      .then((d) => alive && setBookable(d.salons || []))
      .catch(() => alive && setBookable([])); // the directory below still works if this fails
    return () => { alive = false; };
  }, []);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSalons();
  }, []);

  const handleRevealPhone = (salonId) => {
    setRevealedPhones((prev) => ({
      ...prev,
      [salonId]: true,
    }));

    // اینجا بعدا میتونی API آمار بزنی
    // analyticsService.trackPhoneClick(salonId)
  };
  const fetchSalons = async () => {
    try {
      const data = await salonService.getAllPublicSalons();
      setSalons(data || []);
    } catch (error) {
      console.error('Error fetching salons:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSalons = salons.filter(
    (salon) =>
      salon.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        {/* Header */}
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

        {/* Book online with Zayna */}
        {bookable.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">{t('bookingFlow.bookOnlineTitle', 'Book online with Zayna')}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookable
                .filter((s) => {
                  const q = searchTerm.trim().toLowerCase();
                  return !q || s.name?.toLowerCase().includes(q) || s.nameAr?.includes(searchTerm.trim());
                })
                .map((s) => (
                  <div key={s.id} className="card hover:shadow-xl transition-all flex flex-col">
                    <span className="self-start px-3 py-1 text-xs font-semibold rounded-full bg-green-600 text-white mb-3">
                      {t('salon.verified', 'Verified')}
                    </span>
                    <h3 className="text-lg font-semibold mb-1">{localized(i18n.language, s.name, s.nameAr)}</h3>
                    <p className="text-sm text-gray-600 flex items-center mb-4">
                      <FiMapPin className="mr-2 rtl:mr-0 rtl:ml-2 shrink-0" />
                      {[s.city, s.address].filter(Boolean).join(' - ') || '-'}
                    </p>
                    <div className="mt-auto flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {t('bookingFlow.fromPrice', 'From {{price}}', { price: formatMoney(s.fromPrice) })}
                      </span>
                      <Link to={`/book?salonId=${s.id}`} className="btn-primary">
                        {t('bookingFlow.bookNow', 'Book now')}
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredSalons.map((salon) => {
            const isActive = salon.isActive === true;

            const CardWrapper = ({ children }) => {

              return (
                <div
                  className="card hover:shadow-xl transition-all group flex flex-col h-full"
                >
                  {!salon.isActive && (
                    <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                      Unclaimed
                    </span>
                  )}
                  {children}
                </div>
              );


              return <div className="card flex flex-col h-full">{children}</div>;
            };

            return (
              <CardWrapper key={salon.id}>
                <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {/* Image */}
                  {salon.photoUrl ? (
                    <img
                      src={salon.photoUrl}
                      alt={salon.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-6xl">💈</div>
                  )}
                </div>

                <div className="relative group inline-block mb-2">

                  {/* VERIFIED */}
                  {salon.isActive && (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-600 text-white shadow">
                      {t('salon.verified', 'Verified')}
                    </span>
                  )}

                  {/* CALL TO BOOK */}
                  {!salon.isActive && salon.phone && (
                    <>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 cursor-pointer">
                        {t('salon.unclaimed', 'Call to Book')}
                      </span>

                      {/* Tooltip */}
                      <div
                        className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          hidden group-hover:block
          bg-black text-white text-xs rounded-lg px-3 py-2
          whitespace-nowrap z-50
        "
                      >
                        {t(
                          'salon.callToBookTooltip',
                          'Online booking not available. Please call to book'
                        )}
                      </div>
                    </>
                  )}

                </div>

                {/* Name */}
                <Link to={`/salons/${toSlug(salon.city || 'muscat')}/${toSlug(salon.name)}-${salon.id}`}>
                  <h3 className="text-xl font-semibold text-primary group-hover:text-accent transition-colors mb-2">
                    {salon.name}
                  </h3>
                </Link>

                {/* Info */}
                <div className="space-y-2 text-sm text-gray-600">
                  {salon.address && (
                    <div className="flex items-center">
                      <FiMapPin className="mr-2 flex-shrink-0" />
                      <span className="truncate">{salon.address}</span>
                    </div>
                  )}

                  {salon.phone && (
                    <div
                      className="flex items-center select-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user) {
                          navigate('/login?redirect=salons');
                          return;
                        }
                        handleRevealPhone(salon.id);
                      }}
                    >
                      <FiPhone className="mr-2 flex-shrink-0" />
                      {!user ? (
                        <span className="text-gray-500 hover:text-primary transition">
                          ***** {t('auth.loginToView')}
                        </span>
                      ) : revealedPhones[salon.id] ? (
                        <span className="font-medium">{salon.phone}</span>
                      ) : (
                        <span className="tracking-widest text-gray-500 hover:text-primary transition">
                          ***** {t('salon.clickToShowNumber')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t flex justify-between items-center">
                  {/* Rating */}
                  {salon?.rating != null ? (
                    <div className="flex items-center text-accent">
                      <FiStar className="mr-1 fill-current text-sm" />

                      <span className="font-semibold">{Number(salon.rating).toFixed(1)}</span>

                      {salon.reviews != null && (
                        <span className="text-gray-500 text-sm ml-1">({salon.reviews})</span>
                      )}
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* CTA */}
                  <div className="flex flex-col items-end">
                    <span className="text-gray-500 text-sm">{t('salon.areYouTheOwner')}</span>

                    {isActive ? (
                      <span className="text-green-600 text-sm font-medium">
                        {t('salon.bookNow')}
                      </span>
                    ) : (
                      <Link
                        to={`/claim/${salon.id}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {t('salon.claim')}
                      </Link>
                    )}
                  </div>
                </div>
              </CardWrapper>
            );
          })}
        </div>

        {/* Empty */}
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
