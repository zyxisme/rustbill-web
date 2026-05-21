import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import { useState } from 'react';

export default function PublicLayout() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDashboard = location.pathname.startsWith('/dashboard');

  const toggleLang = () => {
    const next = i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN';
    i18n.changeLanguage(next);
  };

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/catalog', label: t('nav.catalog') },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* Nav */}
      <header className="sticky top-0 z-50 h-16 bg-canvas border-b border-hairline">
        <div className="mx-auto max-w-[1400px] h-full flex items-center justify-between px-6 relative">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-ink font-semibold text-lg tracking-tight no-underline shrink-0">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="6" fill="#090c10" />
              <path d="M8 22V12L16 8L24 12V22L16 26L8 22Z" stroke="#06b6d4" strokeWidth="1.5" fill="none" />
              <circle cx="16" cy="17" r="3" fill="#06b6d4" />
            </svg>
            RustBill
          </Link>

          {/* Desktop nav — centered */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors no-underline ${
                  location.pathname === link.href
                    ? 'text-ink bg-canvas-soft'
                    : 'text-body hover:text-ink hover:bg-canvas-soft'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 text-body text-sm hover:text-ink transition-colors bg-transparent border-0 cursor-pointer px-2 py-1"
              title="Switch language"
            >
              <Globe className="h-4 w-4" />
              {i18n.language === 'zh-CN' ? 'EN' : '中文'}
            </button>

            {user ? (
              isDashboard ? (
                <Button variant="secondary" size="sm" onClick={() => useAuthStore.getState().logout()}>
                  {t('nav.logout')}
                </Button>
              ) : (
                <Link to="/dashboard" className="no-underline">
                  <Button variant="primary" size="sm">{t('nav.dashboard')}</Button>
                </Link>
              )
            ) : (
              <>
                <Link to="/login" className="no-underline">
                  <Button variant="secondary" size="sm">{t('nav.login')}</Button>
                </Link>
                <Link to="/register" className="no-underline">
                  <Button variant="primary" size="sm">{t('nav.register')}</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-ink bg-transparent border-0 p-1 cursor-pointer"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-canvas border-b border-hairline px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block text-sm no-underline ${
                  location.pathname === link.href ? 'text-ink' : 'text-body'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-hairline flex items-center gap-2">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="no-underline flex-1">
                    <Button variant="primary" size="sm" className="w-full">{t('nav.dashboard')}</Button>
                  </Link>
                  <Button variant="secondary" size="sm" onClick={() => { useAuthStore.getState().logout(); setMenuOpen(false); }}>
                    {t('nav.logout')}
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="no-underline flex-1">
                    <Button variant="secondary" size="sm" className="w-full">{t('nav.login')}</Button>
                  </Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="no-underline flex-1">
                    <Button variant="primary" size="sm" className="w-full">{t('nav.register')}</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-canvas border-t border-hairline py-16 px-6">
        <div className="mx-auto max-w-[1400px] grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-sm font-mono text-mute uppercase tracking-wider mb-4">{t('footer.product')}</div>
            <div className="space-y-2">
              <Link to="/catalog" className="block text-sm text-body hover:text-link no-underline">{t('nav.catalog')}</Link>
              <a href="#" className="block text-sm text-body hover:text-link no-underline">{t('footer.pricing')}</a>
              <a href="#" className="block text-sm text-body hover:text-link no-underline">{t('footer.api')}</a>
            </div>
          </div>
          <div>
            <div className="text-sm font-mono text-mute uppercase tracking-wider mb-4">{t('footer.support')}</div>
            <div className="space-y-2">
              <Link to="/dashboard/tickets" className="block text-sm text-body hover:text-link no-underline">{t('nav.myTickets')}</Link>
              <a href="#" className="block text-sm text-body hover:text-link no-underline">{t('footer.docs')}</a>
              <a href="#" className="block text-sm text-body hover:text-link no-underline">{t('footer.faq')}</a>
            </div>
          </div>
          <div>
            <div className="text-sm font-mono text-mute uppercase tracking-wider mb-4">{t('footer.company')}</div>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-body hover:text-link no-underline">{t('footer.about')}</a>
              <a href="#" className="block text-sm text-body hover:text-link no-underline">{t('footer.contact')}</a>
              <a href="#" className="block text-sm text-body hover:text-link no-underline">{t('footer.privacy')}</a>
            </div>
          </div>
          <div>
            <div className="text-sm font-mono text-mute uppercase tracking-wider mb-4">RustBill</div>
            <p className="text-sm text-mute">
              {t('footer.tagline')}
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-[1400px] mt-12 pt-8 border-t border-hairline text-center text-xs text-mute">
          &copy; {new Date().getFullYear()} RustBill. {t('footer.rights')}
        </div>
      </footer>
    </div>
  );
}
