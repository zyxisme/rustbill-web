import { useTranslation } from 'react-i18next';
import { SafeHtml } from '@/components/SafeHtml';
import termsZhCN from './terms-zh-CN.md?html';
import termsEnUS from './terms-en-US.md?html';

export default function Terms() {
  const { i18n } = useTranslation();
  const content = i18n.language === 'zh-CN' ? termsZhCN : termsEnUS;

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <SafeHtml html={content} className="legal-content max-w-[800px] mx-auto my-16 px-6" />
    </div>
  );
}
