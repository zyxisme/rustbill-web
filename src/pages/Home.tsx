import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Server, Shield, Zap, ArrowRight, Check, Globe, Cpu,
  HardDrive, Cloud, Database, ChevronDown, Star, TrendingUp,
  Clock, Headphones, Layers, Gauge, MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LazyTerminal } from '@/components/LazyTerminal';

/* ─── Data ─── */

const features = [
  { icon: Cpu, titleKey: 'home.feature1Title', descKey: 'home.feature1Desc' },
  { icon: Globe, titleKey: 'home.feature2Title', descKey: 'home.feature2Desc' },
  { icon: Shield, titleKey: 'home.feature3Title', descKey: 'home.feature3Desc' },
  { icon: Zap, titleKey: 'home.feature4Title', descKey: 'home.feature4Desc' },
  { icon: Clock, titleKey: 'home.feature5Title', descKey: 'home.feature5Desc' },
  { icon: Headphones, titleKey: 'home.feature6Title', descKey: 'home.feature6Desc' },
];

const regions = [
  { code: 'us-west', nameKey: 'home.regionUSWest', lat: 37, flag: '🇺🇸', zones: 3, latency: '< 10ms' },
  { code: 'us-east', nameKey: 'home.regionUSEast', lat: 40, flag: '🇺🇸', zones: 4, latency: '< 15ms' },
  { code: 'eu-west', nameKey: 'home.regionEUWest', lat: 51, flag: '🇪🇺', zones: 3, latency: '< 12ms' },
  { code: 'eu-cent', nameKey: 'home.regionEUCentral', lat: 50, flag: '🇪🇺', zones: 2, latency: '< 8ms' },
  { code: 'ap-se', nameKey: 'home.regionAPSE', lat: 1, flag: '🇸🇬', zones: 3, latency: '< 5ms' },
  { code: 'ap-ne', nameKey: 'home.regionAPNE', lat: 35, flag: '🇯🇵', zones: 2, latency: '< 8ms' },
];

const productCategories = [
  { icon: Server, titleKey: 'home.prodVPS', descKey: 'home.prodVPSDesc', color: 'text-primary' },
  { icon: HardDrive, titleKey: 'home.prodDedicated', descKey: 'home.prodDedicatedDesc', color: 'text-warning' },
  { icon: Layers, titleKey: 'home.prodK8s', descKey: 'home.prodK8sDesc', color: 'text-violet' },
  { icon: Database, titleKey: 'home.prodStorage', descKey: 'home.prodStorageDesc', color: 'text-success' },
  { icon: Gauge, titleKey: 'home.prodCDN', descKey: 'home.prodCDNDesc', color: 'text-highlight-teal' },
  { icon: Cloud, titleKey: 'home.prodDB', descKey: 'home.prodDBDesc', color: 'text-link' },
];

const testimonials = [
  { quoteKey: 'home.testimonial1Quote', authorKey: 'home.testimonial1Author', roleKey: 'home.testimonial1Role', avatar: 'Z' },
  { quoteKey: 'home.testimonial2Quote', authorKey: 'home.testimonial2Author', roleKey: 'home.testimonial2Role', avatar: 'S' },
  { quoteKey: 'home.testimonial3Quote', authorKey: 'home.testimonial3Author', roleKey: 'home.testimonial3Role', avatar: 'A' },
];

const faqs = [
  { qKey: 'home.faq1Q', aKey: 'home.faq1A' },
  { qKey: 'home.faq2Q', aKey: 'home.faq2A' },
  { qKey: 'home.faq3Q', aKey: 'home.faq3A' },
  { qKey: 'home.faq4Q', aKey: 'home.faq4A' },
  { qKey: 'home.faq5Q', aKey: 'home.faq5A' },
  { qKey: 'home.faq6Q', aKey: 'home.faq6A' },
];

/* ─── Sub-components ─── */

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      {eyebrow && (
        <span className="inline-block text-xs font-mono text-mute uppercase tracking-wider mb-3">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl font-semibold text-ink tracking-tight">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-body text-base leading-relaxed">{subtitle}</p>}
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-hairline rounded-lg bg-canvas-soft overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-ink bg-transparent border-0 cursor-pointer hover:bg-canvas-soft-2/50 transition-colors"
      >
        <span>{question}</span>
        <ChevronDown className={cn('h-4 w-4 text-mute shrink-0 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-body leading-relaxed border-t border-hairline pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col animate-in fade-in-0 duration-300">
      {/* ═══════════════════════════════════════════════════════
          TRUSTED BY
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-canvas-soft border-t border-hairline">
        <div className="mx-auto max-w-[1400px] px-6 py-12 text-center">
          <span className="text-xs font-mono text-mute uppercase tracking-wider">{t('home.trustedBy')}</span>
          <div className="mt-5 flex items-center justify-center gap-8 md:gap-12 flex-wrap opacity-25">
            {['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Stark Industries', 'Wayne Enterprises'].map((name) => (
              <span key={name} className="text-base md:text-lg font-semibold text-ink tracking-wider">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURES (6-up)
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-canvas border-t border-hairline">
        <div className="mx-auto max-w-[1400px] px-6 py-24">
          <SectionHeader
            eyebrow="Features"
            title={t('home.featuresTitle')}
            subtitle={t('home.featuresSubtitle')}
          />
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.titleKey} className="group bg-canvas-soft rounded-lg border border-hairline p-6 hover:shadow-[0_0_30px_rgba(6,182,212,0.06)] hover:border-hairline-strong transition-all duration-200">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-soft border border-primary/20 group-hover:bg-primary group-hover:border-primary transition-colors duration-200">
                    <Icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors duration-200" />
                  </div>
                  <h3 className="mt-4 text-ink font-semibold text-base">{t(f.titleKey)}</h3>
                  <p className="mt-1.5 text-sm text-body leading-relaxed">{t(f.descKey)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          GLOBAL INFRASTRUCTURE
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-canvas-soft border-t border-hairline">
        <div className="mx-auto max-w-[1400px] px-6 py-24">
          <SectionHeader
            eyebrow="Infrastructure"
            title={t('home.infraTitle')}
            subtitle={t('home.infraSubtitle')}
          />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {regions.map((r) => (
              <div key={r.code} className="group bg-canvas-soft-2 rounded-lg border border-hairline p-6 hover:shadow-[0_0_20px_rgba(6,182,212,0.04)] hover:border-primary/30 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{r.flag}</span>
                    <div>
                      <h4 className="text-ink font-medium text-sm">{t(r.nameKey)}</h4>
                      <span className="text-xs text-mute">{r.zones} Availability Zones</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-success">{r.latency}</span>
                    <br />
                    <span className="text-xs text-mute">{t('home.regionLatency')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-canvas border-t border-hairline">
        <div className="mx-auto max-w-[1400px] px-6 py-24">
          <SectionHeader
            eyebrow="How It Works"
            title={t('home.howItWorksTitle')}
            subtitle={t('home.howItWorksSubtitle')}
          />
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Server, titleKey: 'home.step1Title', descKey: 'home.step1Desc' },
              { step: '02', icon: Shield, titleKey: 'home.step2Title', descKey: 'home.step2Desc' },
              { step: '03', icon: Zap, titleKey: 'home.step3Title', descKey: 'home.step3Desc' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative flex flex-col items-center text-center">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-canvas-soft border-2 border-primary/30">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="mt-4 text-xs font-mono text-primary font-semibold tracking-widest">{s.step}</span>
                  <h3 className="mt-2 text-ink font-semibold text-base">{t(s.titleKey)}</h3>
                  <p className="mt-1.5 text-sm text-body leading-relaxed max-w-xs">{t(s.descKey)}</p>
                  {/* Connector line between steps */}
                  {s.step !== '03' && (
                    <div className="hidden md:block absolute top-7 left-[calc(50%+2rem)] w-[calc(100%-2rem)]">
                      <div className="border-t border-dashed border-hairline w-full" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PERFORMANCE
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-canvas-soft border-t border-hairline">
        <div className="mx-auto max-w-[1400px] px-6 py-24">
          <SectionHeader
            eyebrow="Performance"
            title={t('home.perfTitle')}
            subtitle={t('home.perfSubtitle')}
          />
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: t('home.perfUptime'), label: t('home.perfUptimeLabel'), icon: TrendingUp },
              { value: t('home.perfLatency'), label: t('home.perfLatencyLabel'), icon: Gauge },
              { value: t('home.perfDeploy'), label: t('home.perfDeployLabel'), icon: Zap },
              { value: t('home.perfSupport'), label: t('home.perfSupportLabel'), icon: Headphones },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="bg-canvas rounded-lg border border-hairline p-6 text-center">
                  <Icon className="h-5 w-5 text-primary mx-auto mb-3" />
                  <div className="text-2xl md:text-3xl font-semibold text-ink font-mono tracking-tight">{m.value}</div>
                  <div className="mt-1 text-xs text-mute">{m.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PRODUCT CATEGORIES
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-canvas border-t border-hairline">
        <div className="mx-auto max-w-[1400px] px-6 py-24">
          <SectionHeader
            eyebrow="Products"
            title={t('home.productsTitle')}
            subtitle={t('home.productsSubtitle')}
          />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {productCategories.map((p) => {
              const Icon = p.icon;
              return (
                <Link to="/catalog" key={p.titleKey} className="no-underline group">
                  <div className="bg-canvas-soft rounded-lg border border-hairline p-6 hover:shadow-[0_0_30px_rgba(6,182,212,0.08)] hover:border-primary/30 transition-all duration-200 flex items-start gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-canvas-soft-2 border border-hairline shrink-0 group-hover:bg-cyan-soft group-hover:border-primary/30 transition-colors">
                      <Icon className={cn('h-6 w-6', p.color)} />
                    </div>
                    <div>
                      <h4 className="text-ink font-medium text-base">{t(p.titleKey)}</h4>
                      <p className="mt-1 text-sm text-body">{t(p.descKey)}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TERMINAL / SHOWCASE
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-canvas-soft border-t border-hairline">
        <div className="mx-auto max-w-[1400px] px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold text-ink tracking-tight">
                {t('home.showcaseTitle')}
              </h2>
              <p className="mt-4 text-body text-base leading-relaxed max-w-md">
                {t('home.showcaseSubtitle')}
              </p>
              <div className="mt-6 flex items-center gap-4">
                <Link to="/register" className="no-underline">
                  <Button variant="primary" size="pill">{t('home.heroCTA')}</Button>
                </Link>
              </div>
            </div>

            <LazyTerminal />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PRICING
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-canvas border-t border-hairline">
        <div className="mx-auto max-w-[1400px] px-6 py-24">
          <SectionHeader
            eyebrow="Pricing"
            title={t('home.pricingTitle')}
            subtitle={t('home.pricingSubtitle')}
          />
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                nameKey: 'home.starter', descKey: 'home.starterDesc', price: t('home.starterPrice'),
                features: ['home.pricingFeature1', 'home.pricingFeature2', 'home.pricingFeature3', 'home.pricingFeature4'],
                cta: 'home.getStarted', featured: false, href: '/register',
              },
              {
                nameKey: 'home.pro', descKey: 'home.proDesc', price: t('home.proPrice'),
                features: ['home.proFeature1', 'home.proFeature2', 'home.proFeature3', 'home.proFeature4', 'home.proFeature5'],
                cta: 'home.getStarted', featured: true, href: '/register',
              },
              {
                nameKey: 'home.enterprise', descKey: 'home.enterpriseDesc', price: t('home.enterprisePrice'),
                features: ['home.entFeature1', 'home.entFeature2', 'home.entFeature3', 'home.entFeature4', 'home.entFeature5', 'home.entFeature6'],
                cta: 'home.contactSales', featured: false, href: '/dashboard/tickets',
              },
            ].map((tier) => (
              <div
                key={tier.nameKey}
                className={cn(
                  'rounded-xl border p-8 flex flex-col relative',
                  tier.featured
                    ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_50px_rgba(6,182,212,0.2)] md:scale-[1.03] z-10'
                    : 'bg-canvas-soft-2 border-hairline',
                )}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary-foreground text-primary text-xs font-semibold rounded-full border border-primary">
                    {t('home.pro')}
                  </div>
                )}
                <h3 className={cn('text-lg font-semibold', tier.featured ? 'text-primary-foreground' : 'text-ink')}>
                  {t(tier.nameKey)}
                </h3>
                <p className={cn('mt-1 text-sm', tier.featured ? 'text-primary-foreground/60' : 'text-body')}>
                  {t(tier.descKey)}
                </p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className={cn('text-4xl font-semibold tracking-tight font-mono', tier.featured ? 'text-primary-foreground' : 'text-ink')}>
                    {tier.price}
                  </span>
                  {tier.nameKey !== 'home.enterprise' && (
                    <span className={cn('text-sm', tier.featured ? 'text-primary-foreground/50' : 'text-mute')}>
                      {t('home.perMonth')}
                    </span>
                  )}
                </div>
                <ul className="mt-7 space-y-3 flex-1">
                  {tier.features.map((fk) => (
                    <li key={fk} className="flex items-start gap-2.5 text-sm">
                      <Check className={cn('h-4 w-4 mt-0.5 shrink-0', tier.featured ? 'text-primary-foreground' : 'text-success')} />
                      <span className={cn(tier.featured ? 'text-primary-foreground/75' : 'text-body')}>{t(fk)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link to={tier.href} className="no-underline">
                    <Button
                      variant={tier.featured ? 'secondary' : 'outline'}
                      size="pill"
                      className="w-full"
                    >
                      {t(tier.cta)}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TESTIMONIALS
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-canvas-soft border-t border-hairline">
        <div className="mx-auto max-w-[1400px] px-6 py-24">
          <SectionHeader
            eyebrow="Testimonials"
            title={t('home.testimonialTitle')}
            subtitle={t('home.testimonialSubtitle')}
          />
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((tm) => (
              <Card key={tm.authorKey} className="bg-canvas-soft-2 border-hairline flex flex-col">
                <CardContent className="pt-6 flex flex-col flex-1">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 text-warning fill-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-body leading-relaxed flex-1 italic">
                    &ldquo;{t(tm.quoteKey)}&rdquo;
                  </p>
                  <div className="mt-5 flex items-center gap-3 pt-4 border-t border-hairline">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                      {tm.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink">{t(tm.authorKey)}</div>
                      <div className="text-xs text-mute">{t(tm.roleKey)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FAQ
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-canvas border-t border-hairline">
        <div className="mx-auto max-w-[1400px] px-6 py-24">
          <SectionHeader
            eyebrow="FAQ"
            title={t('home.faqTitle')}
            subtitle={t('home.faqSubtitle')}
          />
          <div className="mt-14 max-w-3xl mx-auto space-y-3">
            {faqs.map((faq) => (
              <FaqItem key={faq.qKey} question={t(faq.qKey)} answer={t(faq.aKey)} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          BOTTOM CTA
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-canvas-soft border-t border-hairline">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(6,182,212,0.1), transparent 60%)',
          }} />
          <div className="relative mx-auto max-w-[1400px] px-6 py-24 text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-ink tracking-tight">
              {t('home.bottomCTATitle')}
            </h2>
            <p className="mt-4 text-lg text-body max-w-xl mx-auto">
              {t('home.bottomCTASubtitle')}
            </p>
            <div className="mt-8 flex items-center gap-3 justify-center flex-wrap">
              <Link to="/register" className="no-underline">
                <Button variant="primary" size="pill" className="text-base px-10 h-13">
                  {t('home.bottomCTAButton')}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/dashboard/tickets" className="no-underline">
                <Button variant="outline" size="pill" className="text-base px-10 h-13">
                  {t('home.bottomCTASecondary')}
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-xs text-mute">
              {t('home.faq6A')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
