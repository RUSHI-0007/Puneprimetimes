'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['mr'];
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'mr',
  setLanguage: () => {},
  t: translations.mr,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('mr');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check saved preference or cookies
    try {
      const saved = localStorage.getItem('ppt_language') as Language;
      if (saved && (saved === 'mr' || saved === 'en')) {
        setLanguageState(saved);
      } else {
        // default to 'mr' (Marathi)
        setLanguageState('mr');
      }
    } catch {
      setLanguageState('mr');
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('ppt_language', lang);
      document.cookie = `ppt_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore
    }
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language] || translations.mr,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

