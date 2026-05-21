import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, User, Lock, Eye, EyeOff } from 'lucide-react';
import { api } from '@/api/grpc-client';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwState, setPwState] = useState<FormState>('idle');
  const [pwError, setPwError] = useState('');

  // Show/hide password toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    // Validate
    if (newPassword.length < 6) {
      setPwError(t('settings.passwordTooShort'));
      setPwState('error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError(t('settings.passwordMismatch'));
      setPwState('error');
      return;
    }
    if (!currentPassword) {
      setPwError(t('validation.required'));
      setPwState('error');
      return;
    }

    setPwState('submitting');
    setPwError('');

    try {
      await api.changePassword({
        oldPassword: currentPassword,
        newPassword,
      });
      setPwState('success');
      toast({ title: t('settings.passwordChanged') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : t('settings.changeFailed'));
      setPwState('error');
    }
  };

  const formatDate = (val?: string) => {
    if (!val) return '--';
    try {
      return new Date(val).toLocaleDateString();
    } catch {
      return val;
    }
  };

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <h1 className="text-2xl font-semibold text-ink">{t('settings.title')}</h1>

      {/* Profile section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>{t('settings.profile')}</CardTitle>
          </div>
          <CardDescription>{t('settings.profile')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t('settings.username')}</Label>
              <Input
                value={user?.username ?? ''}
                disabled
                className="text-body cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('settings.email')}</Label>
              <Input
                value={user?.email ?? ''}
                disabled
                className="text-body cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('settings.displayName')}</Label>
              <Input
                value={user?.displayName ?? ''}
                disabled
                className="text-body cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('settings.customerId')}</Label>
              <Input
                value={user?.customerId ?? ''}
                disabled
                className="text-body cursor-not-allowed font-mono text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change password section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle>{t('settings.changePassword')}</CardTitle>
          </div>
          <CardDescription>
            {t('auth.passwordTooShort')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current password */}
            <div className="space-y-2">
              <Label htmlFor="current-pw">{t('settings.currentPassword')}</Label>
              <div className="relative">
                <Input
                  id="current-pw"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (pwState === 'error') setPwState('idle');
                  }}
                  disabled={pwState === 'submitting' || pwState === 'success'}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-body bg-transparent border-0 cursor-pointer p-0"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="space-y-2">
              <Label htmlFor="new-pw">{t('settings.newPassword')}</Label>
              <div className="relative">
                <Input
                  id="new-pw"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (pwState === 'error') setPwState('idle');
                  }}
                  disabled={pwState === 'submitting' || pwState === 'success'}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-body bg-transparent border-0 cursor-pointer p-0"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-pw">{t('settings.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirm-pw"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (pwState === 'error') setPwState('idle');
                  }}
                  disabled={pwState === 'submitting' || pwState === 'success'}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-body bg-transparent border-0 cursor-pointer p-0"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password strength hint */}
            {newPassword.length > 0 && newPassword.length < 6 && (
              <p className="text-xs text-warning">{t('settings.passwordTooShort')}</p>
            )}

            {/* Mismatch hint */}
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-xs text-error">{t('settings.passwordMismatch')}</p>
            )}

            {/* Error message */}
            {pwState === 'error' && pwError && (
              <div className="p-3 bg-error-soft border border-error/30 rounded text-sm text-error">
                {pwError}
              </div>
            )}

            {/* Success message */}
            {pwState === 'success' && (
              <div className="p-3 bg-cyan-soft border border-success/30 rounded text-sm text-success">
                {t('settings.passwordChanged')}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleChangePassword}
                disabled={
                  pwState === 'submitting' ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
              >
                {pwState === 'submitting' ? t('common.saving') : t('settings.changePassword')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
