import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, error: storeError, register, sendVerificationCode, clearError } = useAuthStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (storeError) {
      setLocalError(storeError);
    }
  }, [storeError]);

  useEffect(() => {
    return () => {
      clearError();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [clearError]);

  // Auto-clear localError when fields change
  useEffect(() => {
    if (localError) setLocalError(null);
  }, [username, email, displayName, password, confirmPassword, verificationCode]);

  const startCountdown = (secs: number) => {
    setCountdown(secs);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      setLocalError(t('validation.email'));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError(t('validation.email'));
      return;
    }

    setSendingCode(true);
    try {
      const retryAfter = await sendVerificationCode(email.trim());
      startCountdown(retryAfter);
      toast({
        title: t('auth.codeSent'),
        variant: 'success',
      });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('auth.sendCodeFailed'));
    } finally {
      setSendingCode(false);
    }
  };

  const validate = (): string | null => {
    if (!username.trim()) return t('validation.required');
    if (username.trim().length < 3) return t('validation.minLength', { min: 3 });
    if (!email.trim()) return t('validation.email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return t('validation.email');
    if (!displayName.trim()) return t('validation.required');
    if (!password) return t('validation.required');
    if (password.length < 6) return t('auth.passwordTooShort');
    if (password !== confirmPassword) return t('auth.passwordMismatch');
    if (!verificationCode.trim()) return t('validation.required');
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const validationError = validate();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await register(username.trim(), email.trim(), displayName.trim(), password, verificationCode.trim());
      toast({
        title: t('auth.registerSuccess'),
        variant: 'success',
      });
      navigate('/login', { replace: true });
    } catch {
      // Error is set in the store and picked up by the useEffect
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || storeError;
  const isLoading = authLoading || submitting;

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-6 py-16 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-canvas-soft-2 rounded-lg border border-hairline p-8 shadow-[0_0_20px_rgba(0,209,167,0.04)]">
          {/* Logo + Title */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-ink font-semibold text-lg tracking-tight no-underline mb-4">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#090c10" />
                <path d="M8 22V12L16 8L24 12V22L16 26L8 22Z" stroke="#00d1a7" strokeWidth="1.5" fill="none" />
                <circle cx="16" cy="17" r="3" fill="#00d1a7" />
              </svg>
              RustBill
            </Link>
            <h1 className="text-xl font-semibold text-ink tracking-tight">
              {t('auth.registerTitle')}
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
              <Label htmlFor="reg-username">{t('auth.username')}</Label>
              <Input
                id="reg-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('auth.username')}
                autoComplete="username"
                autoFocus
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-email">{t('auth.email')}</Label>
              <Input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.email')}
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            {/* Verification Code */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-code">{t('auth.verificationCode')}</Label>
              <div className="flex gap-2">
                <Input
                  id="reg-code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder={t('auth.verificationCodePlaceholder')}
                  maxLength={6}
                  autoComplete="one-time-code"
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleSendCode}
                  disabled={isLoading || sendingCode || countdown > 0}
                  className="whitespace-nowrap"
                >
                  {sendingCode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : countdown > 0 ? (
                    t('auth.codeSentRetry', { secs: countdown })
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      {t('auth.sendCode')}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-displayname">{t('auth.displayName')}</Label>
              <Input
                id="reg-displayname"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('auth.displayNamePlaceholder')}
                autoComplete="name"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-password">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password')}
                  autoComplete="new-password"
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
              {password && password.length < 6 && (
                <p className="text-xs text-warning mt-1">
                  {t('auth.passwordTooShort')}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-confirm">{t('auth.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirmPassword')}
                  autoComplete="new-password"
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-mute hover:text-body bg-transparent border-0 cursor-pointer p-1"
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-warning mt-1">
                  {t('auth.passwordMismatch')}
                </p>
              )}
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
                t('auth.registerBtn')
              )}
            </Button>
          </form>

          <Separator className="my-5" />

          {/* Login link */}
          <p className="text-center text-sm text-body">
            {t('auth.hasAccount')}{' '}
            <Link
              to="/login"
              className="text-link hover:underline font-medium no-underline"
            >
              {t('auth.goLogin')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
