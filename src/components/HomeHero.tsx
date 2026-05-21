import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Server, TrendingUp, Users, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomeHero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-canvas">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% -10%, rgba(6,182,212,0.15), transparent 55%), radial-gradient(ellipse 30% 60% at 85% 90%, rgba(8,145,178,0.08), transparent 45%)',
      }} />

      <div className="relative mx-auto max-w-[1400px] px-6 pt-28 pb-16 flex flex-col items-center text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-hairline bg-canvas-soft/60 backdrop-blur-sm text-xs font-mono text-mute uppercase tracking-wider mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          {t('home.eyebrow')}
        </div>

        {/* Headline */}
        <h1 className="max-w-4xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-ink tracking-tight leading-tight">
          {t('home.heroTitle')}{' '}
          <span className="bg-gradient-to-r from-primary via-highlight-cyan to-highlight-teal bg-clip-text text-transparent">
            {t('home.heroHighlight')}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-body leading-relaxed">
          {t('home.heroSubtitle')}
        </p>

        {/* CTAs */}
        <div className="mt-8 flex items-center gap-3 flex-wrap justify-center">
          <Link to="/register" className="no-underline">
            <Button variant="primary" size="pill" className="text-base px-8 h-13">
              {t('home.heroCTA')}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/catalog" className="no-underline">
            <Button variant="outline" size="pill" className="text-base px-8 h-13">
              {t('home.heroSecondary')}
            </Button>
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-3xl">
          {[
            { icon: Server, value: '12,000+', labelKey: 'home.statsServers' },
            { icon: TrendingUp, value: '99.99%', labelKey: 'home.statsUptime' },
            { icon: Users, value: '3,500+', labelKey: 'home.statsCustomers' },
            { icon: Globe, value: '15+', labelKey: 'home.statsRegions' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.labelKey} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-canvas-soft/40 border border-hairline/50 backdrop-blur-sm">
                <Icon className="h-4 w-4 text-mute" />
                <span className="text-xl font-semibold text-ink font-mono tracking-tight">{stat.value}</span>
                <span className="text-xs text-mute">{t(stat.labelKey)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
