import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import emailjs from "@emailjs/browser";
import { Link } from "react-router-dom";

// ─── Config ────────────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || "zayna_bugReport";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "zayna_bugReport";
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || "nijiwPUpkGktDozw9";
const WHATSAPP_NUMBER     = import.meta.env.VITE_WHATSAPP_NUMBER     || "96891241276";


// ─── Types ──────────────────────────────────────────────────────────────────
type BugCategory = "ui" | "crash" | "performance" | "data" | "other";
type SendStatus  = "idle" | "sending" | "success" | "error";

interface BugFormData {
  name:        string;
  email:       string;
  category:    BugCategory;
  title:       string;
  description: string;
  steps:       string;
}

const INITIAL_FORM: BugFormData = {
  name: "", email: "", category: "ui", title: "", description: "", steps: "",
};

const CATEGORY_ICONS: Record<BugCategory, string> = {
  ui: "🎨", crash: "💥", performance: "🐢", data: "📊", other: "📌",
};

const CATEGORIES: BugCategory[] = ["ui", "crash", "performance", "data", "other"];

// ─── Shared input class ──────────────────────────────────────────────────────
const inputClass =
  "w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 " +
  "text-zinc-900 dark:text-zinc-100 px-4 py-2.5 text-sm outline-none " +
  "focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors placeholder:text-zinc-400";

// ─── Sub-components ──────────────────────────────────────────────────────────
const WhatsAppIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const BugIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 2l1.5 1.5M16 2l-1.5 1.5"/>
    <path d="M9 3.5A3.5 3.5 0 0112 3a3.5 3.5 0 013 .5"/>
    <path d="M6.5 8H4a1 1 0 00-1 1v1a4 4 0 002 3.46V15a5 5 0 0010 0v-1.54A4 4 0 0021 10V9a1 1 0 00-1-1h-2.5"/>
    <path d="M12 8v7M9 12h6"/>
  </svg>
);

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
      {label}{required && <span className="text-red-400 ms-1">*</span>}
    </label>
    {children}
  </div>
);

// ─── Bug Report Modal ────────────────────────────────────────────────────────
function BugReportModal({ onClose, dir }: { onClose: () => void; dir: "rtl" | "ltr" }) {
  const { t }               = useTranslation();
  const [status, setStatus] = useState<SendStatus>("idle");
  const [form, setForm]     = useState<BugFormData>(INITIAL_FORM);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [e.target.name]: e.target.value })),
    []
  );

  const setCategory = useCallback(
    (cat: BugCategory) => setForm(prev => ({ ...prev, category: cat })),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setStatus("sending");
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name:    form.name        || "—",
          from_email:   form.email       || "—",
          bug_category: t(`footer.bug_modal.categories.${form.category}`),
          bug_title:    form.title,
          bug_desc:     form.description,
          bug_steps:    form.steps       || "—",
          sent_at:      new Date().toISOString(),
        },
        EMAILJS_PUBLIC_KEY
      );
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("footer.bug_modal.title")}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        dir={dir}
        className="relative w-full sm:max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">🐛</span>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                {t("footer.bug_modal.title")}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {t("footer.bug_modal.subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("footer.bug_modal.close_aria")}
            className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto">
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center gap-4 py-14 px-6 text-center">
              <span className="text-5xl" aria-hidden="true">✅</span>
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                {t("footer.bug_modal.success_title")}
              </h3>
              <p className="text-sm text-zinc-500 max-w-xs">
                {t("footer.bug_modal.success_message")}
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-80 transition-opacity"
              >
                {t("footer.bug_modal.success_close")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-5">

              {/* Category chips */}
              <Field label={t("footer.bug_modal.fields.category_label")}>
                <div className="flex flex-wrap gap-2 mt-0.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        form.category === cat
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent"
                          : "bg-transparent text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                      }`}
                    >
                      <span aria-hidden="true">{CATEGORY_ICONS[cat]}</span>
                      {t(`footer.bug_modal.categories.${cat}`)}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Title */}
              <Field label={t("footer.bug_modal.fields.title_label")} required>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder={t("footer.bug_modal.fields.title_placeholder")}
                  className={inputClass}
                />
              </Field>

              {/* Description */}
              <Field label={t("footer.bug_modal.fields.description_label")} required>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder={t("footer.bug_modal.fields.description_placeholder")}
                  className={`${inputClass} resize-none`}
                />
              </Field>

              {/* Steps */}
              <Field label={t("footer.bug_modal.fields.steps_label")}>
                <textarea
                  name="steps"
                  value={form.steps}
                  onChange={handleChange}
                  rows={2}
                  placeholder={t("footer.bug_modal.fields.steps_placeholder")}
                  className={`${inputClass} resize-none`}
                />
              </Field>

              {/* Name & Email */}
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("footer.bug_modal.fields.name_label")}>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={t("footer.bug_modal.fields.name_placeholder")}
                    className={inputClass}
                  />
                </Field>
                <Field label={t("footer.bug_modal.fields.email_label")}>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={t("footer.bug_modal.fields.email_placeholder")}
                    className={inputClass}
                  />
                </Field>
              </div>

              {/* Error */}
              {status === "error" && (
                <p role="alert" className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 rounded-xl">
                  ❌ {t("footer.bug_modal.error_message")}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold hover:opacity-80 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "sending"
                  ? t("footer.bug_modal.submitting")
                  : t("footer.bug_modal.submit")}
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
export default function Footer() {
  const { t, i18n }               = useTranslation();
  const [showModal, setShowModal] = useState(false);

  const dir  = i18n.language === "ar" ? "rtl" : "ltr";
  const year = new Date().getFullYear();

  return (
    <>
      <footer
        dir={dir}
        className="w-full border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4">

            <p className="text-xs text-zinc-400 dark:text-zinc-500 order-2 sm:order-1">
              {t("footer.copyright", { year })}
            </p>

            <nav aria-label="Legal" className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 order-3 sm:order-2">
              <Link to="/terms" className="hover:underline">{t("footer.terms", "Terms of Use")}</Link>
              <Link to="/privacy" className="hover:underline">{t("footer.privacy", "Privacy Policy")}</Link>
            </nav>

            <div className="flex items-center gap-2 order-1 sm:order-3">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("footer.whatsapp_aria")}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-green-50 hover:text-green-600 hover:border-green-200 dark:hover:bg-green-950/30 dark:hover:text-green-400 dark:hover:border-green-800 transition-all group"
              >
                <span className="group-hover:scale-110 transition-transform"><WhatsAppIcon /></span>
                {t("footer.contact")}
              </a>

              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-800 transition-all group"
              >
                <span className="group-hover:scale-110 transition-transform"><BugIcon /></span>
                {t("footer.report_bug")}
              </button>
            </div>

          </div>
        </div>
      </footer>

      {showModal && <BugReportModal onClose={() => setShowModal(false)} dir={dir} />}
    </>
  );
}