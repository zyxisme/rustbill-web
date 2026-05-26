import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhCN from '@/locales/zh-CN/translation.json';
import enUS from '@/locales/en-US/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'en-US': { translation: enUS },
    },
    fallbackLng: 'zh-CN',
    supportedLngs: ['zh-CN', 'en-US'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['cookie', 'localStorage', 'navigator'],
      caches: ['cookie', 'localStorage'],
      lookupCookie: 'rustbill_customer_lang',
      lookupLocalStorage: 'rustbill_customer_lang',
    },
  });

export async function switchLanguage(lng: 'zh-CN' | 'en-US') {
  await i18n.changeLanguage(lng);
}

export default i18n;
