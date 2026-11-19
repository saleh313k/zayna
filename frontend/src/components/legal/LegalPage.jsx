// ============================================
// src/components/legal/LegalPage.jsx
// Public Terms / Privacy pages (no sign-in needed). Content: legalContent.js (EN + AR).
// ============================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../common/Layout';
import { LEGAL_LAST_UPDATED, privacy, terms } from './legalContent';

const DOCS = { privacy, terms };

const LegalPage = ({ doc }) => {
  const { t, i18n } = useTranslation();
  const language = (i18n.language || 'en').startsWith('ar') ? 'ar' : 'en';
  const content = (DOCS[doc] || privacy)[language];

  return (
    <Layout>
      <article className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-2">{content.title}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {t('legal.lastUpdated', 'Last updated: {{date}}', { date: LEGAL_LAST_UPDATED })}
        </p>
        <p className="text-gray-700 mb-8">{content.intro}</p>

        {content.sections.map((section) => (
          <section key={section.heading} className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="text-gray-700 mb-3">{paragraph}</p>
            ))}
            {section.items && (
              <ul className="list-disc ps-6 space-y-2 text-gray-700 mb-3">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </article>
    </Layout>
  );
};

export default LegalPage;
