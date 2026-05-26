import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { brandName } from 'virtual:brand';
import { Search, Package, RefreshCw, Layers, Grid3X3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { api } from '@/api/grpc-client';
import type { ProductCategoryInfo } from '@/api/grpc-client';
import { cn } from '@/lib/utils';

// ── Local types ──

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
  categoryId: string;
}

type LoadState = 'loading' | 'error' | 'ready';

const CYCLE_KEYS: Record<string, string> = {
  monthly: 'catalog.perMonth',
  quarterly: 'catalog.perQuarter',
  yearly: 'catalog.perYear',
};

// ── Price helpers ──

function renderPrice(product: ProductInfo): string | null {
  const cycles = product.billingCycles || {};
  if (product.price && product.price !== '0') {
    return product.price;
  }
  const keys = Object.keys(cycles);
  if (keys.length > 0) {
    const bestKey = keys.includes('monthly') ? 'monthly' : keys[0]!;
    return cycles[bestKey] ?? null;
  }
  return null;
}

function renderBillingCycleSuffix(
  product: ProductInfo,
  t: (key: string) => string,
): string | null {
  const cycles = product.billingCycles || {};
  if (product.price && product.price !== '0') {
    const keys = Object.keys(cycles);
    if (keys.length > 0) {
      const bestKey = keys.includes('monthly') ? 'monthly' : keys[0]!;
      return t(CYCLE_KEYS[bestKey] ?? 'catalog.perMonth');
    }
    return null;
  }
  return null;
}

// ── URL query params hook ──

function useQueryParams() {
  const [params, setParams] = useState(() => new URLSearchParams(window.location.search));
  useEffect(() => {
    const handler = () => setParams(new URLSearchParams(window.location.search));
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);
  const setQuery = (key: string, value: string) => {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value); else next.delete(key);
    window.history.pushState(null, '', `?${next.toString()}`);
    setParams(next);
  };
  return [params, setQuery] as const;
}

// ── Component ──

export default function Catalog() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useQueryParams();

  // Data
  const [categories, setCategories] = useState<ProductCategoryInfo[]>([]);
  const [groups, setGroups] = useState<ProductGroupInfo[]>([]);
  const [products, setProducts] = useState<ProductInfo[]>([]);

  // Selection from URL params
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    searchParams.get('category') || '',
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    searchParams.get('group') || '',
  );

  // Loading states
  const [catState, setCatState] = useState<LoadState>('loading');
  const [catError, setCatError] = useState<string | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [prodsLoading, setProdsLoading] = useState(false);
  const [prodsError, setProdsError] = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // ── URL sync ──

  const syncUrl = useCallback(
    (categoryId: string, groupId: string) => {
      const next = new URLSearchParams();
      if (categoryId) next.set('category', categoryId);
      if (groupId) next.set('group', groupId);
      window.history.replaceState(null, '', `?${next.toString()}`);
    },
    [],
  );

  // ── Load categories on mount ──

  useEffect(() => {
    const loadCategories = async () => {
      setCatState('loading');
      setCatError(null);
      try {
        const resp = await api.listProductCategories(1, 100);
        const cats = (resp.categories as ProductCategoryInfo[]) || [];
        setCategories(
          [...cats].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
        );
        setCatState('ready');
      } catch (err) {
        setCatError(err instanceof Error ? err.message : t('error.generic'));
        setCatState('error');
      }
    };
    loadCategories();
  }, [t]);

  // ── Load groups when category changes ──

  useEffect(() => {
    if (!selectedCategoryId) {
      setGroups([]);
      setProducts([]);
      setSelectedGroupId('');
      return;
    }

    let cancelled = false;
    const loadGroups = async () => {
      setGroupsLoading(true);
      try {
        const resp = await api.listProductGroupsByCategory(selectedCategoryId);
        if (cancelled) return;
        const raw = (resp.groups as ProductGroupInfo[]) || [];
        setGroups(
          [...raw].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
        );
      } catch {
        if (!cancelled) setGroups([]);
      } finally {
        if (!cancelled) setGroupsLoading(false);
      }
    };
    loadGroups();
    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId]);

  // ── Load products when group changes ──

  useEffect(() => {
    if (!selectedGroupId) {
      setProducts([]);
      return;
    }

    let cancelled = false;
    const loadProducts = async () => {
      setProdsLoading(true);
      setProdsError(null);
      try {
        const resp = await api.listProducts({
          groupId: selectedGroupId,
          pageSize: 500,
          isActive: true,
        });
        if (cancelled) return;
        const raw = ((resp.products as ProductInfo[]) || []).filter(
          (p) => p.active !== false,
        );
        setProducts(raw);
      } catch (err) {
        if (!cancelled) {
          setProdsError(err instanceof Error ? err.message : t('error.generic'));
          setProducts([]);
        }
      } finally {
        if (!cancelled) setProdsLoading(false);
      }
    };
    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [selectedGroupId, t]);

  // ── Handlers ──

  const handleCategoryClick = (catId: string) => {
    if (catId === selectedCategoryId) return;
    setSelectedCategoryId(catId);
    setSelectedGroupId('');
    setProducts([]);
    setSearch('');
    syncUrl(catId, '');
  };

  const handleGroupClick = (groupId: string) => {
    if (groupId === selectedGroupId) return;
    setSelectedGroupId(groupId);
    setSearch('');
    syncUrl(selectedCategoryId, groupId);
  };

  // ── Computed ──

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)),
    );
  }, [products, search]);

  // ── Loading state (categories) ──

  if (catState === 'loading') {
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
                <CardContent className="p-6">
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

  // ── Error state (categories) ──

  if (catState === 'error') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Card className="max-w-md mx-6 bg-canvas-soft border-hairline">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-error-soft mx-auto mb-4">
              <RefreshCw className="h-6 w-6 text-error" />
            </div>
            <h3 className="text-ink font-semibold text-lg mb-2">
              {t('catalog.errorLoading')}
            </h3>
            <p className="text-body text-sm mb-6">{catError}</p>
            <Button
              variant="primary"
              size="md"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4" />
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Ready state ──

  return (
    <>
      <Helmet>
        <title>云服务器产品 — {brandName}</title>
        <meta name="description" content="浏览全部云服务器产品，按需选择配置和计费周期。" />
      </Helmet>
      <div className="min-h-screen bg-canvas animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      {/* Page header */}
      <div className="bg-canvas-soft border-b border-hairline">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-8">
          <span className="text-xs font-mono text-mute uppercase tracking-wider">
            {t('catalog.eyebrow')}
          </span>
          <h1 className="mt-2 text-2xl font-semibold text-ink tracking-tight">
            {t('catalog.title')}
          </h1>
          <p className="mt-1 text-sm text-body">{t('catalog.subtitle')}</p>

          {/* Search — only shown when products are loaded */}
          {selectedGroupId && products.length > 0 && (
            <div className="mt-5 max-w-md relative">
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
          )}
        </div>
      </div>

      {/* Main layout: sidebar + content */}
      <div className="flex flex-col md:flex-row">
        {/* ── Left sidebar: Categories ── */}
        <aside className="md:w-[220px] shrink-0 bg-canvas-soft md:bg-canvas md:border-r border-hairline">
          <div className="px-4 md:px-0">
            {/* Sidebar header (desktop only) */}
            <div className="hidden md:flex items-center gap-2 px-5 pt-5 pb-3">
              <Layers className="h-4 w-4 text-mute" />
              <span className="text-xs font-semibold text-mute uppercase tracking-wider">
                {t('catalog.categories')}
              </span>
            </div>

            {/* Category list */}
            <div className="flex md:flex-col gap-0.5 overflow-x-auto md:overflow-x-visible py-2 md:py-0 md:pb-4 scrollbar-none">
              {categories.map((cat) => {
                const isActive = cat.id === selectedCategoryId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat.id)}
                    className={cn(
                      'shrink-0 text-left transition-colors cursor-pointer',
                      // Mobile: chip style
                      'px-3 py-1.5 md:px-5 md:py-2.5 rounded-full md:rounded-none text-sm md:text-sm',
                      isActive
                        ? 'bg-primary/15 md:bg-cyan-soft text-primary md:text-ink md:border-l-[3px] md:border-primary md:pl-[17px]'
                        : 'text-body hover:text-ink hover:bg-canvas-soft/50 md:hover:bg-canvas-soft',
                    )}
                  >
                    <span
                      className={cn(
                        'block whitespace-nowrap',
                        isActive
                          ? 'font-semibold'
                          : 'font-normal',
                      )}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── Right content area ── */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 md:py-8">
          {/* No category selected */}
          {!selectedCategoryId && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-canvas-soft-2 border border-hairline mb-6">
                <Layers className="h-8 w-8 text-mute" />
              </div>
              <h3 className="text-ink font-semibold text-lg mb-2">
                {t('catalog.selectCategoryHint')}
              </h3>
              <p className="text-body text-sm max-w-sm">
                {t('catalog.selectCategoryHintDesc')}
              </p>
            </div>
          )}

          {/* Category selected */}
          {selectedCategoryId && (
            <>
              {/* ── Group cards ── */}
              {groupsLoading ? (
                <div className="flex gap-4 flex-wrap mb-10">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-[200px] h-[88px] rounded-md bg-canvas-soft animate-pulse"
                    />
                  ))}
                </div>
              ) : groups.length === 0 ? (
                <div className="mb-10">
                  <div className="flex items-center gap-2 p-6 rounded-md bg-canvas-soft border border-hairline">
                    <Package className="h-5 w-5 text-mute" />
                    <p className="text-body text-sm">{t('catalog.noGroups')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 flex-wrap mb-10">
                  {groups.map((group) => {
                    const isActive = group.id === selectedGroupId;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => handleGroupClick(group.id)}
                        className={cn(
                          'shrink-0 w-[180px] sm:w-[200px] text-left p-4 rounded-md border transition-all cursor-pointer',
                          isActive
                            ? 'border-primary bg-cyan-soft/30 shadow-[0_0_20px_rgba(0,209,167,0.08)]'
                            : 'border-hairline bg-canvas-soft hover:border-hairline-strong hover:bg-canvas-soft-2',
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Grid3X3
                            className={cn(
                              'h-4 w-4 shrink-0',
                              isActive ? 'text-primary' : 'text-mute',
                            )}
                          />
                          <span
                            className={cn(
                              'text-sm font-semibold truncate',
                              isActive ? 'text-primary' : 'text-ink',
                            )}
                          >
                            {group.name}
                          </span>
                        </div>
                        <p className="text-xs text-mute">
                          {t('catalog.productsCount', {
                            count: group.productCount ?? 0,
                          })}
                        </p>
                        {group.description && (
                          <p className="text-xs text-body mt-1 line-clamp-1">
                            {group.description}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Section divider ── */}
              {selectedGroupId && (
                <div className="flex items-center gap-3 mb-6">
                  <Separator className="flex-1" />
                  <span className="text-xs font-mono text-mute uppercase tracking-wider whitespace-nowrap">
                    {selectedGroup
                      ? `${selectedGroup.name} · ${t('catalog.productsCount', { count: selectedGroup.productCount ?? 0 })}`
                      : t('catalog.products')}
                  </span>
                  <Separator className="flex-1" />
                </div>
              )}

              {/* ── Products area ── */}
              {!selectedGroupId ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-canvas-soft-2 border border-hairline mb-5">
                    <Grid3X3 className="h-7 w-7 text-mute" />
                  </div>
                  <h3 className="text-ink font-semibold text-base mb-1.5">
                    {t('catalog.selectGroupHint')}
                  </h3>
                  <p className="text-body text-sm max-w-sm">
                    {t('catalog.selectGroupHintDesc')}
                  </p>
                </div>
              ) : prodsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="bg-canvas-soft animate-pulse">
                      <CardContent className="p-6">
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
              ) : prodsError ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-error-soft mx-auto mb-5">
                    <RefreshCw className="h-7 w-7 text-error" />
                  </div>
                  <h3 className="text-ink font-semibold text-base mb-1.5">
                    {t('catalog.errorLoading')}
                  </h3>
                  <p className="text-body text-sm mb-6 max-w-sm">{prodsError}</p>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleGroupClick(selectedGroupId)}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t('catalog.retryLoading')}
                  </Button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-canvas-soft-2 border border-hairline mb-5">
                    <Package className="h-7 w-7 text-mute" />
                  </div>
                  <h3 className="text-ink font-semibold text-base mb-1.5">
                    {search.trim() ? t('catalog.noSearchResults') : t('catalog.noProducts')}
                  </h3>
                  <p className="text-body text-sm max-w-sm">
                    {search.trim()
                      ? t('catalog.noSearchResultsHint')
                      : t('catalog.noProductsHint')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const price = renderPrice(product);
                    const suffix = renderBillingCycleSuffix(product, t);
                    const specs = product.specs || {};

                    return (
                      <Card
                        key={product.id}
                        className="bg-canvas-soft rounded-lg border border-hairline p-6 hover:shadow-[0_0_40px_rgba(0,209,167,0.06)] transition-shadow"
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
                                <span className="text-mute text-sm">
                                  {t('catalog.empty')}
                                </span>
                              )}
                            </div>
                            <a
                              href={`/catalog/${product.id}`}
                              className="no-underline"
                            >
                              <Button variant="primary" size="sm">
                                {t('catalog.buyNow')}
                              </Button>
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
    </>
  );
}
