// ============================================
// src/components/customer/SalonDetail.jsx
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { salonService } from '../../services/salonService';
import Layout from '../common/Layout';
import {
  FiMapPin, FiPhone, FiGlobe, FiStar, FiChevronRight,
  FiCheckCircle, FiShare2, FiAlertCircle, FiCalendar,
  FiChevronDown, FiNavigation,
} from 'react-icons/fi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const toSlug = (name = '') =>
  name.toLowerCase().trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');

const buildCanonical = (city, slug) =>
  `${window.location.origin}/salons/${encodeURIComponent(city?.toLowerCase() || 'oman')}/${slug}`;

/** photo field — API returns photoURL or photoUrl */
const getPhoto = (salon) => salon.photoURL || salon.photoUrl || null;

/**
 * Meta description — built from real data, never fake.
 * Max 155 chars.
 */
const buildMetaDesc = (salon) => {
  const parts = [`${salon.name} in ${salon.city || 'Oman'}.`];
  if (salon.address)  parts.push(`Located at ${salon.address}.`);
  if (salon.rating)   parts.push(`Rated ${Number(salon.rating).toFixed(1)}/5 by ${salon.reviews || 0} customers.`);
  if (salon.isActive) parts.push('Book your appointment online.');
  else                parts.push('Call to book your appointment.');
  const text = parts.join(' ');
  return text.length > 155 ? text.slice(0, 152) + '...' : text;
};

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const parseOpeningHours = (str) => {
  if (!str || typeof str !== 'string') return [];
  
  const parsed = str.split(';').map((entry) => {
    const trimmed = entry.trim();
    const i = trimmed.indexOf(':');
    if (i === -1) return null;
    return { day: trimmed.slice(0, i).trim(), hours: trimmed.slice(i + 1).trim() };
  }).filter(Boolean);

  return parsed.sort((a, b) => {
    const ai = DAY_ORDER.indexOf(a.day);
    const bi = DAY_ORDER.indexOf(b.day);
    const aIdx = ai === -1 ? 99 : ai;
    const bIdx = bi === -1 ? 99 : bi;
    return aIdx - bIdx;
  });
};


const buildFAQItems = (salon, t, parsedHours) => {
  const faqs = [];

  // Booking
  if (salon.isActive) {
    faqs.push({
      q: t('faq.onlineBooking.q', `Does ${salon.name} accept online bookings?`),
      a: t('faq.onlineBooking.a_yes', `Yes, you can book an appointment at ${salon.name} directly online through our platform — no phone call needed.`),
    });
  } else if (salon.phone) {
    faqs.push({
      q: t('faq.onlineBooking.q', `Does ${salon.name} accept online bookings?`),
      a: t('faq.onlineBooking.a_no', `${salon.name} currently accepts bookings by phone. Call ${salon.phone} to reserve your appointment.`),
    });
  }

  // Hours today
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayEntry = parsedHours.find((e) => e.day === todayName);
  if (todayEntry) {
    faqs.push({
      q: t('faq.hoursToday.q', `What are ${salon.name}'s opening hours today?`),
      a: t('faq.hoursToday.a', `Today (${todayName}), ${salon.name} is open: ${todayEntry.hours}.`),
    });
  }

  // Location
  if (salon.address) {
    faqs.push({
      q: t('faq.location.q', `Where is ${salon.name} located?`),
      a: t('faq.location.a', `${salon.name} is located at ${salon.address}${salon.city ? ', ' + salon.city : ''}, Oman.`),
    });
  }

  // Phone
  if (salon.phone) {
    faqs.push({
      q: t('faq.phone.q', `What is the phone number for ${salon.name}?`),
      a: t('faq.phone.a', `You can reach ${salon.name} at ${salon.phone}.`),
    });
  }

  return faqs;
};

// ─── JSON-LD builders ─────────────────────────────────────────────────────────

const buildLocalBusinessSchema = (salon, canonical, parsedHours) => ({
  '@context': 'https://schema.org',
  '@type'   : 'BeautySalon',
  '@id'     : canonical,
  name      : salon.name,
  url       : canonical,
  telephone : salon.phone   || undefined,
  image     : getPhoto(salon) ? [getPhoto(salon)] : undefined,
  address   : {
    '@type'         : 'PostalAddress',
    streetAddress   : salon.address  || undefined,
    addressLocality : salon.city     || 'Muscat',
    addressCountry  : 'OM',
  },
  geo: salon.lat && salon.lng
    ? { '@type': 'GeoCoordinates', latitude: salon.lat, longitude: salon.lng }
    : undefined,
  aggregateRating: salon.rating != null
    ? {
        '@type'     : 'AggregateRating',
        ratingValue : Number(salon.rating).toFixed(1),
        reviewCount : salon.reviews ?? 1,
        bestRating  : 5,
        worstRating : 1,
      }
    : undefined,
  openingHoursSpecification: parsedHours.length
    ? parsedHours.map(({ day, hours }) => {
        const [open, close] = hours.split('–').map((s) => s.trim());
        return {
          '@type'   : 'OpeningHoursSpecification',
          dayOfWeek : `https://schema.org/${day}`,
          opens     : open  || '00:00',
          closes    : close || '23:59',
        };
      })
    : undefined,
});

const buildBreadcrumbSchema = (salon, canonical) => ({
  '@context'      : 'https://schema.org',
  '@type'         : 'BreadcrumbList',
  itemListElement : [
    { '@type': 'ListItem', position: 1, name: 'Home',     item: window.location.origin },
    { '@type': 'ListItem', position: 2, name: 'Salons',   item: `${window.location.origin}/salons` },
    { '@type': 'ListItem', position: 3, name: salon.name, item: canonical },
  ],
});

const buildFAQSchema = (faqs) => ({
  '@context'  : 'https://schema.org',
  '@type'     : 'FAQPage',
  mainEntity  : faqs.map(({ q, a }) => ({
    '@type'        : 'Question',
    name           : q,
    acceptedAnswer : { '@type': 'Answer', text: a },
  })),
});

// ─── Sub-components ───────────────────────────────────────────────────────────

const RatingStars = ({ rating, reviews }) => (
  <div className="flex items-center gap-1" aria-label={`Rated ${rating} out of 5`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <FiStar key={star} className={`w-4 h-4 ${star <= Math.round(rating) ? 'fill-accent text-accent' : 'text-gray-300'}`} />
    ))}
    <span className="ml-1 font-semibold text-primary">{Number(rating).toFixed(1)}</span>
    {reviews != null && (
      <span className="text-gray-500 text-sm ml-1">
        ({reviews} {reviews === 1 ? 'review' : 'reviews'})
      </span>
    )}
  </div>
);

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-0">
      <button
        className="w-full flex items-center justify-between py-3 text-left gap-4"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="font-medium text-primary text-sm">{q}</span>
        <FiChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="pb-3 text-sm text-gray-600 leading-relaxed">{a}</p>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SalonDetail = () => {
  const { slug, city } = useParams();
  const { t, i18n }   = useTranslation();
  const { user }      = useAuth();
  const navigate      = useNavigate();

  // UUID is always the last 5 dash-segments of the slug
  const salonId = slug.split('-').slice(-5).join('-');

  const [salon,         setSalon        ] = useState(null);
  const [loading,       setLoading      ] = useState(true);
  const [notFound,      setNotFound     ] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [shareMsg,      setShareMsg     ] = useState('');

  // ── Fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchSalon = async () => {
      try {
        const data = await salonService.getPublicSalonById(salonId);
        if (!data) { setNotFound(true); return; }
        setSalon(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchSalon();
  }, [salonId]);

  // ── Share ──────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: salon?.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      setShareMsg(t('salon.linkCopied', 'Link copied!'));
      setTimeout(() => setShareMsg(''), 2500);
    }
  }, [salon, t]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64" aria-busy="true">
          <div className="spinner" role="status">
            <span className="sr-only">{t('common.loading', 'Loading…')}</span>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────
  if (notFound || !salon) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto text-center py-24">
          <FiAlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary mb-2">
            {t('salon.notFound', 'Salon not found')}
          </h1>
          <p className="text-gray-500 mb-6">
            {t('salon.notFoundDesc', 'This page may have moved or been removed.')}
          </p>
          <Link to="/salons" className="btn-primary">
            {t('salon.browseSalons', 'Browse all salons')}
          </Link>
        </div>
      </Layout>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────
  const photo      = getPhoto(salon);
  const salonSlug  = toSlug(salon.name);
  const salonCity  = city || salon.city || 'oman';
  const canonical  = buildCanonical(salonCity, salonSlug);
  const pageTitle  = `${salon.name} | ${salonCity} Salon | Book Online`;
  const metaDesc   = buildMetaDesc(salon);

  const parsedHours = parseOpeningHours(salon.openingHours);
  const todayName   = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const faqItems = buildFAQItems(salon, t, parsedHours);

  const lbSchema        = buildLocalBusinessSchema(salon, canonical, parsedHours);
  const breadcrumbSchema = buildBreadcrumbSchema(salon, canonical);
  const faqSchema       = faqItems.length ? buildFAQSchema(faqItems) : null;

  const mapsDirectionsUrl = salon.lat && salon.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${salon.lat},${salon.lng}`
    : `https://maps.google.com/?q=${encodeURIComponent(salon.address || salon.name)}`;

  return (
    <Layout>

      {/* ════════════════════════════════════════
          SEO HEAD
      ════════════════════════════════════════ */}
      <Helmet>
        <html lang={i18n.language} />
        <title>{pageTitle}</title>
        <meta name="description"  content={metaDesc} />
        <link rel="canonical"     href={canonical} />

        <link rel="alternate" hreflang="en"        href={`${window.location.origin}/en/salons/${salonCity}/${salonSlug}`} />
        <link rel="alternate" hreflang="ar"        href={`${window.location.origin}/ar/salons/${salonCity}/${salonSlug}`} />
        <link rel="alternate" hreflang="x-default" href={canonical} />

        <meta property="og:type"             content="business.business" />
        <meta property="og:title"            content={pageTitle} />
        <meta property="og:description"      content={metaDesc} />
        <meta property="og:url"              content={canonical} />
        {photo && <meta property="og:image"  content={photo} />}
        <meta property="og:locale"           content="en_OM" />
        <meta property="og:locale:alternate" content="ar_OM" />

        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content={pageTitle} />
        <meta name="twitter:description" content={metaDesc} />
        {photo && <meta name="twitter:image" content={photo} />}

        <script type="application/ld+json">{JSON.stringify(lbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        {faqSchema && (
          <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        )}
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Breadcrumb ──────────────────────────────────────── */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-gray-500 mb-6">
          <Link to="/"       className="hover:text-primary transition">{t('nav.home',   'Home')}</Link>
          <FiChevronRight className="w-3 h-3" />
          <Link to="/salons" className="hover:text-primary transition">{t('nav.salons', 'Salons')}</Link>
          <FiChevronRight className="w-3 h-3" />
          <span className="text-primary font-medium truncate">{salon.name}</span>
        </nav>

        {/* ── Hero ────────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden aspect-[16/6] bg-gradient-to-br from-primary/20 to-accent/20 mb-8">
          {photo ? (
            <img
              src={photo}
              alt={`${salon.name} – salon in ${salonCity}, Oman`}
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
              width="1200"
              height="450"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-8xl" aria-hidden="true">💈</div>
          )}

          {/* Status badge */}
          <div className="absolute top-4 left-4">
            {salon.isActive ? (
              <span className="flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow">
                <FiCheckCircle className="w-3 h-3" />
                {t('salon.verified', 'Verified')}
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-yellow-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow">
                {t('salon.unclaimed', 'Call to Book')}
              </span>
            )}
          </div>

          {/* Share */}
          <button
            onClick={handleShare}
            aria-label={t('salon.share', 'Share this salon')}
            className="absolute top-4 right-4 bg-white/80 hover:bg-white transition rounded-full p-2 shadow"
          >
            <FiShare2 className="w-4 h-4 text-primary" />
          </button>
          {shareMsg && (
            <div className="absolute top-14 right-4 bg-black text-white text-xs px-3 py-1.5 rounded-lg shadow">
              {shareMsg}
            </div>
          )}
        </div>

        {/* ── Two-column layout ────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ══════════════════════════════
              LEFT — Info
          ══════════════════════════════ */}
          <div className="lg:col-span-2 space-y-8">

            {/* Name + Rating */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {salon.name}
              </h1>
              {salon.rating != null && (
                <RatingStars rating={salon.rating} reviews={salon.reviews} />
              )}
            </div>

            {/* Opening Hours */}
            {parsedHours.length > 0 && (
              <section aria-labelledby="hours-heading">
                <h2 id="hours-heading" className="text-xl font-semibold text-primary mb-4">
                  {t('salon.workingHours', 'Opening Hours')}
                </h2>
                <div className="card divide-y">
                  {parsedHours.map(({ day, hours }) => {
                    const isToday = day === todayName;
                    return (
                      <div key={day} className={`flex justify-between py-2.5 text-sm ${isToday ? 'font-semibold' : ''}`}>
                        <span className={isToday ? 'text-accent' : 'text-primary'}>
                          {day}
                          {isToday && (
                            <span className="ml-2 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                              {t('salon.today', 'Today')}
                            </span>
                          )}
                        </span>
                        <span className="text-gray-600">{hours || t('salon.closed', 'Closed')}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* FAQ */}
            {faqItems.length > 0 && (
              <section aria-labelledby="faq-heading">
                <h2 id="faq-heading" className="text-xl font-semibold text-primary mb-4">
                  {t('salon.faq', 'Frequently Asked Questions')}
                </h2>
                <div className="card divide-y">
                  {faqItems.map((item, i) => (
                    <FAQItem key={i} q={item.q} a={item.a} />
                  ))}
                </div>
              </section>
            )}

            {/* Reviews placeholder
                ─────────────────────────────────────────────────────────────
                وقتی سیستم review اضافه کردی، این بخش رو با داده واقعی پر کن.
                schema رو هم به lbSchema اضافه کن:
                "review": [{ "@type": "Review", "reviewRating": {...}, "author": {...} }]
                ─────────────────────────────────────────────────────────────
            */}

            {/* Internal links — salons in same city
                ─────────────────────────────────────────────────────────────
                وقتی API آماده شد، یه fetch به /salons?city=X&limit=4 بزن
                و اینجا کارت‌های لینک بذار. مثال:
                <Link to={`/salons/${city}/${toSlug(s.name)}-${s.id}`}>
                ─────────────────────────────────────────────────────────────
            */}
            <section aria-labelledby="nearby-heading">
              <h2 id="nearby-heading" className="text-xl font-semibold text-primary mb-2">
                {t('salon.moreSalons', `More salons in ${salonCity}`)}
              </h2>
              <Link
                to={`/salons?city=${encodeURIComponent(salonCity)}`}
                className="text-sm text-primary hover:underline"
              >
                {t('salon.viewAllInCity', `View all salons in ${salonCity}`)} →
              </Link>
            </section>

          </div>

          {/* ══════════════════════════════
              RIGHT — Sticky sidebar
          ══════════════════════════════ */}
          <aside className="space-y-4 lg:sticky lg:top-24 self-start">

            {/* Contact */}
            <div className="card space-y-3">
              <h2 className="font-semibold text-primary">
                {t('salon.contactInfo', 'Contact Info')}
              </h2>

              {salon.address && (
                <a
                  href={mapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-sm text-gray-600 hover:text-primary transition"
                >
                  <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
                  <span>{salon.address}</span>
                </a>
              )}

              {salon.phone && (
                <div
                  className="flex items-center gap-2 text-sm cursor-pointer select-none"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!user) {
                      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
                      return;
                    }
                    setPhoneRevealed(true);
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !user) navigate('/login'); }}
                >
                  <FiPhone className="w-4 h-4 flex-shrink-0 text-accent" />
                  {!user ? (
                    <span className="text-gray-400">{t('auth.loginToView', 'Login to view number')}</span>
                  ) : phoneRevealed ? (
                    <a href={`tel:${salon.phone}`} className="font-medium text-primary hover:underline">
                      {salon.phone}
                    </a>
                  ) : (
                    <span className="text-gray-400 hover:text-primary transition">
                      {t('salon.clickToShowNumber', 'Click to show number')}
                    </span>
                  )}
                </div>
              )}

              {salon.website && (
                <a
                  href={salon.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition"
                >
                  <FiGlobe className="w-4 h-4 text-accent" />
                  {t('salon.website', 'Website')}
                </a>
              )}

              {/* Directions shortcut */}
              <a
                href={mapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-accent transition"
              >
                <FiNavigation className="w-4 h-4 text-accent" />
                {t('salon.getDirections', 'Get Directions')}
              </a>
            </div>

            {/* CUSTOMER CTA */}
            <div className="card bg-primary text-white space-y-3">
              <h2 className="font-semibold text-lg">
                {t('salon.bookAppointment', 'Book an Appointment')}
              </h2>
              <p className="text-white/70 text-sm">
                {salon.isActive
                  ? t('salon.bookOnlineDesc', 'Reserve your spot instantly, no waiting.')
                  : t('salon.callToBookDesc', 'Call us to check availability and book your visit.')}
              </p>

              {salon.isActive ? (
                <Link
                  to={`/salon/${salon.id}/book`}
                  className="flex items-center justify-center gap-2 w-full bg-white text-primary font-semibold py-3 rounded-xl hover:bg-accent hover:text-white transition"
                >
                  <FiCalendar className="w-4 h-4" />
                  {t('salon.bookNow', 'Book Now')}
                </Link>
              ) : phoneRevealed && salon.phone ? (
                <a
                  href={`tel:${salon.phone}`}
                  className="flex items-center justify-center gap-2 w-full bg-white text-primary font-semibold py-3 rounded-xl hover:bg-accent hover:text-white transition"
                >
                  <FiPhone className="w-4 h-4" />
                  {salon.phone}
                </a>
              ) : (
                <button
                  onClick={() => {
                    if (!user) {
                      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
                      return;
                    }
                    setPhoneRevealed(true);
                  }}
                  className="flex items-center justify-center gap-2 w-full bg-white text-primary font-semibold py-3 rounded-xl hover:bg-accent hover:text-white transition"
                >
                  <FiPhone className="w-4 h-4" />
                  {!user
                    ? t('auth.loginToView', 'Login to view number')
                    : t('salon.showPhone', 'Show Phone Number')}
                </button>
              )}
            </div>

            {/* OWNER CTA */}
            {!salon.isActive && (
              <div className="card border-2 border-dashed border-primary/30 text-center space-y-2">
                <p className="text-sm font-medium text-primary">
                  {t('salon.areYouTheOwner', 'Are you the owner?')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('salon.claimDesc', 'Claim this page to enable online booking and manage your profile.')}
                </p>
                <Link
                  to={`/claim/${salon.id}`}
                  className="inline-block mt-1 w-full text-center bg-primary/10 text-primary font-semibold py-2.5 rounded-xl hover:bg-primary hover:text-white transition text-sm"
                >
                  {t('salon.claimThisPage', "Claim This Page – It's Free")}
                </Link>
              </div>
            )}

          </aside>
        </div>

        {/* ── Map ─────────────────────────────────────────────── */}
        {(salon.lat && salon.lng) && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold text-primary mb-4">
              {t('salon.location', 'Location')}
            </h2>
            <div className="relative rounded-2xl overflow-hidden aspect-[16/6]">
              <iframe
                title={`${salon.name} location on Google Maps`}
                src={`https://www.google.com/maps?q=${salon.lat},${salon.lng}&z=15&output=embed`}
                className="w-full h-full border-0 pointer-events-none select-none"
                loading="lazy"
              />
              {/* Overlay + CTA */}
              <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <p className="text-white font-semibold text-sm drop-shadow">
                  {salon.address}
                </p>
                <a
                  href={mapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white/90 backdrop-blur-md text-primary font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg hover:bg-white transition"
                >
                  <FiNavigation className="w-4 h-4" />
                  {t('salon.getDirections', 'Get Directions')}
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default SalonDetail;