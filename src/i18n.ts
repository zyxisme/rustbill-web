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

  // Background preload the other language (not on critical path)
  const other = activeLng === 'zh-CN' ? 'en-US' : 'zh-CN';
  import(`@/locales/${other}/translation.json`)
    .then((m) => i18n.addResourceBundle(other, 'translation', m.default))
    .catch(() => {});

  return i18n;
})();

export default i18n;
