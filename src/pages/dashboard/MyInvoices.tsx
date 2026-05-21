import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/api/grpc-client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { StatusTag } from '@/components/StatusTag';
import { Separator } from '@/components/ui/separator';

interface InvInfo { id: string; invoiceNumber: string; customerId: string; billingPeriodStart: string; billingPeriodEnd: string; amount: string; taxAmount: string; totalAmount: string; status: string; issuedAt: string; paidAt: string; dueDate: string; notes: string; createdAt: string; updatedAt: string; items: InvItemInfo[]; }
interface InvItemInfo { id: string; description: string; quantity: number; unitPrice: string; amount: string; }
interface PageMeta { total: number; page: number; pageSize: number; totalPages: number; }

const PAGE_SIZE = 15;

function mapInvoice(raw: Record<string, unknown>): InvInfo {
  return {
    id: String(raw.id ?? ''),
    invoiceNumber: String(raw.invoiceNumber ?? ''),
    customerId: String(raw.customerId ?? ''),
    billingPeriodStart: String(raw.billingPeriodStart ?? ''),
    billingPeriodEnd: String(raw.billingPeriodEnd ?? ''),
    amount: String(raw.amount ?? '0.00'),
    taxAmount: String(raw.taxAmount ?? '0.00'),
    totalAmount: String(raw.totalAmount ?? '0.00'),
    status: String(raw.status ?? ''),
    issuedAt: String(raw.issuedAt ?? ''),
    paidAt: String(raw.paidAt ?? ''),
    dueDate: String(raw.dueDate ?? ''),
    notes: String(raw.notes ?? ''),
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
    items: (raw.items as Record<string, unknown>[] ?? []).map((item) => ({
      id: String(item.id ?? ''),
      description: String(item.description ?? ''),
      quantity: Number(item.quantity) || 1,
      unitPrice: String(item.unitPrice ?? '0.00'),
      amount: String(item.amount ?? '0.00'),
    })),
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

type State = 'loading' | 'error' | 'empty' | 'ok';

export default function MyInvoices() {
  const { t } = useTranslation();

  const [state, setState] = useState<State>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [invoices, setInvoices] = useState<InvInfo[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvInfo | null>(null);

  const fetchInvoices = useCallback(async (page: number, status: string) => {
    setState('loading');
    setErrorMessage('');
    try {
      const payload: Record<string, unknown> = {
        pagination: { page, pageSize: PAGE_SIZE },
      };
      if (status) payload.status = status;

      const resp = await api.listInvoices(payload);
      const invs = ((resp.invoices ?? []) as Record<string, unknown>[]).map(mapInvoice);
      const pg = mapMeta(resp.meta as Record<string, unknown> | undefined);

      setInvoices(invs);
      setMeta(pg);
      setState(invs.length === 0 ? 'empty' : 'ok');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('error.generic'));
      setState('error');
    }
  }, [t]);

  useEffect(() => {
    fetchInvoices(1, statusFilter);
  }, [fetchInvoices, statusFilter]);

  const handlePageChange = (page: number) => {
    fetchInvoices(page, statusFilter);
  };

  const retry = () => {
    fetchInvoices(meta.page, statusFilter);
  };

  const formatAmount = (val: string) => {
    const n = parseFloat(val);
    if (isNaN(n)) return '--';
    return `¥${n.toFixed(2)}`;
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
          <h1 className="text-2xl font-semibold text-ink">{t('invoices.title')}</h1>
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
        <h1 className="text-2xl font-semibold text-ink">{t('invoices.title')}</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="p-3 rounded-full bg-error-soft">
              <FileText className="h-8 w-8 text-error" />
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">{t('invoices.title')}</h1>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('invoices.filterAll')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('invoices.filterAll')}</SelectItem>
            <SelectItem value="draft">{t('invoices.filterDraft')}</SelectItem>
            <SelectItem value="issued">{t('invoices.filterIssued')}</SelectItem>
            <SelectItem value="paid">{t('invoices.filterPaid')}</SelectItem>
            <SelectItem value="overdue">{t('invoices.filterOverdue')}</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-mute">
          {t('invoices.totalInvoices', { count: meta.total })}
        </span>
      </div>

      {/* Empty */}
      {state === 'empty' ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <FileText className="h-12 w-12 text-mute" />
            <p className="text-body">{t('invoices.empty')}</p>
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
                    <TableHead>{t('invoices.colNumber')}</TableHead>
                    <TableHead>{t('invoices.colPeriod')}</TableHead>
                    <TableHead>{t('invoices.colAmount')}</TableHead>
                    <TableHead>{t('common.amount')}</TableHead>
                    <TableHead>{t('invoices.colStatus')}</TableHead>
                    <TableHead>{t('invoices.colDueDate')}</TableHead>
                    <TableHead className="w-12">{t('common.view')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow
                      key={inv.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <TableCell className="font-mono text-xs text-ink">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell className="text-xs">
                        {`${formatDate(inv.billingPeriodStart)} - ${formatDate(inv.billingPeriodEnd)}`}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-ink tabular-nums">
                        {formatAmount(inv.totalAmount)}
                      </TableCell>
                      <TableCell>
                        {formatAmount(inv.taxAmount) !== '--' && parseFloat(inv.taxAmount) > 0 ? (
                          <span className="text-xs text-body">
                            {`${t('common.amount')} ${formatAmount(inv.amount)} + ${t('common.tax', '税')} ${formatAmount(inv.taxAmount)}`}
                          </span>
                        ) : (
                          <span className="text-xs text-body">{formatAmount(inv.amount)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusTag status={inv.status} type="invoice" />
                      </TableCell>
                      <TableCell className="text-xs text-body">
                        {formatDate(inv.dueDate)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" aria-label={t('common.view')}>
                          <Eye className="h-4 w-4" />
                        </Button>
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
                  {t('common.prev')}
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
                  {t('common.next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => { if (!open) setSelectedInvoice(null); }}>
        <DialogContent className="max-w-2xl">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle>{`${t('invoices.title')} - ${selectedInvoice.invoiceNumber}`}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-mute">{t('invoices.colNumber')}: </span>
                    <span className="text-ink font-mono">{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <div>
                    <span className="text-mute">{t('invoices.colStatus')}: </span>
                    <StatusTag status={selectedInvoice.status} type="invoice" />
                  </div>
                  <div>
                    <span className="text-mute">{t('invoices.colPeriod')}: </span>
                    <span className="text-ink">{formatDate(selectedInvoice.billingPeriodStart)} - {formatDate(selectedInvoice.billingPeriodEnd)}</span>
                  </div>
                  <div>
                    <span className="text-mute">{t('invoices.colDueDate')}: </span>
                    <span className="text-ink">{formatDate(selectedInvoice.dueDate)}</span>
                  </div>
                  <div>
                    <span className="text-mute">{t('common.createdAt')}: </span>
                    <span className="text-ink">{formatDate(selectedInvoice.issuedAt)}</span>
                  </div>
                  <div>
                    <span className="text-mute">{t('common.createdAt')} (paid): </span>
                    <span className="text-ink">{formatDate(selectedInvoice.paidAt)}</span>
                  </div>
                </div>

                <Separator />

                {/* Amounts */}
                <div className="flex items-center justify-end gap-6 text-sm">
                  <div className="text-right">
                    <div className="text-mute">{t('common.amount')}</div>
                    <div className="text-ink font-mono">{formatAmount(selectedInvoice.amount)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-mute">Tax</div>
                    <div className="text-ink font-mono">{formatAmount(selectedInvoice.taxAmount)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-mute">{t('common.total')}</div>
                    <div className="text-ink font-mono font-semibold text-lg">{formatAmount(selectedInvoice.totalAmount)}</div>
                  </div>
                </div>

                {/* Line items */}
                {selectedInvoice.items.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-ink mb-3">Line Items</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('common.description')}</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>{t('common.price')}</TableHead>
                            <TableHead className="text-right">{t('common.amount')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedInvoice.items.map((item: InvItemInfo) => (
                            <TableRow key={item.id}>
                              <TableCell className="text-sm">{item.description}</TableCell>
                              <TableCell className="text-sm">{item.quantity}</TableCell>
                              <TableCell className="text-sm font-mono">{formatAmount(item.unitPrice)}</TableCell>
                              <TableCell className="text-sm font-mono text-right">{formatAmount(item.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}

                <Separator />
                <div className="flex justify-end">
                  <DialogClose asChild>
                    <Button variant="outline" size="sm">{t('common.close')}</Button>
                  </DialogClose>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
