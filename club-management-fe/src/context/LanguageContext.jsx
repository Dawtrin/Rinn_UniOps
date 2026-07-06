import { createContext, useContext, useState, useEffect } from 'react';
import vi from '../locales/vi.json';
import en from '../locales/en.json';

const LanguageContext = createContext(null);

const locales = { vi, en };

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('lang') || 'vi';
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const t = (key) => {
    const keys = key.split('.');
    let result = locales[lang];
    for (const k of keys) {
      if (result && result[k] !== undefined) {
        result = result[k];
      } else {
        return key;
      }
    }
    return result;
  };

  const toggleLanguage = () => {
    setLang(prev => (prev === 'vi' ? 'en' : 'vi'));
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => useContext(LanguageContext);
