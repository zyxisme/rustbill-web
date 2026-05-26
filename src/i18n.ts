import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import zhCN from '@/locales/zh-CN/translation.json';

const LANG_KEY = 'rustbill_customer_lang';
const loaded = new Set<string>(['zh-CN']);

function getSavedLang(): string | null {
  try {
    const cookie = document.cookie
      .split('; ')
      .find(r => r.startsWith(`${LANG_KEY}=`))
      ?.split('=')[1];
    if (cookie === 'en-US' || cookie === 'zh-CN') return cookie;
  } catch {}
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'en-US' || stored === 'zh-CN') return stored;
  } catch {}
  return null;
}

const savedLang = getSavedLang();
const initialLng = savedLang ?? 'zh-CN';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
    },
    lng: initialLng,
    fallbackLng: 'zh-CN',
    supportedLngs: ['zh-CN', 'en-US'],
    interpolation: {
      escapeValue: false,
    },
  });

if (initialLng === 'en-US') {
  import('@/locales/en-US/translation.json').then(mod => {
    i18n.addResourceBundle('en-US', 'translation', mod.default);
    loaded.add('en-US');
  });
}

function saveLang(lng: string) {
  const expires = new Date(Date.now() + 365 * 86400_000).toUTCString();
  document.cookie = `${LANG_KEY}=${lng};expires=${expires};path=/;SameSite=Lax`;
  try { localStorage.setItem(LANG_KEY, lng); } catch {}
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
  saveLang(lng);
}

export default i18n;
