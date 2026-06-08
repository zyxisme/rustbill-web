import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  Play,
  Square,
  RotateCw,
  Trash2,
} from 'lucide-react';
import { api } from '@/api/grpc-client';
import { useToast } from '@/hooks/use-toast';
import { StatusTag } from '@/components/StatusTag';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

// ── Local types ──────────────────────────────────────────────────

interface InstanceInfo {
  id: string;
  orderId: string;
  customerId: string;
  productId: string;
  status: string;
  ipAddress: string;
  productName: string;
  serverSpec: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface InstanceDetailField {
  key: string;
  value: string;
  valueType: string;
}

interface InstanceDetailSection {
  title: string;
  fields: InstanceDetailField[];
  contentHtml: string;
}

interface InstanceAction {
  id: string;
  label: string;
  style: string;
  confirmation: string;
  enabled: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  if (!iso) return '--';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

// ── Action icon map ──────────────────────────────────────────────

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  start: Play,
  stop: Square,
  restart: RotateCw,
  terminate: Trash2,
};

// ── Component ────────────────────────────────────────────────────

export default function InstanceDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [instance, setInstance] = useState<InstanceInfo | null>(null);
  const [sections, setSections] = useState<InstanceDetailSection[]>([]);
  const [actions, setActions] = useState<InstanceAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchInstance = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const resp = (await api.getInstance(id)) as Record<string, unknown>;
      const inst = resp.instance as Record<string, unknown>;
      if (!inst || !inst.id) {
        setError(t('instanceDetail.notFound'));
        setLoading(false);
        return;
      }

      setInstance({
        id: String(inst.id ?? ''),
        orderId: String(inst.orderId ?? ''),
        customerId: String(inst.customerId ?? ''),
        productId: String(inst.productId ?? ''),
        status: String(inst.status ?? ''),
        ipAddress: String(inst.ipAddress ?? ''),
        productName: String(inst.productName ?? ''),
        serverSpec: (inst.serverSpec as Record<string, unknown>) || {},
        createdAt: String(inst.createdAt ?? ''),
        updatedAt: String(inst.updatedAt ?? ''),
      });

      const rawSections = (resp.sections as Record<string, unknown>[]) || [];
      setSections(
        rawSections.map((s) => ({
          title: String(s.title ?? ''),
          fields: ((s.fields as Record<string, unknown>[]) || []).map((f) => ({
            key: String(f.key ?? ''),
            value: String(f.value ?? ''),
            valueType: String(f.valueType ?? ''),
          })),
          contentHtml: String(s.contentHtml ?? ''),
        })),
      );

      const rawActions = (resp.actions as Record<string, unknown>[]) || [];
      setActions(
        rawActions.map((a) => ({
          id: String(a.id ?? ''),
          label: String(a.label ?? ''),
          style: String(a.style ?? ''),
          confirmation: String(a.confirmation ?? ''),
          enabled: a.enabled !== false,
        })),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : t('error.generic');
      setError(message);
      toast({ title: t('common.error'), description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id, t, toast]);

  useEffect(() => {
    fetchInstance();
  }, [fetchInstance]);

  const handleAction = async (action: InstanceAction) => {
    if (!instance) return;
    setActionLoading(action.id);
    try {
      switch (action.id) {
        case 'start':
          await api.startInstance(instance.id);
          break;
        case 'stop':
          await api.stopInstance(instance.id);
          break;
        case 'restart':
        case 'reboot':
          await api.restartInstance(instance.id);
          break;
        case 'terminate':
        case 'destroy':
          await api.terminateInstance(instance.id);
          break;
        default:
          console.warn('Unknown instance action:', action.id);
      }
      toast({ title: t('common.success'), description: action.label });
      await fetchInstance();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('error.generic');
      toast({ title: t('instanceDetail.actionFailed'), description: message, variant: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyId = async () => {
    if (!instance) return;
    try {
      await navigator.clipboard.writeText(instance.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may not be available
    }
  };

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/dashboard/instances" className="no-underline">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              {t('instanceDetail.back')}
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
  if (error || !instance) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/dashboard/instances" className="no-underline">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              {t('instanceDetail.back')}
            </Button>
          </Link>
        </div>
        <Card className="border-error-soft">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <p className="text-error text-sm">{error || t('instanceDetail.notFound')}</p>
            <Button variant="outline" onClick={fetchInstance}>
              <RefreshCw className="h-4 w-4" />
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Specs key/value ───────────────────────────────────────────
  const specsEntries: [string, string][] = [];
  for (const [k, v] of Object.entries(instance.serverSpec)) {
    if (k === 'id' || k === 'instanceId' || k === 'customerId' || k === 'productId' || k === 'providerId' || k === 'providerInstanceId') continue;
    specsEntries.push([k, String(v ?? '--')]);
  }

  // ── Main render ───────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      {/* Back link */}
      <div className="flex items-center gap-2">
        <Link to="/dashboard/instances" className="no-underline">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            {t('instanceDetail.back')}
          </Button>
        </Link>
      </div>

      {/* Instance info card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('instanceDetail.title')}</CardTitle>
            <StatusTag status={instance.status} type="instance" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Instance ID */}
            <div>
              <p className="text-mute text-xs uppercase tracking-wider mb-1">{t('instanceDetail.instanceId')}</p>
              <div className="flex items-center gap-2">
                <p className="text-ink font-mono text-sm">{instance.id}</p>
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
              <p className="text-mute text-xs uppercase tracking-wider mb-1">{t('instanceDetail.product')}</p>
              <p className="text-ink text-sm">{instance.productName}</p>
            </div>
            {/* IP Address */}
            <div>
              <p className="text-mute text-xs uppercase tracking-wider mb-1">{t('instanceDetail.ipAddress')}</p>
              <p className="text-ink font-mono text-sm">
                {instance.ipAddress || t('instanceDetail.unassigned')}
              </p>
            </div>
            {/* Created */}
            <div>
              <p className="text-mute text-xs uppercase tracking-wider mb-1">{t('instanceDetail.createdAt')}</p>
              <p className="text-ink text-sm">{formatDateTime(instance.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specs */}
      {specsEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('instanceDetail.specs')}</CardTitle>
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

      {/* Instance actions */}
      {actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('common.actions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {actions.map((action) => {
                const Icon = ACTION_ICONS[action.id] || null;
                const isDestructive = action.style === 'danger' || action.style === 'destructive';
                const needsConfirmation = !!action.confirmation || isDestructive;

                if (!needsConfirmation) {
                  return (
                    <Button
                      key={action.id}
                      variant={isDestructive ? 'destructive' : 'secondary'}
                      size="md"
                      disabled={!action.enabled || actionLoading === action.id}
                      onClick={() => handleAction(action)}
                    >
                      {actionLoading === action.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : Icon ? (
                        <Icon className="h-4 w-4" />
                      ) : null}
                      {action.label}
                    </Button>
                  );
                }

                return (
                  <AlertDialog key={action.id}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant={isDestructive ? 'destructive' : 'secondary'}
                        size="md"
                        disabled={!action.enabled || actionLoading === action.id}
                      >
                        {actionLoading === action.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : Icon ? (
                          <Icon className="h-4 w-4" />
                        ) : null}
                        {action.label}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {action.confirmation || t('common.confirmAction')}
                        </AlertDialogTitle>
                        {isDestructive && (
                          <AlertDialogDescription>
                            {t('common.confirmDelete')}
                          </AlertDialogDescription>
                        )}
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleAction(action)}
                          className={isDestructive ? '' : '!bg-primary !text-primary-foreground hover:!bg-primary-hover'}
                        >
                          {t('common.confirm')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                );
              })}
            </div>
            {actions.every((a) => !a.enabled) && (
              <p className="text-body text-sm">{t('instanceDetail.noActions')}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Provider sections */}
      {sections.map((section, idx) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Fields */}
            {section.fields.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {section.fields.map((field) => (
                  <div
                    key={field.key}
                    className="bg-canvas rounded-md border border-hairline px-3 py-2"
                  >
                    <p className="text-mute text-xs mb-0.5">{field.key}</p>
                    <p className="text-ink text-sm font-mono">{field.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Content HTML iframe */}
            {section.contentHtml && (
              <div className="rounded-md border border-hairline overflow-hidden">
                <iframe
                  srcDoc={section.contentHtml}
                  sandbox="allow-scripts"
                  title={section.title}
                  className="w-full min-h-[300px] border-0 bg-white"
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {sections.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-body text-sm">{t('common.noData')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
