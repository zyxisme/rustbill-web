import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import type { NavItem } from 'virtual:brand';

function navLabel(t: (key: string) => string, item: NavItem): string {
  if (item.i18n) {
    const result = t(item.i18n);
    if (result !== item.i18n) return result;
  }
  return item.label ?? '';
}

function NavLink({ item, mobile }: { item: NavItem; mobile?: boolean }) {
  const { t } = useTranslation();
  const location = useLocation();
  const label = navLabel(t, item);
  const isActive = item.href && location.pathname === item.href;

  if (!item.href) {
    return <span className="text-sm text-body">{label}</span>;
  }

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-body hover:text-ink no-underline transition-colors"
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      to={item.href}
      className={cn(
        'text-sm leading-none no-underline transition-colors',
        mobile
          ? 'flex items-center py-1'
          : 'inline-flex items-center px-3 h-8 rounded-full',
        isActive
          ? 'text-ink bg-canvas-soft'
          : 'text-body hover:text-ink hover:bg-canvas-soft',
      )}
    >
      {label}
    </Link>
  );
}

function NavDropdown({ item, mobile }: { item: NavItem; mobile?: boolean }) {
  const { t } = useTranslation();
  const location = useLocation();
  const label = navLabel(t, item);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!item.children || item.children.length === 0) return null;

  if (mobile) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 w-full text-left py-1 text-sm leading-none text-mute bg-transparent border-0 cursor-pointer"
        >
          {label}
          <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="ml-3 space-y-1 mt-1">
            {item.children.map((child: NavItem) => (
              <Link
                key={child.i18n || child.label}
                to={child.href || '#'}
                className="block py-1 text-sm text-body hover:text-ink no-underline transition-colors"
              >
                {navLabel(t, child)}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 h-8 text-sm leading-none text-body hover:text-ink rounded-full hover:bg-canvas-soft bg-transparent border-0 cursor-pointer transition-colors"
      >
        {label}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 min-w-[180px] bg-canvas-soft border border-hairline rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.4)] z-50">
          <div className="py-1.5">
            {item.children.map((child: NavItem) => (
              <Link
                key={child.i18n || child.label}
                to={child.href || '#'}
                className="block px-4 py-2 text-sm text-center text-body hover:text-ink hover:bg-canvas-soft-2 no-underline transition-colors"
              >
                {navLabel(t, child)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NavMenu({ items, mobile }: { items: NavItem[]; mobile?: boolean }) {
  if (!items || items.length === 0) return null;

  return (
    <>
      {items.map((item) => {
        if (item.children && item.children.length > 0) {
          return <NavDropdown key={item.i18n || item.label} item={item} mobile={mobile} />;
        }
        return <NavLink key={item.i18n || item.label} item={item} mobile={mobile} />;
      })}
    </>
  );
}

export { navLabel };
