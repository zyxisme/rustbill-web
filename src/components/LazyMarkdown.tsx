import { Suspense, useState, useEffect } from 'react';

const ReactMarkdown = React.lazy(() => import('react-markdown'));

function MarkdownSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-canvas-soft-2 rounded w-3/4" />
      <div className="h-4 bg-canvas-soft-2 rounded w-1/2" />
      <div className="h-4 bg-canvas-soft-2 rounded w-5/6" />
      <div className="h-4 bg-canvas-soft-2 rounded w-2/3" />
    </div>
  );
}

interface LazyMarkdownProps {
  children: string;
  className?: string;
}

export function LazyMarkdown({ children, className }: LazyMarkdownProps) {
  const [remarkGfm, setRemarkGfm] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    import('remark-gfm').then((m) => {
      if (!cancelled) setRemarkGfm(() => m.default);
    });
    return () => { cancelled = true; };
  }, []);

  if (!remarkGfm) return <MarkdownSkeleton />;

  return (
    <Suspense fallback={<MarkdownSkeleton />}>
      <div className={className}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {children}
        </ReactMarkdown>
      </div>
    </Suspense>
  );
}
