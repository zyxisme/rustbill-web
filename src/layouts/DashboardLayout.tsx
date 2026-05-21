import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ShoppingCart,
  Server,
  FileText,
  Ticket,
  Wallet,
  Settings,
  ChevronLeft,
  LogOut,
  Globe,
  Menu,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.overview' },
  { href: '/dashboard/orders', icon: ShoppingCart, labelKey: 'nav.myOrders' },
  { href: '/dashboard/instances', icon: Server, labelKey: 'nav.myInstances' },
  { href: '/dashboard/invoices', icon: FileText, labelKey: 'nav.myInvoices' },
  { href: '/dashboard/tickets', icon: Ticket, labelKey: 'nav.myTickets' },
  { href: '/dashboard/balance', icon: Wallet, labelKey: 'nav.myBalance' },
  { href: '/dashboard/settings', icon: Settings, labelKey: 'nav.settings' },
];

export default function DashboardLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  const toggleLang = () => {
    const next = i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN';
    i18n.changeLanguage(next);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const initials = user?.displayName?.slice(0, 2).toUpperCase() || user?.username?.slice(0, 2).toUpperCase() || '??';

  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-60 bg-canvas-soft border-r border-hairline flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:z-40`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-5 border-b border-hairline shrink-0">
          <Link to="/" className="flex items-center gap-2 text-ink font-semibold text-lg tracking-tight no-underline" onClick={closeSidebar}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="6" fill="#090c10" />
              <path d="M8 22V12L16 8L24 12V22L16 26L8 22Z" stroke="#06b6d4" strokeWidth="1.5" fill="none" />
              <circle cx="16" cy="17" r="3" fill="#06b6d4" />
            </svg>
            RustBill
          </Link>
          {/* Close button (mobile only) */}
          <button
            onClick={closeSidebar}
            className="md:hidden ml-auto p-1 text-mute hover:text-ink bg-transparent border-0 cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-3 py-2 text-sm rounded-sm no-underline transition-colors ${
                  isActive
                    ? 'text-ink bg-canvas-soft-2 border-l-2 border-l-primary -ml-[2px]'
                    : 'text-body hover:text-ink hover:bg-canvas-soft-2'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-hairline space-y-2">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-body hover:text-ink hover:bg-canvas-soft-2 rounded-sm transition-colors bg-transparent border-0 cursor-pointer"
          >
            <Globe className="h-4 w-4" />
            <span>{i18n.language === 'zh-CN' ? 'English' : '简体中文'}</span>
          </button>

          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink truncate">{user?.displayName || user?.username}</p>
              <p className="text-xs text-mute truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-body hover:text-ink hover:bg-canvas-soft-2 rounded-sm transition-colors bg-transparent border-0 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="md:ml-60 ml-0 flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="h-16 flex items-center px-4 sm:px-6 border-b border-hairline bg-canvas shrink-0 gap-3">
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1 text-mute hover:text-ink bg-transparent border-0 cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-body hover:text-ink transition-colors no-underline"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t('common.backToHome')}</span>
          </Link>
        </div>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
