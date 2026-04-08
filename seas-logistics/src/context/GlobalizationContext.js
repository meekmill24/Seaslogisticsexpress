'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '@/lib/translations';

export const GlobalizationContext = createContext();

export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'vi', name: 'Tiếng Việt (Vietnamese)', flag: '🇻🇳' },
  { code: 'th', name: 'ไทย (Thai)', flag: '🇹🇭' },
  { code: 'id', name: 'Bahasa Indonesia (Indonesian)', flag: '🇮🇩' },
  { code: 'bn', name: 'বাংলা (Bengali)', flag: '🇧🇩' },
  { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
  { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦' },
  { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'ko', name: '한국어 (Korean)', flag: '🇰🇷' },
];

export const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.35 },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1530 },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', rate: 25440 },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rate: 16180 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', rate: 36.70 },
  { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal', rate: 3.75 },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', rate: 16.90 },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar', rate: 1.36 },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar', rate: 1.52 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 151.80 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', rate: 1350 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 3.67 },
];

export function GlobalizationProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState(currencies[0]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('sle-lang');
    const savedCurr = localStorage.getItem('sle-curr');
    if (savedLang) setLanguage(savedLang);
    if (savedCurr) {
      const found = currencies.find(c => c.code === savedCurr);
      if (found) setCurrency(found);
    }
  }, []);

  const changeLanguage = (code) => {
    setLanguage(code);
    localStorage.setItem('sle-lang', code);
  };

  const changeCurrency = (code) => {
    const found = currencies.find(c => c.code === code);
    if (found) {
      setCurrency(found);
      localStorage.setItem('sle-curr', code);
    }
  };

  // Get active translation set
  const t = translations[language] || translations['en'];

  return (
    <GlobalizationContext.Provider value={{
      t,
      language,
      setLanguage: changeLanguage,
      currency,
      setCurrency: changeCurrency,
      languages,
      currencies
    }}>
      {children}
    </GlobalizationContext.Provider>
  );
}

export const useGlobal = () => useContext(GlobalizationContext);
