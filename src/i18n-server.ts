import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import zhCN from '@/locales/zh-CN/translation.json';
import enUS from '@/locales/en-US/translation.json';

const ssrI18n = i18n.createInstance();

ssrI18n
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'en-US': { translation: enUS },
    },
    lng: 'zh-CN',
    fallbackLng: 'zh-CN',
    interpolation: { escapeValue: false },
  });

export default ssrI18n;
