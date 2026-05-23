import { useTranslation } from 'react-i18next';
import { SafeHtml } from '@/components/SafeHtml';
import privacyZhCN from './privacy-zh-CN.md?html';
import privacyEnUS from './privacy-en-US.md?html';

export default function Privacy() {
  const { i18n } = useTranslation();
  const content = i18n.language === 'zh-CN' ? privacyZhCN : privacyEnUS;

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <SafeHtml html={content} className="legal-content max-w-[800px] mx-auto my-16 px-6" />
    </div>
  );
}
