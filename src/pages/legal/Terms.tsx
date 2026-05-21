import { useTranslation } from 'react-i18next';
import { LazyMarkdown } from '@/components/LazyMarkdown';
import termsZhCN from './terms-zh-CN.md?raw';
import termsEnUS from './terms-en-US.md?raw';

export default function Terms() {
  const { i18n } = useTranslation();
  const content = i18n.language === 'zh-CN' ? termsZhCN : termsEnUS;

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <LazyMarkdown className="legal-content max-w-[800px] mx-auto my-16 px-6">{content}</LazyMarkdown>
    </div>
  );
}
