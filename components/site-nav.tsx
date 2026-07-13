'use client';

import Link from 'next/link';
import {useLocale, useTranslations} from 'next-intl';
import {usePathname} from 'next/navigation';

import {routing} from '@/i18n/routing';

function switchLocale(pathname: string, locale: string) {
  const normalizedPath = pathname || '/';
  return normalizedPath.replace(/^\/(uk|en|pl)(?=\/|$)/, `/${locale}`);
}

type SiteNavProps = {
  current: 'home' | 'create-cup';
};

export function SiteNav({current}: SiteNavProps) {
  const t = useTranslations('Navigation');
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <header className="rounded-[1.75rem] border border-orange-200/70 bg-white/85 px-5 py-4 shadow-[0_24px_60px_-40px_rgba(234,88,12,0.65)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
            data-testid="brand-home-link"
            href={`/${locale}`}
          >
            CUP
          </Link>

          <nav className="flex flex-wrap gap-2">
            <NavLink active={current === 'home'} href={`/${locale}`} testId="site-nav-home">
              {t('home')}
            </NavLink>
            <NavLink active={current === 'create-cup'} href={`/${locale}/create-cup`} testId="site-nav-create-cup">
              {t('createCup')}
            </NavLink>
          </nav>
        </div>

        <div className="flex flex-wrap gap-2">
          {routing.locales.map((item) => {
            const isActive = item === locale;

            return (
              <Link
                key={item}
                className={[
                  'rounded-full px-3 py-2 text-sm font-semibold transition',
                  isActive
                    ? 'border border-orange-300 bg-orange-100 text-orange-700'
                    : 'border border-orange-200 text-slate-700 hover:border-orange-300 hover:bg-orange-50'
                ].join(' ')}
                data-testid={`locale-switch-${item}`}
                href={switchLocale(pathname, item)}
              >
                {t(`localeNames.${item}`)}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
  testId
}: {
  href: string;
  active: boolean;
  children: string;
  testId: string;
}) {
  return (
    <Link
      className={[
        'rounded-full px-4 py-2 text-sm font-semibold transition',
        active
          ? 'bg-orange-100 text-orange-700'
          : 'text-slate-600 hover:bg-orange-50 hover:text-orange-700'
      ].join(' ')}
      data-testid={testId}
      href={href}
    >
      {children}
    </Link>
  );
}
