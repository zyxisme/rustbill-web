import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
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
    // Resources loaded dynamically below — only the active language is in the initial bundle
  });

function resolveLng(): 'zh-CN' | 'en-US' {
  const lng = i18n.language || 'zh-CN';
  return lng.startsWith('en') ? 'en-US' : 'zh-CN';
}

const activeLng = resolveLng();

export const i18nReady = (async () => {
  const mod = await import(`@/locales/${activeLng}/translation.json`);
  i18n.addResourceBundle(activeLng, 'translation', mod.default);
  return i18n;
})();

export async function switchLanguage(lng: 'zh-CN' | 'en-US') {
  if (!i18n.hasResourceBundle(lng, 'translation')) {
    const mod = await import(`@/locales/${lng}/translation.json`);
    i18n.addResourceBundle(lng, 'translation', mod.default);
  }
  await i18n.changeLanguage(lng);
}

export default i18n;
