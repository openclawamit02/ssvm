import React from 'react';
import { useTranslation } from 'react-i18next';

const PlaceholderPage = ({ titleKey }) => {
  const { t } = useTranslation();
  return (
    <div className="page-container">
      <h1 className="page-title">{t(titleKey)}</h1>
      <div className="glass" style={{padding: '40px', borderRadius: 'var(--border-radius-lg)', textAlign: 'center'}}>
        <h2 style={{color: 'var(--color-text-muted)'}}>Module under construction</h2>
      </div>
    </div>
  );
};


