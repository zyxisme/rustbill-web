import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/api/grpc-client';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface BalanceTransaction {
  id: string; customerId: string; amount: string; balanceAfter: string;
  transactionType: string; referenceId: string; description: string; createdAt: string;
}
interface PageMeta { total: number; page: number; pageSize: number; totalPages: number; }

const PAGE_SIZE = 15;

function mapTransaction(raw: Record<string, unknown>): BalanceTransaction {
  return {
    id: String(raw.id ?? ''),
    customerId: String(raw.customerId ?? ''),
    amount: String(raw.amount ?? '0.00'),
    balanceAfter: String(raw.balanceAfter ?? '0.00'),
    transactionType: String(raw.transactionType ?? ''),
    referenceId: String(raw.referenceId ?? ''),
    description: String(raw.description ?? ''),
    createdAt: String(raw.createdAt ?? ''),
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

export default function MyBalance() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const [state, setState] = useState<State>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [balance, setBalance] = useState('0.00');
  const [creditLimit, setCreditLimit] = useState('0.00');
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 });
  const [typeFilter, setTypeFilter] = useState('');

  const fetchData = useCallback(async (page: number, txType: string) => {
    setState('loading');
    setErrorMessage('');
    try {
      const [balanceResp, txResp] = await Promise.all([
        api.getBalance({ customerId: user?.customerId }),
        api.listBalanceTransactions({
          pagination: { page, pageSize: PAGE_SIZE },
          ...(txType ? { transactionType: txType } : {}),
        }),
      ]);

      const bal = balanceResp as Record<string, unknown>;
      setBalance(String(bal.balance ?? '0.00'));
      setCreditLimit(String(bal.creditLimit ?? '0.00'));

      const tx = txResp as Record<string, unknown>;
      const txns = ((tx.transactions ?? []) as Record<string, unknown>[]).map(mapTransaction);
      const pg = mapMeta(tx.meta as Record<string, unknown> | undefined);

      setTransactions(txns);
      setMeta(pg);
      setState('ok');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('error.generic'));
      setState('error');
    }
  }, [t, user?.customerId]);

  useEffect(() => {
    fetchData(1, typeFilter);
  }, [fetchData, typeFilter]);

  const handlePageChange = (page: number) => {
    fetchData(page, typeFilter);
  };

  const retry = () => {
    fetchData(meta.page, typeFilter);
  };

  const formatAmount = (val: string) => {
    const n = parseFloat(val);
    if (isNaN(n)) return '--';
    return `¥${n.toFixed(2)}`;
  };

  const isPositive = (val: string) => {
    const n = parseFloat(val);
    return !isNaN(n) && n > 0;
  };

  const availableCredit = () => {
    const bal = parseFloat(balance);
    const limit = parseFloat(creditLimit);
    if (isNaN(bal) || isNaN(limit)) return '0.00';
    const avail = limit - bal;
    return avail < 0 ? '0.00' : avail.toFixed(2);
  };

  const formatDate = (val: string) => {
    if (!val) return '--';
    try {
      return new Date(val).toLocaleString();
    } catch {
      return val;
    }
  };

  // ── Loading ────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-ink">{t('balance.title')}</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-canvas-soft-2 rounded" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-canvas-soft-2 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-ink">{t('balance.title')}</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="p-3 rounded-full bg-error-soft">
              <Wallet className="h-8 w-8 text-error" />
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
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <h1 className="text-2xl font-semibold text-ink">{t('balance.title')}</h1>

      {/* Balance summary card */}
      <div className="bg-canvas-soft rounded-lg border border-hairline p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-sm text-mute mb-2">{t('balance.available')}</p>
            <p className="text-4xl font-semibold text-ink font-mono tracking-tight tabular-nums">
              {formatAmount(balance)}
            </p>
          </div>
          <div>
            <p className="text-sm text-mute mb-2">{t('balance.creditLimit')}</p>
            <p className="text-2xl font-semibold text-body font-mono tabular-nums">
              {formatAmount(creditLimit)}
            </p>
          </div>
          <div>
            <p className="text-sm text-mute mb-2">{t('balance.available')} Credit</p>
            <p className="text-2xl font-semibold text-cyan font-mono tabular-nums">
              {formatAmount(availableCredit())}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{t('balance.transactions')}</h2>
          <div className="flex items-center gap-3">
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === 'all' ? '' : v); }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t('balance.filterAll')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('balance.filterAll')}</SelectItem>
                <SelectItem value="recharge">{t('balance.filterRecharge')}</SelectItem>
                <SelectItem value="payment">{t('balance.filterPayment')}</SelectItem>
                <SelectItem value="refund">{t('balance.filterRefund')}</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-mute">
              {t('balance.totalTransactions', { count: meta.total })}
            </span>
          </div>
        </div>

        {transactions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Wallet className="h-12 w-12 text-mute" />
              <p className="text-body text-sm">{t('balance.noTransactions')}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">{t('balance.colTime')}</TableHead>
                      <TableHead className="w-24">{t('balance.colType')}</TableHead>
                      <TableHead className="w-32 text-right">{t('balance.colAmount')}</TableHead>
                      <TableHead className="w-32 text-right">{t('balance.colBalance')}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t('balance.colDescription')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs text-body">
                          {formatDate(tx.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isPositive(tx.amount) ? 'success' : 'warning'}>
                            {t(`txType.${tx.transactionType}`, tx.transactionType)}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono text-sm tabular-nums ${
                            isPositive(tx.amount) ? 'text-success' : 'text-error'
                          }`}
                        >
                          {isPositive(tx.amount) ? '+' : ''}{formatAmount(tx.amount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-ink tabular-nums">
                          {formatAmount(tx.balanceAfter)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-body max-w-xs truncate">
                          {tx.description || '--'}
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
      </div>
    </div>
  );
}
