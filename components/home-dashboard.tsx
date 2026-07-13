'use client';

import Link from 'next/link';
import {useLocale, useTranslations} from 'next-intl';

import {SiteNav} from '@/components/site-nav';

export function HomeDashboard() {
  const t = useTranslations('HomePage');
  const locale = useLocale();

  return (
    <main className="min-h-screen px-6 py-10 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <SiteNav current="home" />

        <section className="overflow-hidden rounded-[2rem] border border-orange-200/70 bg-white/85 p-8 shadow-[0_30px_80px_-45px_rgba(234,88,12,0.65)] backdrop-blur md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-orange-600">
                {t('eyebrow')}
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
                {t('title')}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                {t('description')}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                  href={`/${locale}/create-cup`}
                >
                  {t('ctaPrimary')}
                </Link>
                <Link
                  className="rounded-full border border-orange-300 px-5 py-3 text-sm font-semibold text-orange-700 transition hover:border-orange-400 hover:bg-orange-50"
                  href={`/${locale}/create-cup`}
                >
                  {t('ctaSecondary')}
                </Link>
              </div>
            </div>

            <div className="grid gap-4 rounded-[1.5rem] border border-orange-100 bg-orange-50/80 p-6">
              <Stat label={t('localeLabel')} value={locale.toUpperCase()} />
              <Stat label={t('stateLabel')} value={t('stateValue')} />
              <Stat label={t('themeLabel')} value={t('themeValue')} />
              <Stat label={t('printLabel')} value={t('printValue')} />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            description={t('cards.docker.description')}
            title={t('cards.docker.title')}
          />
          <FeatureCard
            description={t('cards.editor.description')}
            title={t('cards.editor.title')}
          />
          <FeatureCard
            description={t('cards.print.description')}
            title={t('cards.print.title')}
          />
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-orange-100 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(194,65,12,0.7)]">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    </article>
  );
}

function Stat({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-[1.25rem] border border-white/70 bg-white/80 px-4 py-5">
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-orange-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
