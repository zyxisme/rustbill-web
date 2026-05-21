import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/api/grpc-client';
import { useToast } from '@/hooks/use-toast';
import { StatusTag } from '@/components/StatusTag';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';

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

// ── Constants ────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: '', labelKey: 'orders.filterAll' },
  { value: 'pending', labelKey: 'orders.filterPending' },
  { value: 'active', labelKey: 'orders.filterActive' },
  { value: 'completed', labelKey: 'orders.filterCompleted' },
];

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

// ── Component ────────────────────────────────────────────────────

export default function MyOrders() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = (await api.listOrders({
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter || undefined,
        search: searchText || undefined,
      })) as Record<string, unknown>;

      const list = (resp.orders as Record<string, unknown>[]) || [];
      const metaResp = resp.meta as Record<string, unknown> | undefined;

      setOrders(
        list.map((item) => ({
          id: String(item.id ?? ''),
          status: String(item.status ?? ''),
          productName: String(item.productName ?? ''),
          amount: String(item.amount ?? '0'),
          billingCycle: String(item.billingCycle ?? ''),
          createdAt: String(item.createdAt ?? ''),
        })),
      );

      setMeta({
        total: metaResp ? Number(metaResp.total ?? 0) : 0,
        page: metaResp ? Number(metaResp.page ?? 1) : 1,
        pageSize: metaResp ? Number(metaResp.pageSize ?? PAGE_SIZE) : PAGE_SIZE,
        totalPages: metaResp ? Number(metaResp.totalPages ?? 0) : 0,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('error.generic');
      setError(message);
      toast({ title: t('common.error'), description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchText, t, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    // Trigger refetch via page state change
  };

  // ── Error state ────────────────────────────────────────────────
  if (error && orders.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-ink text-2xl font-semibold">{t('orders.title')}</h1>
        <Card className="border-error-soft">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-error text-sm">{error}</p>
            <Button variant="outline" onClick={fetchOrders}>
              <RefreshCw className="h-4 w-4" />
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-ink text-2xl font-semibold">{t('orders.title')}</h1>
        <p className="text-body text-sm mt-1">
          {t('orders.totalOrders', { count: meta.total })}
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('orders.filterAll')} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2 flex-1">
          <Input
            placeholder={t('common.search') + '...'}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button variant="secondary" size="md" onClick={handleSearch}>
            <Search className="h-4 w-4" />
            {t('common.search')}
          </Button>
        </div>
      </div>

      {/* Data table */}
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
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-16 bg-canvas-soft-2 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-canvas-soft-2 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-16 bg-canvas-soft-2 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-5 w-14 bg-canvas-soft-2 rounded-full animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-12 bg-canvas-soft-2 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-20 bg-canvas-soft-2 rounded animate-pulse" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <ShoppingCart className="h-10 w-10 text-mute" />
            <p className="text-body">{t('orders.empty')}</p>
            <Link to="/catalog" className="no-underline">
              <Button variant="primary">{t('orders.goShopping')}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
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
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-canvas-soft-2"
                    onClick={() => navigate(order.id)}
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

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-body text-sm">
                {t('pagination.showing', {
                  from: (meta.page - 1) * meta.pageSize + 1,
                  to: Math.min(meta.page * meta.pageSize, meta.total),
                  total: meta.total,
                })}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('orders.prevPage')}
                </Button>
                <span className="text-body text-sm px-2">
                  {t('orders.page', { page: meta.page })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                >
                  {t('orders.nextPage')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
