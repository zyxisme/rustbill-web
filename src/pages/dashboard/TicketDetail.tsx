import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Ticket, MessageSquare } from 'lucide-react';
import { api } from '@/api/grpc-client';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { StatusTag } from '@/components/StatusTag';

interface TktReply { id: string; ticketId: string; userId: string; customerId: string; content: string; isInternal: boolean; createdAt: string; }
interface TktFull { id: string; customerId: string; title: string; description: string; status: string; priority: string; assigneeUserId: string; creatorUserId: string; createdAt: string; updatedAt: string; replies: TktReply[]; }

type State = 'loading' | 'error' | 'ok';

const PRIORITY_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'primary' | 'outline'> = {
  low: 'default',
  medium: 'warning',
  high: 'error',
  urgent: 'error',
};

function mapTicket(raw: Record<string, unknown>): TktFull {
  const replies = raw.replies as Record<string, unknown>[] | undefined;
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
    replies: replies ? replies.map(mapReply) : [],
  };
}

function mapReply(raw: Record<string, unknown>): TktReply {
  return {
    id: String(raw.id ?? ''),
    ticketId: String(raw.ticketId ?? ''),
    userId: String(raw.userId ?? ''),
    customerId: String(raw.customerId ?? ''),
    content: String(raw.content ?? ''),
    isInternal: Boolean(raw.isInternal),
    createdAt: String(raw.createdAt ?? ''),
  };
}

export default function TicketDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  const [state, setState] = useState<State>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [ticket, setTicket] = useState<TktFull | null>(null);
  const [replies, setReplies] = useState<TktReply[]>([]);

  // Reply form
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState('');

  const fetchTicket = useCallback(async () => {
    if (!id) return;
    setState('loading');
    setErrorMessage('');
    try {
      const resp = await api.getTicket(id);
      const tk = mapTicket(resp as unknown as Record<string, unknown>);
      setTicket(tk);
      // Filter out internal replies
      setReplies((tk.replies ?? []).filter((r: TktReply) => !r.isInternal));
      setState('ok');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('error.generic'));
      setState('error');
    }
  }, [id, t]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleSendReply = async () => {
    if (!replyContent.trim() || !id) return;
    setSending(true);
    setReplyError('');
    try {
      const resp = await api.createTicketReply({
        ticketId: id,
        content: replyContent.trim(),
        isInternal: false,
      });
      const newReply = mapReply(resp as unknown as Record<string, unknown>);
      setReplies((prev) => [...prev, newReply]);
      setReplyContent('');
      toast({ title: t('ticketDetail.send') + ' ' + t('common.success') });
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : t('ticketDetail.replyFailed'));
    } finally {
      setSending(false);
    }
  };

  const formatDate = (val: string) => {
    if (!val) return '--';
    try {
      return new Date(val).toLocaleString();
    } catch {
      return val;
    }
  };

  const isOpen = ticket?.status !== 'closed';

  // ── Loading ────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="space-y-4">
        <Link to="/dashboard/tickets" className="flex items-center gap-1 text-sm text-body hover:text-ink transition-colors no-underline">
          <ArrowLeft className="h-4 w-4" />
          {t('ticketDetail.back')}
        </Link>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-canvas-soft-2 rounded w-1/3" />
          <div className="h-40 bg-canvas-soft-2 rounded" />
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────
  if (state === 'error' || !ticket) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard/tickets" className="flex items-center gap-1 text-sm text-body hover:text-ink transition-colors no-underline">
          <ArrowLeft className="h-4 w-4" />
          {t('ticketDetail.back')}
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="p-3 rounded-full bg-error-soft">
              <Ticket className="h-8 w-8 text-error" />
            </div>
            <p className="text-body text-sm">{errorMessage || t('ticketDetail.notFound')}</p>
            <Button variant="outline" size="sm" onClick={fetchTicket}>
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
      {/* Back link */}
      <Link to="/dashboard/tickets" className="flex items-center gap-1 text-sm text-body hover:text-ink transition-colors no-underline">
        <ArrowLeft className="h-4 w-4" />
        {t('ticketDetail.back')}
      </Link>

      {/* Ticket info card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl">{ticket.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={PRIORITY_COLORS[ticket.priority] ?? 'default'}>
                {t(`priority.${ticket.priority}`, ticket.priority)}
              </Badge>
              <StatusTag status={ticket.status} type="ticket" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-body whitespace-pre-wrap">{ticket.description}</p>
          <div className="flex items-center gap-6 text-xs text-mute">
            <span>{t('ticketDetail.createdAt', { time: formatDate(ticket.createdAt) })}</span>
            <span>{t('ticketDetail.updatedAt', { time: formatDate(ticket.updatedAt) })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          {t('ticketDetail.replies', { count: replies.length })}
        </h3>

        {replies.length === 0 ? (
          <p className="text-sm text-mute py-8 text-center">{t('ticketDetail.noReplies')}</p>
        ) : (
          replies.map((reply) => (
            <div
              key={reply.id}
              className="bg-canvas-soft border border-hairline rounded-md p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-ink">
                  {reply.userId === user?.id ? t('ticketDetail.me') : (reply.userId || t('ticketDetail.admin'))}
                </span>
                <span className="text-xs text-mute">{formatDate(reply.createdAt)}</span>
              </div>
              <p className="text-sm text-body whitespace-pre-wrap">{reply.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Reply form */}
      {isOpen && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={t('ticketDetail.replyPlaceholder')}
                rows={4}
                disabled={sending}
              />
              {replyError && (
                <p className="text-sm text-error">{replyError}</p>
              )}
              <div className="flex justify-end">
                <Button
                  onClick={handleSendReply}
                  disabled={sending || !replyContent.trim()}
                >
                  <Send className="h-4 w-4" />
                  {sending ? t('common.saving') : t('ticketDetail.send')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
