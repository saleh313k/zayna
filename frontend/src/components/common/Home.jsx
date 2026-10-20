import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiGrid,
  FiMapPin,
  FiPhone,
  FiScissors,
  FiSearch,
  FiShield,
  FiStar,
  FiTrendingUp,
  FiUsers,
  FiX,
  FiZap,
} from "react-icons/fi";
import LanguageSwitcher from "./LanguageSwitcher";
import { salonService } from "../../services/salonService";
import { useAuth } from "../../contexts/AuthContext";
import { toSlug } from "../customer/SalonDetail";
import  Navbar  from "./Navbar"

/* =========================================================
   Helpers
   ========================================================= */

function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [ref, shown];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, shown] = useReveal();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(18px)",
        transition: `opacity .65s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .65s cubic-bezier(.16,1,.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function Stars({ value = 0 }) {
  const rounded = Math.round(Number(value) || 0);

  return (
    <span aria-hidden="true" className="zy-stars">
      {"★".repeat(rounded)}
      <span className="zy-stars-muted">{"★".repeat(Math.max(0, 5 - rounded))}</span>
    </span>
  );
}

function Lattice({ className = "", opacity = 1 }) {
  return (
    <svg
      viewBox="0 0 240 240"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      <defs>
        <pattern id="zaynaLatticeUnit" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M20 2 L38 20 L20 38 L2 20 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
          />
          <circle cx="20" cy="20" r="3.2" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="240" height="240" fill="url(#zaynaLatticeUnit)" />
    </svg>
  );
}

function Eyebrow({ children }) {
  return (
    <span className="zy-eyebrow">
      <span />
      {children}
    </span>
  );
}

function SectionDivider() {
  return <div className="zy-divider" />;
}

/* =========================================================
   Main page
   ========================================================= */

export default function ZaynaLanding() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [lang, setLang] = useState(localStorage.getItem('language'));
  const [salons, setSalons] = useState([]);
  const [salonsLoading, setSalonsLoading] = useState(true);
  const [salonSearch, setSalonSearch] = useState("");
  const [revealedPhones, setRevealedPhones] = useState({});
  const [salonError, setSalonError] = useState(false);

  const isAr = lang === "ar";

  const salonCarouselRef = useRef(null);

  const pricingOwnerCard = t("home.pricingOwnerCard", {
    returnObjects: true,
  });

  const pricingCustomerCard = t("home.pricingCustomerCard", {
    returnObjects: true,
  });

  const fetchSalons = useCallback(async () => {
    setSalonsLoading(true);
    setSalonError(false);

    try {
      const data = await salonService.getAllPublicSalons();
      setSalons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching salons:", error);
      setSalonError(true);
      setSalons([]);
    } finally {
      setSalonsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalons();
  }, [fetchSalons]);

  const scrollSalons = useCallback(
    (direction) => {
      const el = salonCarouselRef.current;
      if (!el) return;

      const amount = Math.min(el.clientWidth * 0.78, 760);
      const rtl = isAr;
      const signed = direction === "next" ? amount : -amount;

      el.scrollBy({
        left: rtl ? -signed : signed,
        behavior: "smooth",
      });
    },
    [isAr]
  );

  const handleRevealPhone = (salonId) => {
    if (!user) {
      navigate("/login?redirect=salons");
      return;
    }

    setRevealedPhones((prev) => ({
      ...prev,
      [salonId]: true,
    }));
  };

  const filteredSalons = salons.filter((salon) => {
    const q = salonSearch.trim().toLowerCase();
    if (!q) return true;

    return (
      salon.name?.toLowerCase().includes(q) ||
      salon.nameAr?.includes(salonSearch.trim()) ||
      salon.city?.toLowerCase().includes(q) ||
      salon.cityAr?.includes(salonSearch.trim()) ||
      salon.address?.toLowerCase().includes(q)
    );
  });

  const featuredSalons = filteredSalons.slice(0, 8);

  const getSalonName = (salon) =>
    isAr ? salon.nameAr || salon.name : salon.name || salon.nameAr;

  const getSalonCity = (salon) =>
    isAr
      ? salon.cityAr || salon.city || salon.address
      : salon.city || salon.address || salon.cityAr;

  return (
    <div
      className="zy-page"
    >
      <style>{`

        :root {
          --zy-ink: #14201E;
          --zy-sand: #F5EFE3;
          --zy-sand-deep: #ECE2CE;
          --zy-teal: #0E4F46;
          --zy-teal-deep: #0A3833;
          --zy-copper: #C0764A;
          --zy-copper-deep: #A05F39;
          --zy-gold: #B5862B;
          --zy-cloud: #FFFEFB;
          --zy-border: rgba(20,32,30,.09);
          --zy-muted: rgba(20,32,30,.63);
        }

        * { box-sizing: border-box; }

        html { scroll-behavior: smooth; }

        .zy-page {
          min-height: 100vh;
          overflow-x: hidden;
          color: var(--zy-ink);
          background: var(--zy-sand);
          font-family: ${isAr ? "'Tajawal'" : "'Inter'"}, "Segoe UI", sans-serif;
        }

        .zy-display {
          font-family: ${isAr ? "'Markazi Text'" : "'Cormorant Garamond'"}, serif;
        }

        .zy-container {
          width: min(1180px, calc(100% - 48px));
          margin-inline: auto;
        }

        .zy-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border-radius: 999px;
          text-decoration: none;
          border: 0;
          cursor: pointer;
          transition: transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s ease, background .22s ease, border-color .22s ease;
        }

        .zy-btn:hover { transform: translateY(-2px); }
        .zy-btn:active { transform: translateY(0) scale(.98); }

        .zy-focus:focus-visible {
          outline: 2px solid var(--zy-gold);
          outline-offset: 3px;
        }

        .zy-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(245,239,227,.88);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--zy-border);
        }

        .zy-nav-inner {
          min-height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
        }

        .zy-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--zy-ink);
          text-decoration: none;
        }

        .zy-brand-mark {
          width: 30px;
          height: 30px;
          color: var(--zy-teal);
        }

        .zy-brand-name {
          font-size: 27px;
          line-height: 1;
          font-weight: 600;
          letter-spacing: .5px;
        }

        .zy-nav-links {
          display: flex;
          align-items: center;
          gap: 30px;
          font-size: 14px;
        }

        .zy-nav-links a {
          color: var(--zy-ink);
          text-decoration: none;
          opacity: .82;
          transition: opacity .2s ease;
        }

        .zy-nav-links a:hover { opacity: 1; }

        .zy-nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .zy-hero {
          position: relative;
          padding: 120px 0 72px;
        }

        .zy-hero-grid {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1.02fr) minmax(420px, .98fr);
          gap: 60px;
          align-items: center;
        }

        .zy-hero-bg {
          position: absolute;
          inset-inline-end: -120px;
          top: -90px;
          width: 420px;
          height: 420px;
          color: var(--zy-teal);
          pointer-events: none;
        }

        .zy-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 13px;
          border: 1px solid var(--zy-border);
          background: rgba(255,254,251,.82);
          border-radius: 999px;
          color: var(--zy-teal-deep);
          font-size: 12px;
          font-weight: 700;
        }

        .zy-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--zy-copper);
          box-shadow: 0 0 0 4px rgba(192,118,74,.10);
        }

        .zy-hero-title {
          margin: 22px 0 0;
          font-size: clamp(48px, 6vw, 76px);
          line-height: .98;
          font-weight: 600;
          letter-spacing: -.7px;
        }

        .zy-hero-title span {
          color: var(--zy-copper);
          font-style: italic;
        }

        .zy-hero-copy {
          max-width: 520px;
          margin: 24px 0 30px;
          color: var(--zy-muted);
          font-size: 17px;
          line-height: 1.75;
        }

        .zy-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 42px;
        }

        .zy-primary {
          padding: 14px 23px;
          background: var(--zy-teal);
          color: var(--zy-cloud);
          box-shadow: 0 16px 34px -16px rgba(14,79,70,.60);
        }

        .zy-secondary {
          padding: 13px 22px;
          background: transparent;
          color: var(--zy-ink);
          border: 1px solid rgba(20,32,30,.22);
        }

        .zy-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 34px;
        }

        .zy-stat-number {
          font-size: 29px;
          line-height: 1;
          color: var(--zy-teal-deep);
        }

        .zy-stat-label {
          max-width: 120px;
          margin-top: 5px;
          color: rgba(20,32,30,.56);
          font-size: 12px;
          line-height: 1.45;
        }

        /* SaaS product preview */
        .zy-product-preview {
          position: relative;
          min-height: 480px;
        }

        .zy-dashboard {
          position: absolute;
          inset: 10px 0 0 30px;
          padding: 14px;
          background: #fff;
          border: 1px solid rgba(20,32,30,.08);
          border-radius: 26px;
          box-shadow: 0 35px 75px -30px rgba(20,32,30,.40);
          transform: rotate(1.2deg);
        }

        .zy-dashboard-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 4px 4px 13px;
        }

        .zy-dashboard-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
        }

        .zy-dashboard-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--zy-copper);
        }

        .zy-dashboard-user {
          width: 27px;
          height: 27px;
          border-radius: 50%;
          background: var(--zy-sand-deep);
        }

        .zy-dashboard-body {
          display: grid;
          grid-template-columns: 92px 1fr;
          min-height: 410px;
          overflow: hidden;
          border-radius: 18px;
          background: #faf9f5;
          border: 1px solid rgba(20,32,30,.06);
        }

        .zy-dashboard-side {
          padding: 14px 9px;
          background: var(--zy-teal-deep);
          color: #fff;
        }

        .zy-side-logo {
          width: 31px;
          height: 31px;
          margin: 0 auto 20px;
          border-radius: 10px;
          background: rgba(255,255,255,.10);
          display: grid;
          place-items: center;
        }

        .zy-side-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          padding: 9px 4px;
          margin-bottom: 4px;
          border-radius: 10px;
          color: rgba(255,255,255,.62);
          font-size: 8px;
        }

        .zy-side-item.active {
          color: #fff;
          background: rgba(255,255,255,.11);
        }

        .zy-dashboard-main {
          padding: 16px;
        }

        .zy-mini-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 13px;
        }

        .zy-mini-heading strong {
          font-size: 14px;
        }

        .zy-mini-heading span {
          font-size: 8px;
          color: var(--zy-muted);
        }

        .zy-kpis {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 11px;
        }

        .zy-kpi {
          padding: 10px;
          background: #fff;
          border: 1px solid rgba(20,32,30,.06);
          border-radius: 12px;
        }

        .zy-kpi small {
          display: block;
          color: #818985;
          font-size: 7px;
          margin-bottom: 5px;
        }

        .zy-kpi strong {
          font-size: 14px;
        }

        .zy-kpi em {
          display: block;
          margin-top: 3px;
          color: var(--zy-teal);
          font-size: 7px;
          font-style: normal;
          font-weight: 700;
        }

        .zy-calendar {
          padding: 11px;
          background: #fff;
          border: 1px solid rgba(20,32,30,.06);
          border-radius: 13px;
        }

        .zy-calendar-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 9px;
          font-size: 8px;
          font-weight: 700;
        }

        .zy-calendar-row {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 5px;
        }

        .zy-slot {
          min-height: 36px;
          padding: 5px 3px;
          border-radius: 7px;
          background: #f7f5ef;
          border: 1px solid #ece9df;
          font-size: 7px;
          color: #66716d;
        }

        .zy-slot.booked {
          background: rgba(14,79,70,.10);
          border-color: rgba(14,79,70,.16);
          color: var(--zy-teal-deep);
          font-weight: 700;
        }

        .zy-slot.selected {
          background: var(--zy-copper);
          border-color: var(--zy-copper);
          color: #fff;
        }

        .zy-floating-card {
          position: absolute;
          z-index: 3;
          padding: 15px 17px;
          background: var(--zy-teal);
          color: #fff;
          border-radius: 18px;
          box-shadow: 0 25px 50px -20px rgba(14,79,70,.65);
        }

        .zy-floating-booking {
          inset-inline-start: -8px;
          bottom: 18px;
          width: 190px;
        }

        .zy-floating-booking small,
        .zy-floating-live small {
          display: block;
          margin-bottom: 4px;
          font-size: 9px;
          opacity: .68;
        }

        .zy-floating-booking strong {
          font-size: 13px;
        }

        .zy-floating-live {
          inset-inline-end: -12px;
          top: 54px;
          width: 155px;
          background: var(--zy-cloud);
          color: var(--zy-ink);
          border: 1px solid rgba(20,32,30,.08);
          box-shadow: 0 22px 45px -22px rgba(20,32,30,.38);
        }

        .zy-live-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .zy-live-check {
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          color: var(--zy-teal);
          background: rgba(14,79,70,.10);
        }

        /* Proof / feature band */
        .zy-proof-band {
          padding: 18px 0;
          background: var(--zy-teal-deep);
          color: #fff;
        }

        .zy-proof-inner {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        .zy-proof-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 4px;
        }

        .zy-proof-icon {
          width: 34px;
          height: 34px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: rgba(255,255,255,.10);
        }

        .zy-proof-item strong {
          display: block;
          font-size: 12px;
        }

        .zy-proof-item span {
          display: block;
          margin-top: 2px;
          color: rgba(255,255,255,.58);
          font-size: 9px;
        }

        .zy-section {
          padding: 86px 0;
        }

        .zy-section-head {
          text-align: center;
          margin-bottom: 48px;
        }

        .zy-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--zy-copper-deep);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .zy-eyebrow > span {
          width: 18px;
          height: 1.5px;
          background: currentColor;
        }

        .zy-section-title {
          max-width: 760px;
          margin: 10px auto 0;
          font-size: clamp(34px, 4vw, 48px);
          line-height: 1.06;
          font-weight: 600;
        }

        .zy-section-sub {
          max-width: 620px;
          margin: 13px auto 0;
          color: var(--zy-muted);
          font-size: 15px;
          line-height: 1.7;
        }

        .zy-feature-group {
          margin-bottom: 45px;
        }

        .zy-feature-label {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 18px;
          color: var(--zy-teal);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .7px;
          text-transform: uppercase;
        }

        .zy-feature-label.copper { color: var(--zy-copper-deep); }

        .zy-feature-label i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .zy-feature-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .zy-card {
          height: 100%;
          padding: 25px 21px;
          background: var(--zy-cloud);
          border: 1px solid var(--zy-border);
          border-radius: 20px;
          transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s ease;
        }

        .zy-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 25px 50px -30px rgba(20,32,30,.36);
        }

        .zy-feature-icon {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          margin-bottom: 15px;
          border-radius: 11px;
          color: var(--zy-teal);
          background: rgba(14,79,70,.08);
        }

        .zy-feature-title {
          margin: 0 0 7px;
          font-size: 15px;
          line-height: 1.35;
        }

        .zy-feature-body {
          margin: 0;
          color: var(--zy-muted);
          font-size: 13px;
          line-height: 1.6;
        }

        /* Live salon discovery */
        .zy-salon-section {
          padding: 86px 0;
          overflow: hidden;
          background: rgba(255,254,251,.34);
        }

        .zy-salon-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 25px;
          margin-bottom: 27px;
        }

        .zy-salon-title {
          margin: 8px 0 6px;
          font-size: clamp(32px, 3.7vw, 44px);
          line-height: 1.05;
          font-weight: 600;
        }

        .zy-salon-sub {
          max-width: 540px;
          margin: 0;
          color: var(--zy-muted);
          font-size: 14.5px;
          line-height: 1.65;
        }

        .zy-salon-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 0 0 auto;
        }

        .zy-circle-btn {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(20,32,30,.16);
          border-radius: 50%;
          background: var(--zy-cloud);
          color: var(--zy-ink);
          cursor: pointer;
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .zy-circle-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 22px -15px rgba(20,32,30,.5);
        }

        .zy-salon-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 19px;
        }

        .zy-search {
          position: relative;
          width: min(390px, 100%);
        }

        .zy-search svg {
          position: absolute;
          inset-inline-start: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #8a938f;
        }

        .zy-search input {
          width: 100%;
          height: 44px;
          padding: 0 40px 0 40px;
          border: 1px solid rgba(20,32,30,.12);
          border-radius: 13px;
          background: var(--zy-cloud);
          color: var(--zy-ink);
          outline: none;
          font: inherit;
          font-size: 13px;
        }

        .zy-search input:focus {
          border-color: rgba(14,79,70,.42);
          box-shadow: 0 0 0 3px rgba(14,79,70,.07);
        }

        .zy-salon-count {
          color: #7a837f;
          font-size: 12px;
        }

        .zy-salon-scroll {
          display: flex;
          gap: 17px;
          overflow-x: auto;
          padding: 4px 2px 20px;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
        }

        .zy-salon-scroll::-webkit-scrollbar { display: none; }

        .zy-salon-card {
          flex: 0 0 285px;
          scroll-snap-align: start;
          overflow: hidden;
          background: var(--zy-cloud);
          border: 1px solid var(--zy-border);
          border-radius: 20px;
          box-shadow: 0 10px 28px -25px rgba(20,32,30,.35);
          transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s ease;
        }

        .zy-salon-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 25px 50px -28px rgba(20,32,30,.35);
        }

        .zy-salon-image {
          position: relative;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(14,79,70,.17), rgba(192,118,74,.16));
        }

        .zy-salon-image img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .zy-salon-placeholder {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: var(--zy-teal);
          font-size: 38px;
        }

        .zy-status {
          position: absolute;
          top: 11px;
          inset-inline-start: 11px;
          padding: 5px 9px;
          border-radius: 999px;
          background: rgba(255,255,255,.92);
          backdrop-filter: blur(5px);
          font-size: 10px;
          font-weight: 800;
        }

        .zy-status.verified { color: #19724b; }
        .zy-status.unclaimed { color: #9a6a10; }

        .zy-salon-body {
          padding: 16px 17px 17px;
        }

        .zy-salon-name {
          display: block;
          margin-bottom: 6px;
          color: var(--zy-ink);
          text-decoration: none;
          font-size: 16px;
          font-weight: 750;
          line-height: 1.35;
        }

        .zy-salon-name:hover { color: var(--zy-copper-deep); }

        .zy-salon-location {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          color: #707b76;
          font-size: 11.5px;
        }

        .zy-salon-location span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .zy-salon-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 13px;
        }

        .zy-verified-pill {
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(14,79,70,.08);
          color: var(--zy-teal);
          font-size: 10px;
          font-weight: 800;
        }

        .zy-rating {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--zy-copper-deep);
          font-size: 11px;
          font-weight: 700;
        }

        .zy-phone {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 11px;
          padding-top: 11px;
          border-top: 1px solid rgba(20,32,30,.07);
          color: #69746f;
          font-size: 11px;
          cursor: pointer;
        }

        .zy-phone:hover { color: var(--zy-teal); }

        .zy-salon-footer {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
          margin-top: 13px;
          padding-top: 11px;
          border-top: 1px solid rgba(20,32,30,.07);
        }

        .zy-owner-label {
          display: block;
          margin-bottom: 3px;
          color: #909793;
          font-size: 9px;
        }

        .zy-owner-link {
          color: var(--zy-teal);
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
        }

        .zy-owner-link:hover { text-decoration: underline; }

        .zy-empty {
          width: 100%;
          padding: 45px 20px;
          border: 1px dashed rgba(20,32,30,.16);
          border-radius: 20px;
          text-align: center;
          color: var(--zy-muted);
          background: rgba(255,254,251,.55);
        }

        .zy-skeleton {
          height: 290px;
          flex: 0 0 285px;
          border-radius: 20px;
          background: linear-gradient(90deg, rgba(255,255,255,.5), rgba(255,255,255,.9), rgba(255,255,255,.5));
          background-size: 200% 100%;
          animation: zyShimmer 1.3s infinite;
          border: 1px solid var(--zy-border);
        }

        @keyframes zyShimmer {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }

        /* Workflow */
        .zy-workflow {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .zy-step {
          position: relative;
          padding: 28px 24px;
          background: var(--zy-cloud);
          border: 1px solid var(--zy-border);
          border-radius: 22px;
        }

        .zy-step-number {
          display: inline-grid;
          width: 38px;
          height: 38px;
          place-items: center;
          margin-bottom: 18px;
          border-radius: 12px;
          background: var(--zy-teal);
          color: #fff;
          font-size: 12px;
          font-weight: 800;
        }

        .zy-step h3 {
          margin: 0 0 8px;
          font-size: 17px;
        }

        .zy-step p {
          margin: 0;
          color: var(--zy-muted);
          font-size: 13px;
          line-height: 1.65;
        }

        /* CTA */
        .zy-cta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .zy-cta-card {
          position: relative;
          min-height: 290px;
          overflow: hidden;
          padding: 35px;
          border-radius: 26px;
        }

        .zy-cta-card.light {
          background: var(--zy-cloud);
          border: 1px solid var(--zy-border);
        }

        .zy-cta-card.dark {
          color: #fff;
          background: var(--zy-teal-deep);
        }

        .zy-cta-card h3 {
          position: relative;
          z-index: 1;
          max-width: 390px;
          margin: 0 0 10px;
          font-size: 29px;
        }

        .zy-cta-card p {
          position: relative;
          z-index: 1;
          max-width: 390px;
          margin: 0 0 25px;
          color: var(--zy-muted);
          font-size: 14px;
          line-height: 1.7;
        }

        .zy-cta-card.dark p { color: rgba(255,255,255,.68); }

        .zy-cta-icon {
          position: relative;
          z-index: 1;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          margin-bottom: 20px;
          border-radius: 13px;
          background: rgba(14,79,70,.08);
          color: var(--zy-teal);
        }

        .zy-cta-card.dark .zy-cta-icon {
          color: #fff;
          background: rgba(255,255,255,.10);
        }

        .zy-cta-pattern {
          position: absolute;
          width: 180px;
          height: 180px;
          inset-inline-end: -20px;
          bottom: -30px;
          color: var(--zy-teal);
          opacity: .07;
        }

        .zy-cta-card.dark .zy-cta-pattern {
          color: var(--zy-copper);
          opacity: .16;
        }

        /* Pricing */
        .zy-pricing {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          max-width: 820px;
          margin: 0 auto;
        }

        .zy-price-card {
          padding: 34px;
          text-align: center;
          border-radius: 24px;
        }

        .zy-price-card.light {
          background: var(--zy-cloud);
          border: 1px solid var(--zy-border);
        }

        .zy-price-card.dark {
          color: #fff;
          background: var(--zy-teal-deep);
        }

        .zy-price-label {
          margin-bottom: 13px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .7px;
          opacity: .72;
          text-transform: uppercase;
        }

        .zy-price {
          margin-bottom: 11px;
          font-size: 40px;
          line-height: 1;
          font-weight: 600;
        }

        .zy-price-card p {
          margin: 0 auto;
          max-width: 280px;
          color: var(--zy-muted);
          font-size: 13px;
          line-height: 1.6;
        }

        .zy-price-card.dark p { color: rgba(255,255,255,.70); }

        .zy-price-list {
          display: grid;
          gap: 9px;
          margin: 23px 0 0;
          text-align: start;
          font-size: 12px;
        }

        .zy-price-list div {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .zy-price-list svg { color: var(--zy-teal); flex: 0 0 auto; }
        .zy-price-card.dark .zy-price-list svg { color: #d6b77c; }

        .zy-trial {
          margin: 22px 0 0;
          color: rgba(20,32,30,.53);
          font-size: 12px;
          text-align: center;
        }

        /* Footer */
        .zy-footer {
          padding: 58px 0 28px;
          background: var(--zy-ink);
          color: rgba(255,254,251,.82);
        }

        .zy-footer-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 30px;
          padding-bottom: 38px;
        }

        .zy-footer-brand {
          color: #fff;
          font-size: 25px;
        }

        .zy-footer p {
          max-width: 270px;
          margin: 10px 0 0;
          color: rgba(255,254,251,.52);
          font-size: 13px;
          line-height: 1.6;
        }

        .zy-footer h4 {
          margin: 0 0 12px;
          color: #fff;
          font-size: 12px;
        }

        .zy-footer a {
          display: block;
          margin-bottom: 9px;
          color: rgba(255,254,251,.55);
          text-decoration: none;
          font-size: 12px;
        }

        .zy-footer a:hover { color: #fff; }

        .zy-footer-bottom {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,.11);
          color: rgba(255,255,255,.43);
          font-size: 11px;
        }

        @media (max-width: 980px) {
          .zy-hero-grid { grid-template-columns: 1fr; }
          .zy-product-preview { max-width: 690px; width: 100%; margin: 0 auto; }
          .zy-feature-grid { grid-template-columns: 1fr 1fr; }
          .zy-proof-inner { grid-template-columns: 1fr 1fr; }
          .zy-footer-grid { grid-template-columns: 1fr 1fr; }
          .zy-nav-links { display: none; }
        }

        @media (max-width: 700px) {
          .zy-container { width: min(100% - 32px, 1180px); }
          .zy-nav-inner { min-height: 64px; }
          .zy-nav-actions .zy-nav-cta { display: none; }
          .zy-hero { padding: 100px 0 55px; }
          .zy-hero-title { font-size: clamp(43px, 13vw, 62px); }
          .zy-hero-copy { font-size: 15.5px; }
          .zy-product-preview { min-height: 380px; }
          .zy-dashboard { inset: 5px 0 0 0; }
          .zy-dashboard-body { min-height: 325px; grid-template-columns: 66px 1fr; }
          .zy-dashboard-side { padding: 10px 6px; }
          .zy-dashboard-main { padding: 10px; }
          .zy-floating-live { inset-inline-end: -4px; top: 25px; }
          .zy-floating-booking { inset-inline-start: -4px; bottom: 4px; }
          .zy-section, .zy-salon-section { padding: 65px 0; }
          .zy-feature-grid { grid-template-columns: 1fr; }
          .zy-workflow { grid-template-columns: 1fr; }
          .zy-cta-grid, .zy-pricing { grid-template-columns: 1fr; }
          .zy-proof-inner { grid-template-columns: 1fr 1fr; gap: 4px; }
          .zy-salon-head { align-items: flex-start; flex-direction: column; }
          .zy-salon-toolbar { align-items: flex-start; flex-direction: column; }
          .zy-search { width: 100%; }
          .zy-footer-grid { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 470px) {
          .zy-stats { gap: 22px; }
          .zy-dashboard-side { display: none; }
          .zy-dashboard-body { grid-template-columns: 1fr; }
          .zy-kpis { grid-template-columns: 1fr 1fr; }
          .zy-kpi:last-child { display: none; }
          .zy-floating-live { width: 137px; }
          .zy-floating-booking { width: 165px; }
          .zy-proof-inner { grid-template-columns: 1fr; }
          .zy-footer-grid { grid-template-columns: 1fr; }
        }

        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          *, *::before, *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      {/* =====================================================
          NAV
      ===================================================== */}
      {/* <header className="zy-nav">
        <div className="zy-container zy-nav-inner">
          <Link to="/" className="zy-brand">
            <svg className="zy-brand-mark" viewBox="0 0 30 30" aria-hidden="true">
              <path
                d="M15 2 L27 15 L15 28 L3 15 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="15" cy="15" r="3" fill="var(--zy-copper)" />
            </svg>
            <span className="zy-display zy-brand-name">{isAr ? "زينة" : "ZAYNA"}</span>
          </Link>

          <nav className="zy-nav-links" aria-label="Primary">
            <a href="#features">{t("nav.features")}</a>
            <a href="#salons">{t("nav.salons")}</a>
            <a href="#how-it-works">{t("nav.howItWorks", "How it works")}</a>
            <a href="#pricing">{t("nav.pricing")}</a>
          </nav>

          <div className="zy-nav-actions">
            <LanguageSwitcher />
            <a href="#cta-split" className="zy-btn zy-primary zy-nav-cta zy-focus">
              {t("nav.cta")}
              <FiArrowRight size={14} />
            </a>
          </div>
        </div>
      </header> */}
      <Navbar />
      {/* =====================================================
          HERO
      ===================================================== */}
      <main>
        <section className="zy-hero">
          <div className="zy-hero-bg">
            <Lattice opacity={0.07} />
          </div>

          <div className="zy-container zy-hero-grid">
            <Reveal>
              <div>
                <div className="zy-badge">
                  <span className="zy-badge-dot" />
                  {t("home.badge")}
                </div>

                <h1 className="zy-display zy-hero-title">
                  {t("home.heroTitle1")}
                  <br />
                  <span>{t("home.heroTitle2")}</span>
                </h1>

                <p className="zy-hero-copy">{t("home.heroSub")}</p>

                <div className="zy-hero-actions">
                  <a href="#salons" className="zy-btn zy-primary zy-focus">
                    {t("home.heroCtaPrimary")}
                    <FiArrowRight size={15} />
                  </a>

                  <a href="#features" className="zy-btn zy-secondary zy-focus">
                    {t("home.heroCtaSecondary")}
                  </a>
                </div>

                <div className="zy-stats">
                  {[
                    t("home.heroStat1", { returnObjects: true }),
                    t("home.heroStat2", { returnObjects: true }),
                    t("home.heroStat3", { returnObjects: true }),
                  ].map(([num, label], index) => (
                    <div key={index}>
                      <div className="zy-display zy-stat-number">{num}</div>
                      <div className="zy-stat-label">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="zy-product-preview">
                <div className="zy-dashboard">
                  <div className="zy-dashboard-top">
                    <div className="zy-dashboard-brand">
                      <span className="zy-dashboard-dot" />
                      ZAYNA BUSINESS
                    </div>
                    <div className="zy-dashboard-user" />
                  </div>

                  <div className="zy-dashboard-body">
                    <aside className="zy-dashboard-side">
                      <div className="zy-side-logo">
                        <FiScissors size={14} />
                      </div>

                      <div className="zy-side-item active">
                        <FiGrid size={14} />
                        Dashboard
                      </div>
                      <div className="zy-side-item">
                        <FiCalendar size={14} />
                        Bookings
                      </div>
                      <div className="zy-side-item">
                        <FiUsers size={14} />
                        Clients
                      </div>
                      <div className="zy-side-item">
                        <FiTrendingUp size={14} />
                        Reports
                      </div>
                    </aside>

                    <div className="zy-dashboard-main">
                      <div className="zy-mini-heading">
                        <strong>{isAr ? "نظرة عامة" : "Today's overview"}</strong>
                        <span>{isAr ? "السبت، 15 أغسطس" : "Sat, Aug 15"}</span>
                      </div>

                      <div className="zy-kpis">
                        <div className="zy-kpi">
                          <small>{isAr ? "الحجوزات" : "Bookings"}</small>
                          <strong>42</strong>
                          <em>+18.4%</em>
                        </div>
                        <div className="zy-kpi">
                          <small>{isAr ? "العملاء" : "Clients"}</small>
                          <strong>128</strong>
                          <em>+9.2%</em>
                        </div>
                        <div className="zy-kpi">
                          <small>{isAr ? "الإيرادات" : "Revenue"}</small>
                          <strong>1.84K</strong>
                          <em>+12.8%</em>
                        </div>
                      </div>

                      <div className="zy-calendar">
                        <div className="zy-calendar-head">
                          <span>{isAr ? "جدول المواعيد" : "Appointment schedule"}</span>
                          <span>{isAr ? "اليوم" : "Today"}</span>
                        </div>

                        <div className="zy-calendar-row">
                          {[
                            ["09:00", "Sara"],
                            ["10:30", "Mona"],
                            ["12:00", "Open"],
                            ["13:30", "Lina"],
                            ["15:00", "Open"],
                            ["16:30", "Noor"],
                            ["09:30", "Open"],
                            ["11:00", "Huda"],
                            ["12:30", "Open"],
                            ["14:00", "Sara"],
                            ["15:30", "Open"],
                            ["17:00", "Mona"],
                          ].map(([time, client], index) => (
                            <div
                              key={`${time}-${index}`}
                              className={`zy-slot ${
                                client === "Open"
                                  ? ""
                                  : index === 5
                                    ? "selected"
                                    : "booked"
                              }`}
                            >
                              <strong>{time}</strong>
                              <br />
                              {client}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="zy-floating-card zy-floating-live">
                  <div className="zy-live-row">
                    <div className="zy-live-check">
                      <FiCheck size={13} />
                    </div>
                    <div>
                      <small>{isAr ? "حجز جديد" : "New booking"}</small>
                      <strong style={{ fontSize: 11 }}>Today · 4:45 PM</strong>
                    </div>
                  </div>
                </div>

                <div className="zy-floating-card zy-floating-booking">
                  <small>{isAr ? "تم تأكيد الحجز" : "Booking confirmed"}</small>
                  <strong>{isAr ? "اليوم، 2:15 مساءً" : "Today, 2:15 PM"}</strong>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* =====================================================
            PRODUCT PROOF
        ===================================================== */}
        <section className="zy-proof-band">
          <div className="zy-container zy-proof-inner">
            {[
              [FiCalendar, t("home.proofBooking", "Smart online booking"), t("home.proofBookingSub", "24/7 availability")],
              [FiClock, t("home.proofReminders", "Automated reminders"), t("home.proofRemindersSub", "Fewer no-shows")],
              [FiUsers, t("home.proofClients", "Client management"), t("home.proofClientsSub", "Everything in one place")],
              [FiTrendingUp, t("home.proofInsights", "Business insights"), t("home.proofInsightsSub", "Know what is working")],
            ].map(([Icon, title, subtitle]) => (
              <div className="zy-proof-item" key={title}>
                <div className="zy-proof-icon">
                  <Icon size={16} />
                </div>
                <div>
                  <strong>{title}</strong>
                  <span>{subtitle}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* =====================================================
            FEATURES
        ===================================================== */}
        <section id="features" className="zy-section">
          <div className="zy-container">
            <Reveal>
              <div className="zy-section-head">
                <Eyebrow>{t("home.sectionFeaturesEyebrow")}</Eyebrow>
                <h2 className="zy-display zy-section-title">
                  {t("home.sectionFeaturesTitle")}
                </h2>
                <p className="zy-section-sub">
                  {t(
                    "home.featuresSectionSub",
                    "A complete experience for customers and a focused operating system for salons."
                  )}
                </p>
              </div>
            </Reveal>

            <FeatureColumn
              label={t("home.featuresCustomerLabel")}
              items={t("home.featuresCustomer", { returnObjects: true })}
              tone="teal"
            />

            <FeatureColumn
              label={t("home.featuresOwnerLabel")}
              items={t("home.featuresOwner", { returnObjects: true })}
              tone="copper"
            />
          </div>
        </section>

        {/* =====================================================
            LIVE SALONS — now backed by the real API
        ===================================================== */}
        <section id="salons" className="zy-salon-section">
          <div className="zy-container">
            <Reveal>
              <div className="zy-salon-head">
                <div>
                  <Eyebrow>{t("home.carouselEyebrow")}</Eyebrow>
                  <h2 className="zy-display zy-salon-title">
                    {t("home.carouselTitle")}
                  </h2>
                  <p className="zy-salon-sub">
                    {t(
                      "home.carouselSub",
                      "Discover salons already on ZAYNA and book with confidence."
                    )}
                  </p>
                </div>

                <div className="zy-salon-actions">
                  <button
                    type="button"
                    className="zy-circle-btn zy-focus"
                    onClick={() => scrollSalons("prev")}
                    aria-label={t("common.previous", "Previous")}
                  >
                    <FiChevronLeft size={17} />
                  </button>
                  <button
                    type="button"
                    className="zy-circle-btn zy-focus"
                    onClick={() => scrollSalons("next")}
                    aria-label={t("common.next", "Next")}
                  >
                    <FiChevronRight size={17} />
                  </button>
                </div>
              </div>
            </Reveal>

            <div className="zy-salon-toolbar">
              <div className="zy-search">
                <FiSearch size={15} />
                <input
                  value={salonSearch}
                  onChange={(e) => setSalonSearch(e.target.value)}
                  placeholder={t("common.search")}
                  aria-label={t("common.search")}
                />
              </div>

              {!salonsLoading && !salonError && (
                <span className="zy-salon-count">
                  {filteredSalons.length}{" "}
                  {t("home.salonCountLabel", "salons available")}
                </span>
              )}
            </div>

            {salonsLoading ? (
              <div className="zy-salon-scroll" aria-label="Loading salons">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div className="zy-skeleton" key={index} />
                ))}
              </div>
            ) : salonError ? (
              <div className="zy-empty">
                <p style={{ marginTop: 0 }}>
                  {t(
                    "home.salonLoadError",
                    "We couldn't load salons right now. Please try again."
                  )}
                </p>
                <button
                  type="button"
                  className="zy-btn zy-secondary"
                  onClick={fetchSalons}
                >
                  {t("common.retry", "Try again")}
                </button>
              </div>
            ) : filteredSalons.length === 0 ? (
              <div className="zy-empty">
                <FiSearch size={22} />
                <p>
                  {t("common.noData", "No salons found")}
                </p>
              </div>
            ) : (
              <div ref={salonCarouselRef} className="zy-salon-scroll">
                {featuredSalons.map((salon) => {
                  const isActive = salon.isActive === true;
                  const name = getSalonName(salon);
                  const city = getSalonCity(salon);
                  const detailUrl = `/salons/${toSlug(
                    salon.city || "muscat"
                  )}/${toSlug(salon.name || salon.nameAr)}-${salon.id}`;

                  return (
                    <article className="zy-salon-card" key={salon.id}>
                      <div className="zy-salon-image">
                        {salon.photoUrl ? (
                          <img src={salon.photoUrl} alt={name} loading="lazy" />
                        ) : (
                          <div className="zy-salon-placeholder">
                            <FiScissors />
                          </div>
                        )}

                        <span className={`zy-status ${isActive ? "verified" : "unclaimed"}`}>
                          {isActive
                            ? t("salon.verified", "Verified")
                            : t("salon.unclaimed", "Call to Book")}
                        </span>
                      </div>

                      <div className="zy-salon-body">
                        <Link to={detailUrl} className="zy-salon-name">
                          {name}
                        </Link>

                        {city && (
                          <div className="zy-salon-location">
                            <FiMapPin size={13} />
                            <span>{city}</span>
                          </div>
                        )}

                        <div className="zy-salon-meta">
                          <span className="zy-verified-pill">
                            {isActive
                              ? t("home.bookable", "Online booking")
                              : t("salon.callToBook", "Call to book")}
                          </span>

                          {salon.rating != null && (
                            <span className="zy-rating">
                              <FiStar size={12} fill="currentColor" />
                              {Number(salon.rating).toFixed(1)}
                              {salon.reviews != null && ` (${salon.reviews})`}
                            </span>
                          )}
                        </div>

                        {salon.phone && (
                          <div
                            className="zy-phone"
                            onClick={() => handleRevealPhone(salon.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                handleRevealPhone(salon.id);
                              }
                            }}
                          >
                            <FiPhone size={13} />
                            {!user ? (
                              <span>
                                ***** {t("auth.loginToView")}
                              </span>
                            ) : revealedPhones[salon.id] ? (
                              <span style={{ fontWeight: 700 }}>{salon.phone}</span>
                            ) : (
                              <span>***** {t("salon.clickToShowNumber")}</span>
                            )}
                          </div>
                        )}

                        <div className="zy-salon-footer">
                          <div>
                            <span className="zy-owner-label">
                              {t("salon.areYouTheOwner")}
                            </span>

                            {!isActive ? (
                              <Link
                                to={`/claim/${salon.id}`}
                                className="zy-owner-link"
                              >
                                {t("salon.claim")}
                              </Link>
                            ) : (
                              <span className="zy-owner-link">
                                {t("salon.bookNow")}
                              </span>
                            )}
                          </div>

                          <Link to={detailUrl} className="zy-owner-link">
                            {t("common.viewDetails", "View Details")}
                            <FiArrowRight
                              size={11}
                              style={{
                                marginInlineStart: 4,
                                verticalAlign: "middle",
                              }}
                            />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!salonsLoading && !salonError && salons.length > featuredSalons.length && (
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <Link to="/salons" className="zy-btn zy-secondary zy-focus">
                  {t("home.viewAllSalons", "Explore all salons")}
                  <FiArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </section>

        <SectionDivider />

        {/* =====================================================
            HOW IT WORKS
        ===================================================== */}
        <section id="how-it-works" className="zy-section">
          <div className="zy-container">
            <Reveal>
              <div className="zy-section-head">
                <Eyebrow>{t("home.workflowEyebrow", "Simple by design")}</Eyebrow>
                <h2 className="zy-display zy-section-title">
                  {t("home.workflowTitle", "From discovery to confirmed appointment")}
                </h2>
                <p className="zy-section-sub">
                  {t(
                    "home.workflowSub",
                    "The entire journey is designed to remove friction for both sides of the marketplace."
                  )}
                </p>
              </div>
            </Reveal>

            <div className="zy-workflow">
              {[
                [
                  "01",
                  FiSearch,
                  t("home.workflow1Title", "Find the right salon"),
                  t(
                    "home.workflow1Body",
                    "Search by salon, location and availability without jumping between platforms."
                  ),
                ],
                [
                  "02",
                  FiCalendar,
                  t("home.workflow2Title", "Choose a real time"),
                  t(
                    "home.workflow2Body",
                    "See available appointments and select the time that works for you."
                  ),
                ],
                [
                  "03",
                  FiCheck,
                  t("home.workflow3Title", "Get it confirmed"),
                  t(
                    "home.workflow3Body",
                    "Your booking is organized, remembered and easy to manage."
                  ),
                ],
              ].map(([number, Icon, title, body], index) => (
                <Reveal key={number} delay={index * 90}>
                  <div className="zy-step">
                    <span className="zy-step-number">{number}</span>
                    <div style={{ marginBottom: 13, color: "var(--zy-copper)" }}>
                      <Icon size={20} />
                    </div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* =====================================================
            DUAL CTA
        ===================================================== */}
        <section id="cta-split" className="zy-section">
          <div className="zy-container">
            <Reveal>
              <div className="zy-section-head">
                <Eyebrow>{t("home.ctaSplitEyebrow")}</Eyebrow>
                <h2 className="zy-display zy-section-title">
                  {t("home.ctaSplitTitle")}
                </h2>
              </div>
            </Reveal>

            <div className="zy-cta-grid">
              <Reveal>
                <div className="zy-cta-card light">
                  <div className="zy-cta-icon">
                    <FiCalendar size={20} />
                  </div>
                  <h3 className="zy-display">
                    {t("home.ctaCustomerTitle")}
                  </h3>
                  <p>{t("home.ctaCustomerBody")}</p>
                  <a href="#salons" className="zy-btn zy-primary zy-focus">
                    {t("home.ctaCustomerButton")}
                    <FiArrowRight size={14} />
                  </a>
                  <div className="zy-cta-pattern">
                    <Lattice opacity={1} />
                  </div>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <div className="zy-cta-card dark">
                  <div className="zy-cta-icon">
                    <FiTrendingUp size={20} />
                  </div>
                  <h3 className="zy-display">
                    {t("home.ctaOwnerTitle")}
                  </h3>
                  <p>{t("home.ctaOwnerBody")}</p>
                  <a href="#pricing" className="zy-btn" style={{
                    padding: "14px 25px",
                    background: "var(--zy-copper)",
                    color: "#fff",
                    boxShadow: "0 15px 30px -18px rgba(192,118,74,.8)",
                  }}>
                    {t("home.ctaOwnerButton")}
                    <FiArrowRight size={14} />
                  </a>
                  <div className="zy-cta-pattern">
                    <Lattice opacity={1} />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* =====================================================
            PRICING
        ===================================================== */}
        <section id="pricing" className="zy-section">
          <div className="zy-container">
            <Reveal>
              <div className="zy-section-head">
                <Eyebrow>{t("home.pricingEyebrow")}</Eyebrow>
                <h2 className="zy-display zy-section-title">
                  {t("home.pricingTitle")}
                </h2>
              </div>
            </Reveal>

            <div className="zy-pricing">
              <Reveal>
                <PriceCard
                  label={pricingCustomerCard?.[0]}
                  price={pricingCustomerCard?.[1]}
                  body={pricingCustomerCard?.[2]}
                  dark={false}
                  features={[
                    t("home.pricingCustomerFeature1", "Find salons"),
                    t("home.pricingCustomerFeature2", "Book appointments"),
                    t("home.pricingCustomerFeature3", "Manage your bookings"),
                  ]}
                />
              </Reveal>

              <Reveal delay={100}>
                <PriceCard
                  label={pricingOwnerCard?.[0]}
                  price={pricingOwnerCard?.[1]}
                  body={pricingOwnerCard?.[2]}
                  dark
                  features={[
                    t("home.pricingOwnerFeature1", "Unlimited bookings"),
                    t("home.pricingOwnerFeature2", "Unlimited staff"),
                    t("home.pricingOwnerFeature3", "All branches included"),
                  ]}
                  footer={
                    <a
                      href="#cta-split"
                      className="zy-btn"
                      style={{
                        marginTop: 22,
                        padding: "13px 24px",
                        background: "var(--zy-copper)",
                        color: "#fff",
                      }}
                    >
                      {t("home.pricingCtaOwner")}
                      <FiArrowRight size={13} />
                    </a>
                  }
                />
              </Reveal>
            </div>

            <Reveal delay={150}>
              <p className="zy-trial">{t("home.pricingTrialNote")}</p>
            </Reveal>
          </div>
        </section>
      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}
      <footer className="zy-footer">
        <div className="zy-container">
          <div className="zy-footer-grid">
            <div>
              <div className="zy-display zy-footer-brand">
                {isAr ? "زينة" : "ZAYNA"}
              </div>
              <p>{t("home.footerTagline")}</p>
            </div>

            <div>
              <h4>{t("nav.features")}</h4>
              <a href="#features">{t("home.featuresCustomerLabel")}</a>
              <a href="#features">{t("home.featuresOwnerLabel")}</a>
            </div>

            <div>
              <h4>{t("nav.salons")}</h4>
              <a href="#salons">{t("home.carouselTitle")}</a>
              <Link to="/salons">{t("home.viewAllSalons", "All salons")}</Link>
            </div>

            <div>
              <h4>{t("nav.pricing")}</h4>
              <a href="#pricing">{t("home.pricingTitle")}</a>
              <a href="#cta-split">{t("nav.cta")}</a>
            </div>
          </div>

          <div className="zy-footer-bottom">

          </div>
        </div>
      </footer>
    </div>
  );
}

/* =========================================================
   Sub-components
   ========================================================= */

function FeatureColumn({ label, items, tone = "teal" }) {
  const isCopper = tone === "copper";
  const Icon = isCopper ? FiTrendingUp : FiZap;

  return (
    <div className="zy-feature-group">
      <div className={`zy-feature-label ${isCopper ? "copper" : ""}`}>
        <i />
        {label}
      </div>

      <div className="zy-feature-grid">
        {Array.isArray(items) &&
          items.map(([title, body], index) => (
            <Reveal key={`${title}-${index}`} delay={index * 70}>
              <div className="zy-card">
                <div className="zy-feature-icon">
                  <Icon size={17} />
                </div>
                <h3 className="zy-feature-title">{title}</h3>
                <p className="zy-feature-body">{body}</p>
              </div>
            </Reveal>
          ))}
      </div>
    </div>
  );
}

function PriceCard({ label, price, body, dark = false, features = [], footer }) {
  return (
    <div className={`zy-price-card ${dark ? "dark" : "light"}`}>
      <div className="zy-price-label">{label}</div>
      <div className="zy-display zy-price">{price}</div>
      <p>{body}</p>

      {features.length > 0 && (
        <div className="zy-price-list">
          {features.map((feature) => (
            <div key={feature}>
              <FiCheck size={13} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      )}

      {footer}
    </div>
  );
}