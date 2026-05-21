import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Package, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { api } from '@/api/grpc-client';
import { cn } from '@/lib/utils';

interface ProductInfo {
  id: string;
  name: string;
  description: string;
  price: string;
  specs: Record<string, string>;
  groupId: string;
  billingCycles: Record<string, string>;
  active: boolean;
}

interface ProductGroupInfo {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  productCount: number;
}

interface LoadedGroup {
  group: ProductGroupInfo;
  products: ProductInfo[];
}

type LoadState = 'loading' | 'error' | 'ready';
type CycleLabel = 'monthly' | 'quarterly' | 'yearly';

const CYCLE_KEYS: Record<string, string> = {
  monthly: 'catalog.perMonth',
  quarterly: 'catalog.perQuarter',
  yearly: 'catalog.perYear',
};

export default function Catalog() {
  const { t } = useTranslation();
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<LoadedGroup[]>([]);
  const [allProducts, setAllProducts] = useState<ProductInfo[]>([]);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const loadData = async () => {
    setState('loading');
    setError(null);
    try {
      const [groupsResp, productsResp] = await Promise.all([
        api.listProductGroups({ pagination: { page: 1, pageSize: 100 } }),
        api.listProducts({ pagination: { page: 1, pageSize: 500 }, isActive: true }),
      ]);

      const rawGroups = (groupsResp.groups as ProductGroupInfo[]) || [];
      const rawProducts = ((productsResp.products as ProductInfo[]) || []).filter(
        (p) => p.active !== false,
      );

      setAllProducts(rawProducts);

      // Sort groups by sortOrder
      const sorted = [...rawGroups].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      );

      const loaded: LoadedGroup[] = sorted.map((g) => ({
        group: g,
        products: rawProducts.filter((p) => p.groupId === g.id),
      }));

      // Products without a group go into "Other"
      const groupedIds = new Set(loaded.flatMap((lg) => lg.products.map((p) => p.id)));
      const ungrouped = rawProducts.filter((p) => !groupedIds.has(p.id));
      if (ungrouped.length > 0) {
        loaded.push({
          group: {
            id: '__other__',
            name: t('catalog.other'),
            description: '',
            sortOrder: 999,
            productCount: ungrouped.length,
          },
          products: ungrouped,
        });
      }

      setGroups(loaded);
      setState('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('catalog.errorLoading'));
      setState('error');
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;

    const q = search.toLowerCase();
    return groups
      .map((lg) => ({
        ...lg,
        products: lg.products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q)),
        ),
      }))
      .filter((lg) => lg.products.length > 0);
  }, [groups, search]);

  // ── Render helpers ──

  const renderPrice = (product: ProductInfo): string | null => {
    const cycles = product.billingCycles || {};
    if (product.price && product.price !== '0') {
      return `${product.price}`;
    }
    const keys = Object.keys(cycles);
    if (keys.length > 0) {
      const bestKey = keys.includes('monthly')
        ? 'monthly'
        : keys[0]!;
      return cycles[bestKey] ?? null;
    }
    return null;
  };

  const renderBillingCycleSuffix = (product: ProductInfo): string | null => {
    const cycles = product.billingCycles || {};
    if (product.price && product.price !== '0') {
      const keys = Object.keys(cycles);
      if (keys.length > 0) {
        const bestKey = keys.includes('monthly')
          ? 'monthly'
          : keys[0]!;
        return t(CYCLE_KEYS[bestKey] ?? 'catalog.perMonth');
      }
      return null;
    }
    return null;
  };

  // ── Loading state ──
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="bg-canvas-soft border-b border-hairline">
          <div className="mx-auto max-w-[1400px] px-6 py-8">
            <span className="text-xs font-mono text-mute uppercase tracking-wider">
              {t('catalog.eyebrow')}
            </span>
            <div className="mt-2 h-9 w-72 bg-canvas-soft-2 rounded-sm animate-pulse" />
          </div>
        </div>
        <div className="mx-auto max-w-[1400px] px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-canvas-soft animate-pulse">
                <CardContent className="p-lg">
                  <div className="h-5 w-32 bg-canvas-soft-2 rounded-sm mb-3" />
                  <div className="h-4 w-full bg-canvas-soft-2 rounded-sm mb-2" />
                  <div className="h-4 w-2/3 bg-canvas-soft-2 rounded-sm mb-4" />
                  <div className="flex gap-2 mb-4">
                    <div className="h-5 w-16 bg-canvas-soft-2 rounded-full" />
                    <div className="h-5 w-16 bg-canvas-soft-2 rounded-full" />
                  </div>
                  <div className="h-6 w-20 bg-canvas-soft-2 rounded-sm" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Card className="max-w-md mx-6 bg-canvas-soft border-hairline">
          <CardContent className="p-xl text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-error-soft mx-auto mb-4">
              <RefreshCw className="h-6 w-6 text-error" />
            </div>
            <h3 className="text-ink font-semibold text-lg mb-2">{t('catalog.errorLoading')}</h3>
            <p className="text-body text-sm mb-6">{error}</p>
            <Button variant="primary" size="md" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
              {t('catalog.retryLoading')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Empty state ──
  if (groups.length === 0 || groups.every((g) => g.products.length === 0)) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="bg-canvas-soft border-b border-hairline">
          <div className="mx-auto max-w-[1400px] px-6 py-8">
            <span className="text-xs font-mono text-mute uppercase tracking-wider">
              {t('catalog.eyebrow')}
            </span>
            <h1 className="mt-2 text-2xl font-semibold text-ink tracking-tight">
              {t('catalog.title')}
            </h1>
          </div>
        </div>
        <div className="mx-auto max-w-[1400px] px-6 py-24 flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-canvas-soft-2 border border-hairline mb-6">
            <Package className="h-8 w-8 text-mute" />
          </div>
          <h3 className="text-ink font-semibold text-lg mb-2">{t('catalog.empty')}</h3>
          <p className="text-body text-sm max-w-sm">{t('catalog.emptyHint')}</p>
        </div>
      </div>
    );
  }

  // ── Ready state ──
  return (
    <div className="min-h-screen bg-canvas">
      {/* Page title */}
      <div className="bg-canvas-soft border-b border-hairline">
        <div className="mx-auto max-w-[1400px] px-6 py-8">
          <span className="text-xs font-mono text-mute uppercase tracking-wider">
            {t('catalog.eyebrow')}
          </span>
          <h1 className="mt-2 text-2xl font-semibold text-ink tracking-tight">
            {t('catalog.title')}
          </h1>
          <p className="mt-1 text-sm text-body">{t('catalog.subtitle')}</p>

          {/* Search */}
          <div className="mt-6 max-w-md relative">
            <Search
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors',
                searchFocused ? 'text-primary' : 'text-mute',
              )}
            />
            <Input
              placeholder={t('catalog.searchPlaceholder') || 'Search products...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Groups */}
      <div className="mx-auto max-w-[1400px] px-6 py-12 space-y-14">
        {filteredGroups.map((lg) => (
          <section key={lg.group.id}>
            <div className="flex items-baseline gap-3 mb-6">
              <h2 className="text-xl font-semibold text-ink tracking-tight">
                {lg.group.name}
              </h2>
              {lg.group.description && (
                <span className="text-sm text-mute">{lg.group.description}</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lg.products.map((product) => {
                const price = renderPrice(product);
                const suffix = renderBillingCycleSuffix(product);
                const specs = product.specs || {};

                return (
                  <Card
                    key={product.id}
                    className="bg-canvas-soft rounded-lg border border-hairline p-lg hover:shadow-[0_0_40px_rgba(6,182,212,0.06)] transition-shadow"
                  >
                    <CardContent className="p-0 flex flex-col h-full">
                      {/* Name */}
                      <h3 className="text-ink font-semibold text-base mb-1.5">
                        {product.name}
                      </h3>

                      {/* Description */}
                      {product.description && (
                        <p className="text-body text-sm line-clamp-2 mb-3">
                          {product.description}
                        </p>
                      )}

                      {/* Specs badges */}
                      {Object.keys(specs).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {Object.entries(specs)
                            .slice(0, 4)
                            .map(([key, value]) => (
                              <Badge
                                key={key}
                                variant="default"
                                className="text-xs"
                              >
                                {key}: {value}
                              </Badge>
                            ))}
                          {Object.keys(specs).length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{Object.keys(specs).length - 4}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Spacer */}
                      <div className="flex-1" />

                      <Separator className="mb-4" />

                      {/* Price + CTA */}
                      <div className="flex items-center justify-between">
                        <div>
                          {price ? (
                            <span className="text-ink font-semibold text-lg">
                              {price}
                              {suffix && (
                                <span className="text-mute text-sm font-normal ml-0.5">
                                  {suffix}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-mute text-sm">{t('catalog.empty')}</span>
                          )}
                        </div>
                        <Link to={`/catalog/${product.id}`} className="no-underline">
                          <Button variant="primary" size="sm">
                            {t('catalog.buyNow')}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
