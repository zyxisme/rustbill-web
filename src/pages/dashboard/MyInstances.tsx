import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Server, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/api/grpc-client';
import { useToast } from '@/hooks/use-toast';
import { StatusTag } from '@/components/StatusTag';
import { Button } from '@/components/ui/button';
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

interface InstanceInfo {
  id: string;
  status: string;
  productName: string;
  ipAddress: string;
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
  { value: '', labelKey: 'instances.filterAll' },
  { value: 'active', labelKey: 'instances.filterActive' },
  { value: 'stopped', labelKey: 'instances.filterStopped' },
  { value: 'terminated', labelKey: 'instances.filterTerminated' },
];

// ── Helpers ──────────────────────────────────────────────────────

function truncateUuid(id: string): string {
  if (!id) return '--';
  return id.length > 8 ? id.slice(0, 8) + '...' : id;
}

// ── Component ────────────────────────────────────────────────────

export default function MyInstances() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchInstances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = (await api.listInstances({
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter || undefined,
      })) as Record<string, unknown>;

      const list = (resp.instances as Record<string, unknown>[]) || [];
      const metaResp = resp.meta as Record<string, unknown> | undefined;

      setInstances(
        list.map((item) => ({
          id: String(item.id ?? ''),
          status: String(item.status ?? ''),
          productName: String(item.productName ?? ''),
          ipAddress: String(item.ipAddress ?? ''),
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
  }, [page, statusFilter, t, toast]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  // ── Error state ────────────────────────────────────────────────
  if (error && instances.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-ink text-2xl font-semibold">{t('instances.title')}</h1>
        <Card className="border-error-soft">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-error text-sm">{error}</p>
            <Button variant="outline" onClick={fetchInstances}>
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
        <h1 className="text-ink text-2xl font-semibold">{t('instances.title')}</h1>
        <p className="text-body text-sm mt-1">
          {t('instances.totalInstances', { count: meta.total })}
        </p>
      </div>

      {/* Filter bar */}
      <div>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('instances.filterAll')} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data table */}
      {loading ? (
        <div className="bg-canvas-soft rounded-lg border border-hairline overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('instances.colId')}</TableHead>
                <TableHead>{t('instances.colProduct')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('instances.colIp')}</TableHead>
                <TableHead>{t('instances.colStatus')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('instances.colCreatedAt')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-16 bg-canvas-soft-2 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-canvas-soft-2 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-20 bg-canvas-soft-2 rounded animate-pulse hidden md:block" /></TableCell>
                  <TableCell><div className="h-5 w-14 bg-canvas-soft-2 rounded-full animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-20 bg-canvas-soft-2 rounded animate-pulse hidden md:block" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : instances.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <Server className="h-10 w-10 text-mute" />
            <p className="text-body">{t('instances.empty')}</p>
            <Link to="/catalog" className="no-underline">
              <Button variant="primary">{t('instances.goShopping')}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="bg-canvas-soft rounded-lg border border-hairline overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('instances.colId')}</TableHead>
                  <TableHead>{t('instances.colProduct')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('instances.colIp')}</TableHead>
                  <TableHead>{t('instances.colStatus')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('instances.colCreatedAt')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((inst) => (
                  <TableRow
                    key={inst.id}
                    className="cursor-pointer hover:bg-canvas-soft-2"
                    onClick={() => navigate(inst.id)}
                  >
                    <TableCell className="text-ink font-mono text-xs">
                      {truncateUuid(inst.id)}
                    </TableCell>
                    <TableCell className="text-ink">{inst.productName}</TableCell>
                    <TableCell className="hidden md:table-cell text-ink font-mono text-xs">
                      {inst.ipAddress || t('instanceDetail.unassigned')}
                    </TableCell>
                    <TableCell>
                      <StatusTag status={inst.status} type="instance" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-body text-xs">
                      {inst.createdAt
                        ? new Date(inst.createdAt).toLocaleDateString()
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
                  <span className="hidden sm:inline">{t('common.prev')}</span>
                </Button>
                <span className="text-body text-sm px-2">
                  {t('common.page', { page: meta.page })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                >
                  <span className="hidden sm:inline">{t('common.next')}</span>
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
