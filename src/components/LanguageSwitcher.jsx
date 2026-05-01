import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'or', label: 'Odia' },
    { code: 'hi', label: 'Hindi' }
  ];

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  return (
    <div className="language-switcher">
      <button 
        className="lang-btn flex-center" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe size={18} className="text-mustard" />
        <span className="lang-label">{currentLang.code.toUpperCase()}</span>
        <ChevronDown size={14} className="text-muted" />
      </button>

      {isOpen && (
        <div className="lang-dropdown glass">
          {languages.map((lang) => (
            <button 
              key={lang.code}
              className={`lang-option ${i18n.language === lang.code ? 'active' : ''}`}
              onClick={() => changeLanguage(lang.code)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
