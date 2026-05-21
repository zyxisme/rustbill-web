import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { navLabel } from '@/components/NavMenu';
import type { NavItem } from 'virtual:brand';
import * as Lucide from 'lucide-react';

function SidebarIcon({ name }: { name?: string }) {
  if (!name) return null;
  const Icon = (Lucide as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  if (!Icon) return null;
  return <Icon className="h-4 w-4 shrink-0" />;
}

export default function SidebarNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const { t } = useTranslation();
  const location = useLocation();

  if (!items || items.length === 0) return null;

  return (
    <>
      {items.map((item) => {
        const label = navLabel(t, item);
        const isActive = item.href && location.pathname === item.href;

        if (item.children && item.children.length > 0) {
          return (
            <div key={item.i18n || item.label} className="space-y-0.5">
              <div className="flex items-center gap-3 px-3 py-2 text-xs font-mono text-mute uppercase tracking-wider">
                <SidebarIcon name={item.icon} />
                <span>{label}</span>
              </div>
              {item.children.map((child: NavItem) => {
                const childLabel = navLabel(t, child);
                const childActive = child.href && location.pathname === child.href;
                return (
                  <Link
                    key={child.i18n || child.label}
                    to={child.href || '#'}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-3 pl-8 pr-3 py-2 text-sm rounded-sm no-underline transition-colors',
                      childActive
                        ? 'text-ink bg-canvas-soft-2 border-l-2 border-l-primary -ml-[2px]'
                        : 'text-body hover:text-ink hover:bg-canvas-soft-2',
                    )}
                  >
                    <span>{childLabel}</span>
                  </Link>
                );
              })}
            </div>
          );
        }

        return (
          <Link
            key={item.i18n || item.label}
            to={item.href || '#'}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm rounded-sm no-underline transition-colors',
              isActive
                ? 'text-ink bg-canvas-soft-2 border-l-2 border-l-primary -ml-[2px]'
                : 'text-body hover:text-ink hover:bg-canvas-soft-2',
            )}
          >
            <SidebarIcon name={item.icon} />
            <span>{label}</span>
          </Link>
        );
      })}
    </>
  );
}
