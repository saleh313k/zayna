// ============================================
// src/components/legal/LegalConsentNotice.jsx
// "By continuing you agree to the Terms and Privacy Policy" with real links (open in a new tab so a half-filled
// form is not lost). `checkbox` renders the required-consent variant used by email registration.
// ============================================
import React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

const linkClass = 'text-primary font-medium underline';

export const LegalLinks = {
  terms: <Link to="/terms" target="_blank" rel="noopener noreferrer" className={linkClass} />,
  privacy: <Link to="/privacy" target="_blank" rel="noopener noreferrer" className={linkClass} />
};

const LegalConsentNotice = ({ className = '' }) => (
  <p className={`text-xs text-gray-500 text-center ${className}`}>
    <Trans
      i18nKey="legal.agreeNotice"
      defaults="By continuing you agree to our <terms>Terms of Use</terms> and <privacy>Privacy Policy</privacy>."
      components={LegalLinks}
    />
  </p>
);

export default LegalConsentNotice;
