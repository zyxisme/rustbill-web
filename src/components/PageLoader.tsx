import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  variant?: 'public' | 'dashboard';
}

export default function PageLoader({ variant = 'public' }: PageLoaderProps) {
  if (variant === 'dashboard') {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
    </div>
  );
}
