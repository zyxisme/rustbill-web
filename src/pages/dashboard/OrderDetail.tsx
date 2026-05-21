import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  RefreshCw,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '@/api/grpc-client';
import { useToast } from '@/hooks/use-toast';
import { StatusTag } from '@/components/StatusTag';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

// ── Local types ──────────────────────────────────────────────────

interface OrderInfo {
  id: string;
  customerId: string;
  productId: string;
  status: string;
  amount: string;
  currency: string;
  productName: string;
  billingCycle: string;
  gatewayId: string;
  gatewayPaymentId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  serverSpec?: Record<string, unknown>;
  extraSpecs?: Record<string, unknown>;
}

interface PaymentInfo {
  paymentId: string;
  gatewayId: string;
  paymentUrl: string;
  qrCode: string;
  instructions: string;
}

interface PaymentRecord {
  id: string;
  orderId: string;
  amount: string;
  currency: string;
  gatewayId: string;
  gatewayPaymentId: string;
  status: string;
  paidAt: string;
  createdAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────

function formatCurrency(amount: string): string {
  const n = parseFloat(amount);
  if (isNaN(n)) return amount;
  return n.toFixed(2);
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

function formatDateTime(iso: string): string {
  if (!iso) return '--';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

// ── Component ────────────────────────────────────────────────────

export default function OrderDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [orderResp, paymentsResp] = await Promise.all([
        api.getOrder(id),
        api.listPayments({ orderId: id, pageSize: 50 }).catch(() => null),
      ]);

      const o = (orderResp as Record<string, unknown>).order as Record<string, unknown>;
      if (!o || !o.id) {
        setError(t('orderDetail.notFound'));
        setLoading(false);
        return;
      }

      const serverSpec = (o.serverSpec as Record<string, unknown>) || {};
      const extraSpecs = serverSpec.extraSpecs as Record<string, unknown> | undefined;

      setOrder({
        id: String(o.id ?? ''),
        customerId: String(o.customerId ?? ''),
        productId: String(o.productId ?? ''),
        status: String(o.status ?? ''),
        amount: String(o.amount ?? '0'),
        currency: String(o.currency ?? 'CNY'),
        productName: String(o.productName ?? ''),
        billingCycle: String(o.billingCycle ?? ''),
        gatewayId: String(o.gatewayId ?? ''),
        gatewayPaymentId: String(o.gatewayPaymentId ?? ''),
        notes: String(o.notes ?? ''),
        createdAt: String(o.createdAt ?? ''),
        updatedAt: String(o.updatedAt ?? ''),
        serverSpec,
        extraSpecs,
      });

      if (paymentsResp) {
        const pResp = paymentsResp as Record<string, unknown>;
        const list = (pResp.payments as Record<string, unknown>[]) || [];
        setPayments(
          list.map((item) => ({
            id: String(item.id ?? ''),
            orderId: String(item.orderId ?? ''),
            amount: String(item.amount ?? '0'),
            currency: String(item.currency ?? 'CNY'),
            gatewayId: String(item.gatewayId ?? ''),
            gatewayPaymentId: String(item.gatewayPaymentId ?? ''),
            status: String(item.status ?? ''),
            paidAt: String(item.paidAt ?? ''),
            createdAt: String(item.createdAt ?? ''),
          })),
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('error.generic');
      setError(message);
      toast({ title: t('common.error'), description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id, t, toast]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handlePay = async () => {
    if (!order || !order.gatewayId) return;
    setPaying(true);
    try {
      const resp = (await api.payOrder(order.id, order.gatewayId)) as Record<string, unknown>;
      const payment = resp.payment as Record<string, unknown> | undefined;
      if (payment) {
        setPaymentResult({
          paymentId: String(payment.paymentId ?? ''),
          gatewayId: String(payment.gatewayId ?? ''),
          paymentUrl: String(payment.paymentUrl ?? ''),
          qrCode: String(payment.qrCode ?? ''),
          instructions: String(payment.instructions ?? ''),
        });
        toast({ title: t('common.success'), description: t('orderDetail.completePayment') });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('error.generic');
      toast({ title: t('orderDetail.payFailed'), description: message, variant: 'error' });
    } finally {
      setPaying(false);
    }
  };

  const handleCopyId = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may not be available
    }
  };

  // ── Specs key/value ───────────────────────────────────────────
  const specsEntries: [string, string][] = [];
  if (order?.serverSpec) {
    for (const [k, v] of Object.entries(order.serverSpec)) {
      if (k === 'extraSpecs') continue;
      if (k === 'id' || k === 'customerId' || k === 'productId' || k === 'providerId') continue;
      specsEntries.push([k, String(v ?? '--')]);
    }
  }
  if (order?.extraSpecs) {
    for (const [k, v] of Object.entries(order.extraSpecs)) {
      specsEntries.push([k, String(v ?? '--')]);
    }
  }

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/dashboard/orders" className="no-underline">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              {t('orderDetail.back')}
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-16">
            <div className="space-y-4 animate-pulse">
              <div className="h-6 w-32 bg-canvas-soft-2 rounded" />
              <div className="h-4 w-48 bg-canvas-soft-2 rounded" />
              <div className="h-4 w-40 bg-canvas-soft-2 rounded" />
              <div className="h-4 w-36 bg-canvas-soft-2 rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────
  if (error || !order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/dashboard/orders" className="no-underline">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              {t('orderDetail.back')}
            </Button>
          </Link>
        </div>
        <Card className="border-error-soft">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <p className="text-error text-sm">{error || t('orderDetail.notFound')}</p>
            <Button variant="outline" onClick={fetchOrder}>
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
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      {/* Back link */}
      <div className="flex items-center gap-2">
        <Link to="/dashboard/orders" className="no-underline">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            {t('orderDetail.back')}
          </Button>
        </Link>
      </div>

      {/* Order info card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('orderDetail.title')}</CardTitle>
            <StatusTag status={order.status} type="order" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Order ID */}
            <div>
              <p className="text-mute text-xs uppercase tracking-wider mb-1">{t('orderDetail.orderId')}</p>
              <div className="flex items-center gap-2">
                <p className="text-ink font-mono text-sm">{order.id}</p>
                <button
                  onClick={handleCopyId}
                  className="text-mute hover:text-ink transition-colors bg-transparent border-0 cursor-pointer p-0"
                  title={t('common.copy')}
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            {/* Product */}
            <div>
              <p className="text-mute text-xs uppercase tracking-wider mb-1">{t('orderDetail.product')}</p>
              <p className="text-ink text-sm">{order.productName}</p>
            </div>
            {/* Amount */}
            <div>
              <p className="text-mute text-xs uppercase tracking-wider mb-1">{t('orderDetail.amount')}</p>
              <p className="text-ink font-mono text-sm">
                {formatCurrency(order.amount)} {order.currency}
              </p>
            </div>
            {/* Billing Cycle */}
            <div>
              <p className="text-mute text-xs uppercase tracking-wider mb-1">{t('orderDetail.billingCycle')}</p>
              <p className="text-ink text-sm">
                {t(cycleI18nKey(order.billingCycle), order.billingCycle)}
              </p>
            </div>
            {/* Created */}
            <div>
              <p className="text-mute text-xs uppercase tracking-wider mb-1">{t('orderDetail.createdAt')}</p>
              <p className="text-ink text-sm">{formatDateTime(order.createdAt)}</p>
            </div>
            {/* Updated */}
            <div>
              <p className="text-mute text-xs uppercase tracking-wider mb-1">{t('orderDetail.updatedAt')}</p>
              <p className="text-ink text-sm">{formatDateTime(order.updatedAt)}</p>
            </div>
            {/* Notes */}
            {order.notes && (
              <div className="md:col-span-2">
                <p className="text-mute text-xs uppercase tracking-wider mb-1">{t('common.description')}</p>
                <p className="text-body text-sm">{order.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Specs */}
      {specsEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('orderDetail.specs')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {specsEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="bg-canvas rounded-md border border-hairline px-3 py-2"
                >
                  <p className="text-mute text-xs mb-0.5">{key}</p>
                  <p className="text-ink text-sm font-mono">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('product.completePayment')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pay button */}
          {order.status === 'pending' && order.gatewayId && (
            <div>
              {paymentResult ? (
                <div className="space-y-4">
                  {/* QR Code */}
                  {paymentResult.qrCode && (
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-body text-sm">{t('product.goToPay')}</p>
                      <img
                        src={paymentResult.qrCode}
                        alt="QR Code"
                        className="w-36 h-36 sm:w-48 sm:h-48 border border-hairline rounded-lg bg-white p-2"
                      />
                    </div>
                  )}
                  {/* Payment URL */}
                  {paymentResult.paymentUrl && (
                    <div className="text-center">
                      <a
                        href={paymentResult.paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-link hover:text-link-deep text-sm no-underline"
                      >
                        {t('product.goToPay')}
                      </a>
                    </div>
                  )}
                  {/* Instructions */}
                  {paymentResult.instructions && (
                    <div className="bg-canvas rounded-md border border-hairline p-4">
                      <p className="text-mute text-xs uppercase tracking-wider mb-2">{t('common.description')}</p>
                      <pre className="text-body text-sm whitespace-pre-wrap font-sans">
                        {paymentResult.instructions}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <Button variant="primary" onClick={handlePay} disabled={paying}>
                  <CreditCard className="h-4 w-4" />
                  {paying ? t('common.loading') : t('orderDetail.payNow')}
                </Button>
              )}
            </div>
          )}

          {order.status !== 'pending' && (
            <p className="text-body text-sm">{t('status.order.' + order.status, order.status)}</p>
          )}

          {!order.gatewayId && order.status === 'pending' && (
            <div className="bg-warning-soft rounded-md border border-warning-deep/30 p-4">
              <p className="text-warning text-sm">{t('product.noGateway')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Payment records */}
      <div>
        <h2 className="text-ink text-lg font-semibold mb-3">
          {t('orderDetail.paymentRecords')}
        </h2>
        {payments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-body text-sm">{t('orderDetail.noPayments')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-canvas-soft rounded-lg border border-hairline overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orderDetail.colPaymentId')}</TableHead>
                  <TableHead>{t('orderDetail.colAmount')}</TableHead>
                  <TableHead>{t('orderDetail.colStatus')}</TableHead>
                  <TableHead>{t('orderDetail.colTime')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-ink font-mono text-xs">
                      {p.gatewayPaymentId || p.id.slice(0, 8) + '...'}
                    </TableCell>
                    <TableCell className="text-ink font-mono">
                      {formatCurrency(p.amount)} {p.currency}
                    </TableCell>
                    <TableCell>
                      <StatusTag status={p.status} type="payment" />
                    </TableCell>
                    <TableCell className="text-body text-xs">
                      {p.paidAt
                        ? formatDateTime(p.paidAt)
                        : formatDateTime(p.createdAt)}
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
