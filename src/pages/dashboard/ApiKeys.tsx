import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { listApiKeys, createApiKey, revokeApiKey, type ApiKeyInfo } from '@/api/grpc-client';

export default function ApiKeys() {
  const { t } = useTranslation();
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadKeys = async () => {
    try {
      const result = await listApiKeys();
      setKeys(result);
    } catch (e: any) {
      if (e.message?.includes('permission_denied')) {
        setError(t('apiKeys.permissionDenied'));
      } else {
        setError(t('apiKeys.loadFailed', { error: String(e) }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadKeys(); }, []);

  const handleCreate = async () => {
    if (!keyName.trim()) return;
    try {
      const result = await createApiKey(keyName);
      setShowNewKey(result.apiKey);
      setShowCreate(false);
      setKeyName('');
      await loadKeys();
    } catch (e) {
      alert(t('apiKeys.createFailed', { error: String(e) }));
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm(t('apiKeys.revokeConfirm'))) return;
    try {
      await revokeApiKey(id);
      setKeys(prev => prev.map(k => k.id === id ? { ...k, enabled: false } : k));
    } catch (e) {
      alert(t('apiKeys.revokeFailed', { error: String(e) }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="p-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('apiKeys.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('apiKeys.description')}</p>
        </div>
        <button onClick={() => { setShowCreate(true); setError(null); }} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors">
          {t('apiKeys.create')}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-4 text-sm text-amber-200">
          {error}
        </div>
      )}

      {showNewKey && (
        <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 p-4 mb-4">
          <p className="text-sm font-semibold mb-2 text-teal-300">{t('apiKeys.newKeyNotice')}</p>
          <code className="text-xs break-all bg-background/50 rounded px-3 py-2 block mb-3 font-mono">{showNewKey}</code>
          <div className="flex gap-2">
            <button onClick={() => { navigator.clipboard.writeText(showNewKey); }} className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700">
              {t('apiKeys.copyToClipboard')}
            </button>
            <button onClick={() => setShowNewKey(null)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5">
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="rounded-lg border border-white/10 bg-card p-4 mb-4">
          <label className="block text-sm font-medium mb-2">{t('apiKeys.keyName')}</label>
          <input
            type="text"
            value={keyName}
            onChange={e => setKeyName(e.target.value)}
            placeholder={t('apiKeys.keyNamePlaceholder')}
            className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 mb-3"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="rounded-lg bg-teal-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-700">
              {t('apiKeys.create')}
            </button>
            <button onClick={() => { setShowCreate(false); setKeyName(''); }} className="rounded-lg border border-white/10 px-4 py-1.5 text-sm hover:bg-white/5">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {keys.length === 0 && !error ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">{t('apiKeys.emptyTitle')}</p>
          <p className="text-sm">{t('apiKeys.emptyDescription')}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">{t('apiKeys.colName')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('apiKeys.colKey')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('apiKeys.colStatus')}</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">{t('apiKeys.colCreatedAt')}</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">{t('apiKeys.colLastUsed')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('apiKeys.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id} className="border-t border-white/5 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm">{k.name}</td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{k.keyPrefix}...</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      k.enabled ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {k.enabled ? t('apiKeys.statusEnabled') : t('apiKeys.statusRevoked')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                    {k.createdAt ? new Date(k.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {k.enabled && (
                      <button onClick={() => handleRevoke(k.id)} className="text-xs text-red-400 hover:text-red-300 font-medium">
                        {t('apiKeys.revoke')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
