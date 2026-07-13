'use client';

import Link from 'next/link';
import {useLocale, useTranslations} from 'next-intl';


export function HomeDashboard() {
  const t = useTranslations('HomePage');
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-8 text-slate-900">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.32)] md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[var(--color-orange)]">
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
                  className="rounded-full bg-[var(--color-orange)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_-10px_rgba(15,23,42,0.5)] hover:bg-[var(--color-blue)]"
                  href={`/${locale}/create-cup`}
                >
                  {t('ctaPrimary')}
                </Link>
                <Link
                  className="rounded-full border-2 border-[var(--color-blue)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-blue)] hover:bg-[var(--color-blue)] hover:text-white"
                  href={`/${locale}/create-cup`}
                >
                  {t('ctaSecondary')}
                </Link>
              </div>
            </div>

            <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[inset_0_0_0_1px_rgb(15_23_42_/_0.03)]">
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
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_38px_-28px_rgba(15,23,42,0.32)]">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    </article>
  );
}

function Stat({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-5 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.3)]">
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--color-blue)]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
