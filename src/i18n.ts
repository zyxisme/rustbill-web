import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhCN from '@/locales/zh-CN/translation.json';

const loaded = new Set<string>(['zh-CN']);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
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

if (i18n.language?.startsWith('en')) {
  import('@/locales/en-US/translation.json').then(mod => {
    i18n.addResourceBundle('en-US', 'translation', mod.default);
    loaded.add('en-US');
  });
}

export async function switchLanguage(lng: 'zh-CN' | 'en-US') {
  if (!loaded.has(lng)) {
    if (lng === 'en-US') {
      const mod = await import('@/locales/en-US/translation.json');
      i18n.addResourceBundle('en-US', 'translation', mod.default);
      loaded.add('en-US');
    }
  }
  await i18n.changeLanguage(lng);
}

export default i18n;
