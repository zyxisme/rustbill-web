import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

// ── Status label i18n key maps ──

export const ORDER_STATUS: Record<string, string> = {
  pending: 'status.order.pending',
  paid: 'status.order.paid',
  provisioning: 'status.order.provisioning',
  active: 'status.order.active',
  suspended: 'status.order.suspended',
  cancelled: 'status.order.cancelled',
  refunded: 'status.order.refunded',
  completed: 'status.order.completed',
  terminated: 'status.order.terminated',
};

export const PAYMENT_STATUS: Record<string, string> = {
  pending: 'status.payment.pending',
  success: 'status.payment.success',
  failed: 'status.payment.failed',
  refunded: 'status.payment.refunded',
};

export const INVOICE_STATUS: Record<string, string> = {
  draft: 'status.invoice.draft',
  issued: 'status.invoice.issued',
  paid: 'status.invoice.paid',
  overdue: 'status.invoice.overdue',
  cancelled: 'status.invoice.cancelled',
};

export const TICKET_STATUS: Record<string, string> = {
  pending: 'status.ticket.pending',
  processing: 'status.ticket.processing',
  resolved: 'status.ticket.resolved',
  closed: 'status.ticket.closed',
};

export const INSTANCE_STATUS: Record<string, string> = {
  active: 'status.instance.active',
  running: 'status.instance.running',
  stopped: 'status.instance.stopped',
  suspended: 'status.instance.suspended',
  provisioning: 'status.instance.provisioning',
  terminated: 'status.instance.terminated',
};

// ── Status-to-color maps ──

type Variant = 'default' | 'success' | 'warning' | 'error' | 'primary' | 'outline';

const ORDER_COLORS: Record<string, Variant> = {
  pending: 'warning',
  paid: 'success',
  provisioning: 'warning',
  active: 'success',
  suspended: 'warning',
  cancelled: 'error',
  refunded: 'default',
  completed: 'success',
  terminated: 'error',
};

const PAYMENT_COLORS: Record<string, Variant> = {
  pending: 'warning',
  success: 'success',
  failed: 'error',
  refunded: 'default',
};

const INVOICE_COLORS: Record<string, Variant> = {
  draft: 'default',
  issued: 'warning',
  paid: 'success',
  overdue: 'error',
  cancelled: 'default',
};

const TICKET_COLORS: Record<string, Variant> = {
  pending: 'warning',
  processing: 'warning',
  resolved: 'success',
  closed: 'default',
};

const INSTANCE_COLORS: Record<string, Variant> = {
  active: 'success',
  running: 'success',
  stopped: 'error',
  suspended: 'warning',
  provisioning: 'warning',
  terminated: 'default',
};

// ── StatusTag component ──

type StatusTagType = 'order' | 'payment' | 'invoice' | 'ticket' | 'instance';

interface StatusTagProps {
  status: string;
  type: StatusTagType;
  className?: string;
}

function getColorMap(type: StatusTagType): Record<string, Variant> {
  switch (type) {
    case 'order':
      return ORDER_COLORS;
    case 'payment':
      return PAYMENT_COLORS;
    case 'invoice':
      return INVOICE_COLORS;
    case 'ticket':
      return TICKET_COLORS;
    case 'instance':
      return INSTANCE_COLORS;
  }
}

function getI18nKey(type: StatusTagType, status: string): string {
  switch (type) {
    case 'order':
      return `status.order.${status}`;
    case 'payment':
      return `status.payment.${status}`;
    case 'invoice':
      return `status.invoice.${status}`;
    case 'ticket':
      return `status.ticket.${status}`;
    case 'instance':
      return `status.instance.${status}`;
  }
}

export function StatusTag({ status, type, className }: StatusTagProps) {
  const { t } = useTranslation();
  const colorMap = getColorMap(type);
  const variant = colorMap[status] ?? 'default';
  const i18nKey = getI18nKey(type, status);
  const label = t(i18nKey, status);

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
