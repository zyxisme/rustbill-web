import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  ArrowLeft,
  ShoppingCart,
  Loader2,
  CheckCircle,
  Copy,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { api } from '@/api/grpc-client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { LazyMarkdown } from '@/components/LazyMarkdown';

// ── Types ──

interface ProductInfo {
  id: string;
  name: string;
  description: string;
  price: string;
  specs: Record<string, string>;
  groupId: string;
  billingCycles: Record<string, string>;
  interfaceId?: string;
  providerId?: string;
  active: boolean;
}

interface SpecField {
  key: string;
  label: string;
  fieldType: string;
  required: boolean;
  displayOrder: number;
  options: string[];
  min: string;
  max: string;
  defaultValue: string;
}

interface ProviderInfo {
  providerId: string;
  providerName: string;
  providerType: string;
  isHealthy: boolean;
  specTemplate?: { fields: SpecField[] };
}

interface GatewayInfo {
  gatewayId: string;
  gatewayName: string;
  isHealthy: boolean;
}

interface PaymentInfo {
  paymentId: string;
  gatewayId: string;
  paymentUrl: string;
  qrCode: string;
  instructions: string;
}

type LoadState = 'loading' | 'error' | 'notfound' | 'ready';
type OrderState = 'idle' | 'submitting' | 'success' | 'error';

const CYCLE_LABELS: Record<string, string> = {
  monthly: 'cycle.monthly',
  quarterly: 'cycle.quarterly',
  yearly: 'cycle.yearly',
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Data state
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [provider, setProvider] = useState<ProviderInfo | null>(null);
  const [gateways, setGateways] = useState<GatewayInfo[]>([]);

  // Form state
  const [billingCycle, setBillingCycle] = useState<string>('monthly');
  const [gatewayId, setGatewayId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [specValues, setSpecValues] = useState<Record<string, string>>({});
  const [orderState, setOrderState] = useState<OrderState>('idle');
  const [orderError, setOrderError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentInfo | null>(null);

  const load = async () => {
    if (!id) return;
    setLoadState('loading');
    setError(null);

    try {
      const [productResp, gatewaysResp] = await Promise.all([
        api.getProduct(id),
        api.listGateways(),
      ]);

      const prod = productResp.product as ProductInfo | undefined;
      if (!prod || !prod.active) {
        setLoadState('notfound');
        return;
      }
      setProduct(prod);

      const gwList = (gatewaysResp.gateways as GatewayInfo[]) || [];
      setGateways(gwList.filter((g) => g.isHealthy !== false));
      if (gwList.length > 0) {
        setGatewayId(gwList[0]!.gatewayId);
      }

      // Try to load provider spec template
      const interfaceId = prod.interfaceId || prod.providerId;
      if (interfaceId) {
        try {
          const provResp = await api.listProviders();
          const providers = (provResp.providers as ProviderInfo[]) || [];
          const matched = providers.find(
            (p) => p.providerId === interfaceId || p.providerId === prod.providerId,
          );
          if (matched) {
            setProvider(matched);

            // Initialize spec values from template defaults
            const fields = matched.specTemplate?.fields || [];
            const defaults: Record<string, string> = {};
            for (const field of fields) {
              if (field.defaultValue) {
                defaults[field.key] = field.defaultValue;
              }
            }
            // Merge with product specs
            if (prod.specs) {
              for (const [k, v] of Object.entries(prod.specs)) {
                if (!defaults[k]) {
                  defaults[k] = v;
                }
              }
            }
            setSpecValues(defaults);
          }
        } catch {
          // Provider lookup is optional; proceed without it
        }
      }

      // Set default billing cycle
      const cycles = prod.billingCycles || {};
      const cycleKeys = Object.keys(cycles);
      if (cycleKeys.length > 0) {
        if (cycleKeys.includes('monthly')) {
          setBillingCycle('monthly');
        } else {
          setBillingCycle(cycleKeys[0]!);
        }
      }

      setLoadState('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.generic'));
      setLoadState('error');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Derived values ──

  const specFields = provider?.specTemplate?.fields || [];

  const currentPrice = (() => {
    if (!product) return null;
    const cycles = product.billingCycles || {};
    if (cycles[billingCycle]) return cycles[billingCycle];
    if (product.price && product.price !== '0') return product.price;
    return null;
  })();

  const selectedGateway = gateways.find((g) => g.gatewayId === gatewayId);

  // ── Handlers ──

  const handleSpecChange = (key: string, value: string) => {
    setSpecValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!product || !id || !gatewayId) return;

    setOrderState('submitting');
    setOrderError(null);

    try {
      const payload: Record<string, unknown> = {
        productId: id,
        gatewayId,
        billingCycle,
        notes,
        currency: 'CNY',
      };

      // Build serverSpec from dynamic spec values
      if (Object.keys(specValues).length > 0) {
        payload.serverSpec = {
          extraSpecs: specValues,
        };
      }

      const resp = await api.createOrder(payload);
      const payment = resp.payment as PaymentInfo | undefined;

      if (payment) {
        setPaymentResult(payment);
        setOrderState('success');
        toast({
          title: t('product.orderSuccess'),
          description: t('product.orderSuccessDesc'),
        });
      } else {
        setOrderState('success');
        toast({
          title: t('product.orderSuccess'),
          description: t('product.orderSuccessDesc'),
        });
        // Navigate to orders list
        setTimeout(() => navigate('/dashboard/orders'), 1500);
      }
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : t('product.orderFailed'));
      setOrderState('error');
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t('product.copySuccess') });
    } catch {
      // fallback silently
    }
  };

  // ── Render spec field ──

  const renderSpecField = (field: SpecField) => {
    const value = specValues[field.key] ?? field.defaultValue ?? '';

    switch (field.fieldType) {
      case 'Integer':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={`spec-${field.key}`}>
              {field.label}
              {field.required && <span className="text-error ml-0.5">*</span>}
            </Label>
            <Input
              id={`spec-${field.key}`}
              type="number"
              min={field.min ? Number(field.min) : undefined}
              max={field.max ? Number(field.max) : undefined}
              value={value}
              onChange={(e) => handleSpecChange(field.key, e.target.value)}
              placeholder={field.label}
            />
          </div>
        );

      case 'String':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={`spec-${field.key}`}>
              {field.label}
              {field.required && <span className="text-error ml-0.5">*</span>}
            </Label>
            <Input
              id={`spec-${field.key}`}
              type="text"
              value={value}
              onChange={(e) => handleSpecChange(field.key, e.target.value)}
              placeholder={field.label}
            />
          </div>
        );

      case 'Select':
      case 'Region':
      case 'OsOptions':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={`spec-${field.key}`}>
              {field.label}
              {field.required && <span className="text-error ml-0.5">*</span>}
            </Label>
            <Select
              value={value || undefined}
              onValueChange={(v) => handleSpecChange(field.key, v)}
            >
              <SelectTrigger id={`spec-${field.key}`}>
                <SelectValue placeholder={field.label} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                )) || (
                  <>
                    <SelectItem value="placeholder">{field.label}</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        );

      case 'Boolean':
        return (
          <div key={field.key} className="flex items-center gap-2">
            <input
              id={`spec-${field.key}`}
              type="checkbox"
              checked={value === 'true'}
              onChange={(e) => handleSpecChange(field.key, e.target.checked ? 'true' : 'false')}
              className="h-4 w-4 rounded-xs border border-hairline bg-canvas accent-primary"
            />
            <Label htmlFor={`spec-${field.key}`} className="cursor-pointer">
              {field.label}
            </Label>
          </div>
        );

      default:
        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={`spec-${field.key}`}>{field.label}</Label>
            <Input
              id={`spec-${field.key}`}
              type="text"
              value={value}
              onChange={(e) => handleSpecChange(field.key, e.target.value)}
              placeholder={field.label}
            />
          </div>
        );
    }
  };

  // ── Not found state ──
  if (loadState === 'notfound') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Card className="max-w-md mx-6 bg-canvas-soft border-hairline">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-canvas-soft-2 border border-hairline mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-mute" />
            </div>
            <h3 className="text-ink font-semibold text-lg mb-2">
              {t('product.notFound')}
            </h3>
            <p className="text-body text-sm mb-6">{t('product.notFoundDesc')}</p>
            <Link to="/catalog" className="no-underline">
              <Button variant="primary" size="md">
                {t('product.backToCatalogLink')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Error state ──
  if (loadState === 'error') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Card className="max-w-md mx-6 bg-canvas-soft border-hairline">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-error-soft mx-auto mb-4">
              <RefreshCw className="h-6 w-6 text-error" />
            </div>
            <h3 className="text-ink font-semibold text-lg mb-2">{t('error.generic')}</h3>
            <p className="text-body text-sm mb-6">{error}</p>
            <Button variant="primary" size="md" onClick={load}>
              <RefreshCw className="h-4 w-4" />
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Loading state ──
  if (loadState === 'loading' || !product) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-[1400px] px-6 py-8">
          <div className="h-4 w-24 bg-canvas-soft-2 rounded-sm animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-canvas-soft">
                <CardContent className="p-8 animate-pulse">
                  <div className="h-8 w-64 bg-canvas-soft-2 rounded-sm mb-4" />
                  <div className="h-4 w-full bg-canvas-soft-2 rounded-sm mb-2" />
                  <div className="h-4 w-3/4 bg-canvas-soft-2 rounded-sm mb-8" />
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-4 w-full bg-canvas-soft-2 rounded-sm" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="bg-canvas-soft">
                <CardContent className="p-8 animate-pulse">
                  <div className="h-6 w-32 bg-canvas-soft-2 rounded-sm mb-4" />
                  <div className="h-10 w-full bg-canvas-soft-2 rounded-sm mb-4" />
                  <div className="h-10 w-full bg-canvas-soft-2 rounded-sm mb-4" />
                  <div className="h-12 w-full bg-canvas-soft-2 rounded-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Ready state ──
  return (
    <div className="min-h-screen bg-canvas pb-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
        {/* Back link */}
        <Link
          to="/catalog"
          className="inline-flex items-center gap-1.5 text-sm text-body hover:text-ink transition-colors no-underline mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('product.backToCatalog')}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Product info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Product header */}
            <Card className="bg-canvas-soft border border-hairline rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.04)]">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-ink tracking-tight">
                  {product.name}
                </CardTitle>
                {product.description && (
                  <CardDescription className="text-body text-sm mt-1">
                    {product.description}
                  </CardDescription>
                )}
              </CardHeader>

              {/* Specifications table */}
              {Object.keys(product.specs || {}).length > 0 && (
                <CardContent>
                  <h4 className="text-sm font-semibold text-ink mb-3">
                    {t('product.specifications')}
                  </h4>
                  <div className="rounded-sm border border-hairline overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        {Object.entries(product.specs).map(([key, val], i) => (
                          <tr
                            key={key}
                            className={cn(
                              i % 2 === 0 ? 'bg-canvas' : 'bg-canvas-soft',
                            )}
                          >
                            <td className="px-4 py-2.5 text-body font-medium min-w-[90px] sm:min-w-[140px]">
                              {key}
                            </td>
                            <td className="px-4 py-2.5 text-ink">{val}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}

              {/* Markdown description */}
              {product.description && product.description.length > 100 && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <h4 className="text-sm font-semibold text-ink mb-3">
                    {t('product.productDescription')}
                  </h4>
                <LazyMarkdown
                  className="prose prose-sm max-w-none text-body leading-relaxed
                    [&_h1]:text-ink [&_h2]:text-ink [&_h3]:text-ink [&_h4]:text-ink
                    [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base
                    [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-medium
                    [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:mt-5 [&_h3]:mb-2
                    [&_p]:leading-relaxed [&_ul]:pl-4 [&_ol]:pl-4
                    [&_code]:bg-canvas [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-xs [&_code]:text-xs [&_code]:font-mono [&_code]:text-primary
                    [&_pre]:bg-canvas [&_pre]:p-4 [&_pre]:rounded-sm [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-hairline
                    [&_pre_code]:bg-transparent [&_pre_code]:p-0
                    [&_a]:text-link [&_a]:hover:underline
                    [&_table]:w-full [&_th]:text-left [&_th]:text-xs [&_th]:text-mute [&_th]:font-medium [&_th]:py-2 [&_th]:px-3 [&_td]:py-2 [&_td]:px-3 [&_td]:text-sm
                    [&_tr]:border-b [&_tr]:border-hairline
                    [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:text-mute
                    [&_hr]:border-hairline"
                >
                  {product.description}
                </LazyMarkdown>
                </CardContent>
              )}
            </Card>

            {/* Billing cycles */}
            {Object.keys(product.billingCycles || {}).length > 0 && (
              <Card className="bg-canvas-soft border border-hairline rounded-lg">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-ink">
                    {t('product.billingCycle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(product.billingCycles).map(([key, price]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setBillingCycle(key)}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer',
                          billingCycle === key
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-canvas text-body border-hairline hover:border-hairline-strong hover:text-ink',
                        )}
                      >
                        {t(CYCLE_LABELS[key] ?? key)}
                        <span className="ml-1 opacity-70">{price}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Order form */}
          <div className="lg:col-span-1">
            <Card className="bg-canvas-soft border border-hairline rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.04)] md:sticky md:top-24">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-ink">
                  {t('product.orderNow')}
                </CardTitle>
                <CardDescription>
                  {t('product.priceDetail')}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Price summary */}
                {currentPrice && (
                  <div className="flex items-baseline justify-between p-3 rounded-sm bg-canvas border border-hairline">
                    <span className="text-sm text-body">{t('product.subtotal')}</span>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-ink">
                        {currentPrice}
                      </span>
                      <span className="text-sm text-mute ml-1">
                        {t(CYCLE_LABELS[billingCycle] ?? billingCycle)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Dynamic spec fields */}
                {specFields.length > 0 && (
                  <div className="space-y-3">
                    <Separator />
                    <h4 className="text-sm font-semibold text-ink">
                      {t('product.specifications')}
                    </h4>
                    {specFields
                      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                      .map(renderSpecField)}
                    <Separator />
                  </div>
                )}

                {/* Billing cycle selector in form */}
                {Object.keys(product.billingCycles || {}).length > 0 && (
                  <div className="space-y-1.5">
                    <Label>{t('product.billingCycle')}</Label>
                    <Select
                      value={billingCycle}
                      onValueChange={setBillingCycle}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(product.billingCycles).map(([key, price]) => (
                          <SelectItem key={key} value={key}>
                            {t(CYCLE_LABELS[key] ?? key)} - {price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Gateway selector */}
                <div className="space-y-1.5">
                  <Label>{t('product.selectGateway')}</Label>
                  {gateways.length > 0 ? (
                    <Select value={gatewayId} onValueChange={setGatewayId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gateways.map((gw) => (
                          <SelectItem key={gw.gatewayId} value={gw.gatewayId}>
                            {gw.gatewayName}
                            {!gw.isHealthy && ` (${t('status.instance.stopped')})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-mute">{t('product.noGateway')}</p>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="order-notes">{t('product.notes')}</Label>
                  <textarea
                    id="order-notes"
                    rows={3}
                    className="flex w-full rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-mute focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('product.notesPlaceholder')}
                  />
                </div>

                {/* Error */}
                {orderError && (
                  <div className="flex items-center gap-2 p-3 rounded-sm bg-error-soft text-error text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {orderError}
                  </div>
                )}

                {/* Agreement */}
                <p className="text-xs text-mute">{t('product.agreement')}</p>
              </CardContent>

              <CardFooter>
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-full w-full"
                  disabled={orderState === 'submitting' || !gatewayId}
                  onClick={handleSubmit}
                >
                  {orderState === 'submitting' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('common.submit')}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      {t('product.orderNow')}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Payment success panel */}
            {orderState === 'success' && paymentResult && (
              <Card className="mt-6 bg-canvas-soft border border-hairline rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.08)]">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <CardTitle className="text-base font-semibold text-ink">
                      {t('product.paymentInfo')}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentResult.qrCode && (
                    <div className="flex justify-center">
                      <img
                        src={paymentResult.qrCode}
                        alt={t('product.qrCode')}
                        className="w-36 h-36 sm:w-48 sm:h-48 rounded-sm border border-hairline bg-white p-2"
                      />
                    </div>
                  )}

                  {paymentResult.paymentUrl && (
                    <div className="space-y-2">
                      <Label className="text-xs text-mute">
                        {t('product.paymentUrl')}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={paymentResult.paymentUrl}
                          readOnly
                          className="text-xs font-mono flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopyUrl(paymentResult.paymentUrl)}
                          title={t('product.copyUrl')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {paymentResult.paymentUrl && (
                    <a
                      href={paymentResult.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="no-underline"
                    >
                      <Button variant="primary" size="md" className="w-full gap-2">
                        <ExternalLink className="h-4 w-4" />
                        {t('product.goToPay')}
                      </Button>
                    </a>
                  )}

                  {paymentResult.instructions && (
                    <div className="p-3 rounded-sm bg-canvas border border-hairline">
                      <h4 className="text-xs font-semibold text-ink mb-1.5">
                        {t('product.instructions')}
                      </h4>
                      <p className="text-xs text-body whitespace-pre-wrap">
                        {paymentResult.instructions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
