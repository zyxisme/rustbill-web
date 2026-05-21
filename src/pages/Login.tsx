import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading, error: storeError, login, clearError } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Pass store error to local display
  useEffect(() => {
    if (storeError) {
      setLocalError(storeError);
    }
  }, [storeError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!username.trim()) {
      setLocalError(t('validation.required'));
      return;
    }
    if (!password) {
      setLocalError(t('validation.required'));
      return;
    }
    if (password.length < 6) {
      setLocalError(t('auth.passwordTooShort'));
      return;
    }

    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch {
      // Error is set in the store and picked up by the useEffect
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || storeError;
  const isLoading = authLoading || submitting;

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-canvas-soft-2 rounded-lg border border-hairline p-xl shadow-[0_0_20px_rgba(6,182,212,0.04)]">
          {/* Logo + Title */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-ink font-semibold text-lg tracking-tight no-underline mb-4">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#090c10" />
                <path d="M8 22V12L16 8L24 12V22L16 26L8 22Z" stroke="#06b6d4" strokeWidth="1.5" fill="none" />
                <circle cx="16" cy="17" r="3" fill="#06b6d4" />
              </svg>
              RustBill
            </Link>
            <h1 className="text-xl font-semibold text-ink tracking-tight">
              {t('auth.loginTitle')}
            </h1>
          </div>

          {/* Error display */}
          {displayError && (
            <div className="flex items-start gap-2 p-3 rounded-sm bg-error-soft text-error text-sm mb-4">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="login-username">{t('auth.username')}</Label>
              <Input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('auth.username')}
                autoComplete="username"
                autoFocus
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="login-password">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password')}
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-mute hover:text-body bg-transparent border-0 cursor-pointer p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full rounded-full mt-2"
              disabled={isLoading}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('auth.loginBtn')
              )}
            </Button>
          </form>

          <Separator className="my-5" />

          {/* Register link */}
          <p className="text-center text-sm text-body">
            {t('auth.noAccount')}{' '}
            <Link
              to="/register"
              className="text-link hover:underline font-medium no-underline"
            >
              {t('auth.goRegister')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
