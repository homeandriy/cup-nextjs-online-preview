import type {ReactNode} from 'react';
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';

import {AppStoreProvider} from '@/components/providers/app-store-provider';
import {routing} from '@/i18n/routing';

import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <script data-cy-bootstrap="true" suppressHydrationWarning />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AppStoreProvider>{children}</AppStoreProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
