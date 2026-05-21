import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { switchLanguage } from '@/i18n';
import { Globe, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import { useState, useEffect, useRef } from 'react';
import { brandName, logo, tagline, header } from 'virtual:brand';
import NavMenu from '@/components/NavMenu';

function BrandLogo() {
  if (!logo) {
    return <span className="text-ink font-semibold text-lg tracking-tight">{brandName}</span>;
  }
  if (logo.type === 'svg' && logo.svg) {
    return <span dangerouslySetInnerHTML={{ __html: logo.svg }} />;
  }
  if (logo.type === 'url' && logo.url) {
    return <img src={logo.url} alt={brandName} className="h-6 w-auto" />;
  }
  return <span className="text-ink font-semibold text-lg tracking-tight">{brandName}</span>;
}

export default function PublicLayout() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const location = useLocation();
  const [menuState, setMenuState] = useState<'closed' | 'open' | 'closing'>('closed');
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const closeMenu = () => {
    setMenuState('closing');
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setMenuState('closed'), 200);
  };
  const openMenu = () => {
    clearTimeout(closeTimerRef.current);
    setMenuState('open');
  };

  useEffect(() => {
    if (menuState === 'open') closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    return () => clearTimeout(closeTimerRef.current);
  }, []);

  const isDashboard = location.pathname.startsWith('/dashboard');
  const navItems = header?.nav ?? [
    { i18n: 'nav.home', href: '/' },
    { i18n: 'nav.products', children: [
      { i18n: 'nav.catalog', href: '/catalog' },
    ] },
  ];

  const toggleLang = () => {
    const next = i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN';
    switchLanguage(next);
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* Nav */}
      <header className="sticky top-0 z-50 h-16 bg-canvas border-b border-hairline">
        <div className="mx-auto max-w-[1400px] h-full flex items-center px-6">
          {/* Left: Logo */}
          <div className="flex-1 flex justify-start">
            <Link to="/" className="flex items-center gap-2 text-ink font-semibold text-lg tracking-tight no-underline shrink-0">
              <BrandLogo />
              {logo && <span className="text-ink font-semibold text-lg tracking-tight">{brandName}</span>}
            </Link>
          </div>

          {/* Center: Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavMenu items={navItems} />
          </nav>

          {/* Right: Actions */}
          <div className="hidden md:flex flex-1 justify-end items-center gap-2">
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
            onClick={() => menuState === 'open' ? closeMenu() : openMenu()}
            className="md:hidden text-ink bg-transparent border-0 p-1 cursor-pointer"
          >
            {menuState === 'open' ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuState !== 'closed' && (
          <div className={`md:hidden bg-canvas border-b border-hairline px-6 py-4 space-y-3 duration-200 ${
            menuState === 'open'
              ? 'animate-in slide-in-from-top-2 fade-in-0'
              : 'animate-out slide-out-to-top-2 fade-out-0'
          }`}>
            <NavMenu items={navItems} mobile />
            <div className="pt-2 border-t border-hairline">
              <button
                onClick={toggleLang}
                className="flex items-center gap-2 text-body text-sm hover:text-ink transition-colors bg-transparent border-0 cursor-pointer py-1"
              >
                <Globe className="h-4 w-4" />
                <span>{i18n.language === 'zh-CN' ? 'English' : '简体中文'}</span>
              </button>
            </div>
            <div className="pt-2 border-t border-hairline flex items-center gap-2">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => closeMenu()} className="no-underline flex-1">
                    <Button variant="primary" size="sm" className="w-full">{t('nav.dashboard')}</Button>
                  </Link>
                  <Button variant="secondary" size="sm" onClick={() => { useAuthStore.getState().logout(); closeMenu(); }}>
                    {t('nav.logout')}
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => closeMenu()} className="no-underline flex-1">
                    <Button variant="secondary" size="sm" className="w-full">{t('nav.login')}</Button>
                  </Link>
                  <Link to="/register" onClick={() => closeMenu()} className="no-underline flex-1">
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
              <Link to="/legal/terms" className="block text-sm text-body hover:text-link no-underline">{t('footer.terms')}</Link>
              <Link to="/legal/privacy" className="block text-sm text-body hover:text-link no-underline">{t('footer.privacy')}</Link>
            </div>
          </div>
          <div>
            <div className="text-sm font-mono text-mute uppercase tracking-wider mb-4">{brandName}</div>
            <p className="text-sm text-mute">
              {tagline || t('footer.tagline')}
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-[1400px] mt-12 pt-8 border-t border-hairline text-center text-xs text-mute">
          &copy; {new Date().getFullYear()} {brandName}. {t('footer.rights')}
        </div>
      </footer>
    </div>
  );
}
