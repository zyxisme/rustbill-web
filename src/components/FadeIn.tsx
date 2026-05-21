import { useRef, useState, useEffect, type ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  rootMargin?: string;
}

export default function FadeIn({ children, className = '', delay, rootMargin = '100px' }: FadeInProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      className={className}
      style={delay != null ? { animationDelay: `${delay}ms` } : undefined}
    >
      {visible ? (
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      ) : (
        <div className="opacity-0">{children}</div>
      )}
    </div>
  );
}
