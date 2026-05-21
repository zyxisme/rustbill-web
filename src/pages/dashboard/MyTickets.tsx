import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Ticket, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/api/grpc-client';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { StatusTag } from '@/components/StatusTag';

interface TktInfo { id: string; customerId: string; title: string; description: string; status: string; priority: string; assigneeUserId: string; creatorUserId: string; createdAt: string; updatedAt: string; }
interface PageMeta { total: number; page: number; pageSize: number; totalPages: number; }

const PAGE_SIZE = 15;

const PRIORITY_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'primary' | 'outline'> = {
  low: 'default',
  medium: 'warning',
  high: 'error',
  urgent: 'error',
};

function mapTicket(raw: Record<string, unknown>): TktInfo {
  return {
    id: String(raw.id ?? ''),
    customerId: String(raw.customerId ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    status: String(raw.status ?? ''),
    priority: String(raw.priority ?? 'medium'),
    assigneeUserId: String(raw.assigneeUserId ?? ''),
    creatorUserId: String(raw.creatorUserId ?? ''),
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}

function mapMeta(raw: Record<string, unknown> | undefined): PageMeta {
  if (!raw) return { total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 };
  return {
    total: Number(raw.total) || 0,
    page: Number(raw.page) || 1,
    pageSize: Number(raw.pageSize) || PAGE_SIZE,
    totalPages: Number(raw.totalPages) || 0,
  };
}

type State = 'loading' | 'error' | 'ok';

export default function MyTickets() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  const [state, setState] = useState<State>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [tickets, setTickets] = useState<TktInfo[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('');

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchTickets = useCallback(async (page: number, status: string) => {
    setState('loading');
    setErrorMessage('');
    try {
      const payload: Record<string, unknown> = {
        pagination: { page, pageSize: PAGE_SIZE },
      };
      if (status) payload.status = status;

      const resp = await api.listTickets(payload);
      const tkts = ((resp.tickets ?? []) as Record<string, unknown>[]).map(mapTicket);
      const pg = mapMeta(resp.meta as Record<string, unknown> | undefined);

      setTickets(tkts);
      setMeta(pg);
      setState('ok');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('error.generic'));
      setState('error');
    }
  }, [t]);

  useEffect(() => {
    fetchTickets(1, statusFilter);
  }, [fetchTickets, statusFilter]);

  const handlePageChange = (page: number) => {
    fetchTickets(page, statusFilter);
  };

  const retry = () => {
    fetchTickets(meta.page, statusFilter);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      await api.createTicket({
        title: newTitle.trim(),
        description: newDescription.trim(),
        priority: newPriority,
      });
      toast({ title: t('tickets.createSuccess') });
      setCreateOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewPriority('medium');
      fetchTickets(1, statusFilter);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t('tickets.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (val: string) => {
    if (!val) return '--';
    try {
      return new Date(val).toLocaleDateString();
    } catch {
      return val;
    }
  };

  // ── Loading ────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-ink">{t('tickets.title')}</h1>
        </div>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-canvas-soft-2 rounded" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-ink">{t('tickets.title')}</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="p-3 rounded-full bg-error-soft">
              <Ticket className="h-8 w-8 text-error" />
            </div>
            <p className="text-body text-sm">{errorMessage}</p>
            <Button variant="outline" size="sm" onClick={retry}>
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main ───────────────────────────────────────────────────
  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('tickets.title')}</h1>
          <p className="text-sm text-body mt-1">{t('tickets.subtitle')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('tickets.newTicket')}
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('tickets.filterAll')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('tickets.filterAll')}</SelectItem>
            <SelectItem value="pending">{t('tickets.filterPending')}</SelectItem>
            <SelectItem value="processing">{t('tickets.filterProcessing')}</SelectItem>
            <SelectItem value="resolved">{t('tickets.filterResolved')}</SelectItem>
            <SelectItem value="closed">{t('tickets.filterClosed')}</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-mute">
          {t('tickets.totalTickets', { count: meta.total })}
        </span>
      </div>

      {/* Empty */}
      {tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <Ticket className="h-12 w-12 text-mute" />
            <p className="text-body">{t('tickets.empty')}</p>
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('tickets.newTicket')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tickets.colTitle')}</TableHead>
                    <TableHead className="w-24">{t('tickets.colPriority')}</TableHead>
                    <TableHead className="w-24">{t('tickets.colStatus')}</TableHead>
                    <TableHead className="w-40">{t('tickets.colCreatedAt')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((tk) => (
                    <TableRow
                      key={tk.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/dashboard/tickets/${tk.id}`)}
                    >
                      <TableCell className="text-sm text-ink max-w-xs truncate">
                        {tk.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant={PRIORITY_COLORS[tk.priority] ?? 'default'}>
                          {t(`priority.${tk.priority}`, tk.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusTag status={tk.status} type="ticket" />
                      </TableCell>
                      <TableCell className="text-xs text-body">
                        {formatDate(tk.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-mute">
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
                  disabled={meta.page <= 1}
                  onClick={() => handlePageChange(meta.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('common.prev')}</span>
                </Button>
                <span className="text-xs text-body px-2">
                  {t('common.page', { page: meta.page })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => handlePageChange(meta.page + 1)}
                >
                  <span className="hidden sm:inline">{t('common.next')}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('tickets.newTicket')}</DialogTitle>
            <DialogDescription>{t('tickets.subtitle')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-title">{t('tickets.formTitle')}</Label>
              <Input
                id="ticket-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t('tickets.formTitlePlaceholder')}
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-desc">{t('tickets.formDescription')}</Label>
              <Textarea
                id="ticket-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={t('tickets.formDescriptionPlaceholder')}
                rows={5}
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-priority">{t('tickets.formPriority')}</Label>
              <Select value={newPriority} onValueChange={setNewPriority} disabled={creating}>
                <SelectTrigger id="ticket-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('priority.low')}</SelectItem>
                  <SelectItem value="medium">{t('priority.medium')}</SelectItem>
                  <SelectItem value="high">{t('priority.high')}</SelectItem>
                  <SelectItem value="urgent">{t('priority.urgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {createError && (
              <p className="text-sm text-error">{createError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newTitle.trim()}>
              {creating ? t('common.saving') : t('common.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
