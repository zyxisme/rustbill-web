import { useState, useEffect } from 'react';
import type DOMPurifyType from 'dompurify';

function HtmlSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 rounded w-3/4 animate-shimmer" />
      <div className="h-4 rounded w-1/2 animate-shimmer" />
      <div className="h-4 rounded w-5/6 animate-shimmer" />
      <div className="h-4 rounded w-2/3 animate-shimmer" />
    </div>
  );
}

interface SafeHtmlProps {
  html: string;
  className?: string;
}

const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4',
    'p', 'div', 'section', 'article',
    'ul', 'ol', 'li',
    'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'code', 'pre', 'blockquote', 'hr', 'br',
    'strong', 'em', 'b', 'i',
    'span', 'details', 'summary', 'h5', 'h6',
  ],
  ALLOWED_ATTR: [
    'class', 'style', 'href', 'target', 'rel',
    'src', 'alt', 'width', 'height', 'loading',
    'colspan', 'rowspan', 'id',
  ],
  FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'link', 'meta', 'input', 'form'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
};

function sanitize(html: string, DOMPurify: typeof DOMPurifyType): string {
  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
}

let dompurifyModule: typeof DOMPurifyType | null = null;
let dompurifyLoadPromise: Promise<typeof DOMPurifyType> | null = null;

function loadDompurify(): Promise<typeof DOMPurifyType> {
  if (dompurifyModule) return Promise.resolve(dompurifyModule);
  if (!dompurifyLoadPromise) {
    dompurifyLoadPromise = import('dompurify').then((m) => {
      dompurifyModule = m.default;
      return dompurifyModule;
    });
  }
  return dompurifyLoadPromise;
}

export function SafeHtml({ html, className }: SafeHtmlProps) {
  const [sanitized, setSanitized] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadDompurify().then((dp) => {
      if (!cancelled) {
        setSanitized(sanitize(html, dp));
      }
    });
    return () => { cancelled = true; };
  }, [html]);

  if (!html) return null;
  if (sanitized === null) return <HtmlSkeleton />;

  return (
    <div
      className={className}
      style={{ contain: 'style layout' }}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
