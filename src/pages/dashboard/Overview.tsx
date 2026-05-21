import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Wallet,
  ShoppingCart,
  Server,
  Ticket,
  Plus,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/api/grpc-client';
import { useAuthStore } from '@/stores/auth';
import { StatusTag } from '@/components/StatusTag';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import type { UserInfo } from '@/stores/auth';

// ── Local types ──────────────────────────────────────────────────

interface OrderInfo {
  id: string;
  status: string;
  productName: string;
  amount: string;
  billingCycle: string;
  createdAt: string;
}

interface PageMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface StatCard {
  labelKey: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

// ── Helpers ──────────────────────────────────────────────────────

function formatCurrency(amount: string): string {
  const n = parseFloat(amount);
  if (isNaN(n)) return amount;
  return n.toFixed(2);
}

function truncateUuid(id: string): string {
  if (!id) return '--';
  return id.length > 8 ? id.slice(0, 8) + '...' : id;
}

function cycleI18nKey(cycle: string): string {
  const map: Record<string, string> = {
    monthly: 'cycle.monthly',
    quarterly: 'cycle.quarterly',
    yearly: 'cycle.yearly',
    one_time: 'cycle.oneTime',
  };
  return map[cycle] || cycle;
}

// ── Skeleton ─────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-canvas-soft rounded-lg border border-hairline p-lg animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-canvas-soft-2" />
        <div className="h-4 w-20 bg-canvas-soft-2 rounded" />
      </div>
      <div className="h-8 w-28 bg-canvas-soft-2 rounded mb-2" />
      <div className="h-3 w-16 bg-canvas-soft-2 rounded" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell><div className="h-4 w-16 bg-canvas-soft-2 rounded" /></TableCell>
      <TableCell><div className="h-4 w-24 bg-canvas-soft-2 rounded" /></TableCell>
      <TableCell><div className="h-4 w-16 bg-canvas-soft-2 rounded" /></TableCell>
      <TableCell><div className="h-5 w-14 bg-canvas-soft-2 rounded-full" /></TableCell>
      <TableCell><div className="h-4 w-12 bg-canvas-soft-2 rounded" /></TableCell>
      <TableCell><div className="h-4 w-20 bg-canvas-soft-2 rounded" /></TableCell>
    </TableRow>
  );
}

// ── Component ────────────────────────────────────────────────────

export default function Overview() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [balance, setBalance] = useState<string | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [instanceCount, setInstanceCount] = useState<number | null>(null);
  const [ticketCount, setTicketCount] = useState<number | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [balanceResp, ordersResp, instancesResp, ticketsResp] = await Promise.all([
        api.getBalance().catch(() => null),
        api.listOrders({ pageSize: 5 }).catch(() => null),
        api.listInstances({ pageSize: 1 }).catch(() => null),
        api.listTickets({ pageSize: 1 }).catch(() => null),
      ]);

      if (balanceResp) {
        const bal = balanceResp as Record<string, unknown>;
        setBalance(String(bal.balance ?? '0'));
      } else {
        setBalance('0');
      }

      if (ordersResp) {
        const o = ordersResp as Record<string, unknown>;
        const meta = o.meta as Record<string, unknown> | undefined;
        setOrderCount(meta ? Number(meta.total ?? 0) : 0);
        const list = (o.orders as Record<string, unknown>[]) || [];
        setRecentOrders(
          list.map((item) => ({
            id: String(item.id ?? ''),
            status: String(item.status ?? ''),
            productName: String(item.productName ?? ''),
            amount: String(item.amount ?? '0'),
            billingCycle: String(item.billingCycle ?? ''),
            createdAt: String(item.createdAt ?? ''),
          })),
        );
      } else {
        setOrderCount(0);
        setRecentOrders([]);
      }

      if (instancesResp) {
        const ins = instancesResp as Record<string, unknown>;
        const meta = ins.meta as Record<string, unknown> | undefined;
        setInstanceCount(meta ? Number(meta.total ?? 0) : 0);
      } else {
        setInstanceCount(0);
      }

      if (ticketsResp) {
        const tk = ticketsResp as Record<string, unknown>;
        const meta = tk.meta as Record<string, unknown> | undefined;
        setTicketCount(meta ? Number(meta.total ?? 0) : 0);
      } else {
        setTicketCount(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.generic'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats: StatCard[] = [
    {
      labelKey: 'overview.balance',
      value: balance !== null ? formatCurrency(balance) : '--',
      icon: Wallet,
      href: '/dashboard/balance',
    },
    {
      labelKey: 'overview.orders',
      value: orderCount !== null ? String(orderCount) : '--',
      icon: ShoppingCart,
      href: '/dashboard/orders',
    },
    {
      labelKey: 'overview.instances',
      value: instanceCount !== null ? String(instanceCount) : '--',
      icon: Server,
      href: '/dashboard/instances',
    },
    {
      labelKey: 'overview.tickets',
      value: ticketCount !== null ? String(ticketCount) : '--',
      icon: Ticket,
      href: '/dashboard/tickets',
    },
  ];

  // ── Error state ────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-ink text-2xl font-semibold">
            {t('overview.welcome')}
            {user?.displayName || user?.username}
          </h1>
          <p className="text-body text-sm mt-1">{t('overview.subtitle')}</p>
        </div>
        <Card className="border-error-soft">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-error text-sm">{error}</p>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-ink text-2xl font-semibold">
          {t('overview.welcome')}
          {user?.displayName || user?.username}
        </h1>
        <p className="text-body text-sm mt-1">{t('overview.subtitle')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.labelKey}
                  to={stat.href}
                  className="no-underline group"
                >
                  <div className="bg-canvas-soft rounded-lg border border-hairline p-lg hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-soft flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-mute text-sm">{t(stat.labelKey)}</span>
                    </div>
                    <p className="text-ink text-2xl font-semibold font-mono">
                      {stat.value}
                    </p>
                  </div>
                </Link>
              );
            })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-ink text-lg font-semibold mb-3">
          {t('overview.quickActions')}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/catalog" className="no-underline">
            <Button variant="primary" size="md">
              <Plus className="h-4 w-4" />
              {t('overview.browseProducts')}
            </Button>
          </Link>
          <Link to="/dashboard/orders" className="no-underline">
            <Button variant="secondary" size="md">
              <ShoppingCart className="h-4 w-4" />
              {t('overview.viewAll')}
            </Button>
          </Link>
          <Link to="/dashboard/instances" className="no-underline">
            <Button variant="secondary" size="md">
              <Server className="h-4 w-4" />
              {t('nav.myInstances')}
            </Button>
          </Link>
        </div>
      </div>

      <Separator />

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-ink text-lg font-semibold">
            {t('overview.recentOrders')}
          </h2>
          <Link
            to="/dashboard/orders"
            className="flex items-center gap-1 text-sm text-link hover:text-link-deep no-underline transition-colors"
          >
            {t('overview.viewAll')}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="bg-canvas-soft rounded-lg border border-hairline overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orders.colId')}</TableHead>
                  <TableHead>{t('orders.colProduct')}</TableHead>
                  <TableHead>{t('orders.colAmount')}</TableHead>
                  <TableHead>{t('orders.colStatus')}</TableHead>
                  <TableHead>{t('orders.colCycle')}</TableHead>
                  <TableHead>{t('orders.colCreatedAt')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </TableBody>
            </Table>
          </div>
        ) : recentOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <ShoppingCart className="h-8 w-8 text-mute" />
              <p className="text-body text-sm">{t('overview.noOrders')}</p>
              <Link to="/catalog" className="no-underline">
                <Button variant="primary" size="sm">
                  {t('orders.goShopping')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-canvas-soft rounded-lg border border-hairline overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orders.colId')}</TableHead>
                  <TableHead>{t('orders.colProduct')}</TableHead>
                  <TableHead>{t('orders.colAmount')}</TableHead>
                  <TableHead>{t('orders.colStatus')}</TableHead>
                  <TableHead>{t('orders.colCycle')}</TableHead>
                  <TableHead>{t('orders.colCreatedAt')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-canvas-soft-2"
                    onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                  >
                    <TableCell className="text-ink font-mono text-xs">
                      {truncateUuid(order.id)}
                    </TableCell>
                    <TableCell className="text-ink">{order.productName}</TableCell>
                    <TableCell className="text-ink font-mono">
                      {formatCurrency(order.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusTag status={order.status} type="order" />
                    </TableCell>
                    <TableCell className="text-body text-xs">
                      {t(cycleI18nKey(order.billingCycle), order.billingCycle)}
                    </TableCell>
                    <TableCell className="text-body text-xs">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : '--'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
