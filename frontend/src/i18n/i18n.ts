import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from '../../public/locales/en/translation.json';
import nlTranslation from '../../public/locales/nl/translation.json';
import deTranslation from '../../public/locales/de/translation.json';

const resources = {
  en: {
    translation: enTranslation,
  },
  nl: {
    translation: nlTranslation,
  },
  de: {
    translation: deTranslation,
  },
};

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    supportedLngs: ['en', 'nl', 'de'],
    
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;