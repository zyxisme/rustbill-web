interface PageLoaderProps {
  variant?: 'public' | 'dashboard';
}

export default function PageLoader({ variant = 'public' }: PageLoaderProps) {
  const minH = variant === 'dashboard' ? 'py-24' : 'min-h-[60vh]';

  return (
    <div className={`flex flex-col items-center justify-center gap-6 ${minH}`}>
      {/* Logo diamond with glow pulse */}
      <div className="animate-logo-pulse rounded-sm">
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#090c10" />
          <path d="M8 22V12L16 8L24 12V22L16 26L8 22Z" stroke="#06b6d4" strokeWidth="1.5" fill="none" />
          <circle cx="16" cy="17" r="3" fill="#06b6d4" />
        </svg>
      </div>

      {/* Loading text */}
      <span className="text-sm font-mono text-mute tracking-wider uppercase animate-pulse">
        Loading
      </span>

      {/* Progress bar */}
      <div className="w-32 h-0.5 bg-canvas-soft-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full"
          style={{ animation: 'progressIndeterminate 1.5s ease-in-out infinite' }}
        />
      </div>
    </div>
  );
}
