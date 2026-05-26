import '@/index.css';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from '@/components/ErrorBoundary';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </HelmetProvider>
    </I18nextProvider>
  );
}
