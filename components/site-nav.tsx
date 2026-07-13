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
  current?: 'home' | 'create-cup';
};

export function SiteNav({current}: SiteNavProps) {
  const t = useTranslations('Navigation');
  const locale = useLocale();
  const pathname = usePathname();
  const activePage = current ?? (pathname.includes('/create-cup') ? 'create-cup' : 'home');

  return (
    <header className="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-4 shadow-[0_20px_48px_-30px_rgba(15,23,42,0.3)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="rounded-full bg-[var(--color-orange)] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.55)]"
            data-testid="brand-home-link"
            href={`/${locale}`}
          >
            CUP
          </Link>

          <nav className="flex flex-wrap gap-2">
            <NavLink active={activePage === 'home'} href={`/${locale}`} testId="site-nav-home">
              {t('home')}
            </NavLink>
            <NavLink active={activePage === 'create-cup'} href={`/${locale}/create-cup`} testId="site-nav-create-cup">
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
                  'rounded-full px-3 py-2 text-sm font-semibold',
                  isActive
                    ? 'border-2 border-[var(--color-blue)] bg-[var(--color-blue)] text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-[var(--color-blue)] hover:text-[var(--color-blue)]'
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
        'rounded-full px-4 py-2 text-sm font-semibold',
        active
          ? 'bg-[var(--color-blue)] text-white'
          : 'text-slate-600 hover:bg-[var(--color-orange)] hover:text-white'
      ].join(' ')}
      data-testid={testId}
      href={href}
    >
      {children}
    </Link>
  );
}
