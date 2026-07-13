import type {CSSProperties, ReactNode} from 'react';
import {hasLocale, NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';

import {AppStoreProvider} from '@/components/providers/app-store-provider';
import {SiteFooter} from '@/components/site-footer';
import {SiteNav} from '@/components/site-nav';
import {routing} from '@/i18n/routing';
import theme from '@/theme.json';

import '../globals.css';

export function generateStaticParams() {
    return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
                                               children,
                                               params
                                           }: {
    children: ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const {locale} = await params;

    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    setRequestLocale(locale);

    const messages = await getMessages();
    const themeVariables = {
        '--color-orange': theme.colors.orange,
        '--color-blue': theme.colors.blue,
        '--color-green': theme.colors.green,
        '--color-background': theme.colors.background,
        '--color-surface': theme.colors.surface,
        '--color-foreground': theme.colors.foreground,
        '--color-border': theme.colors.border,
        '--color-shadow': theme.colors.shadow
    } as CSSProperties;

    return (
        <html lang={locale} style={themeVariables}>
        <body>
        <NextIntlClientProvider messages={messages}>
            <AppStoreProvider>
                <div className="flex min-h-screen flex-col">
                    <header className="px-4 pt-6 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-7xl">
                            <SiteNav/>
                        </div>
                    </header>
                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-7xl">{children}</div>
                    </main>
                    <SiteFooter/>
                </div>
            </AppStoreProvider>
        </NextIntlClientProvider>
        </body>
        </html>
    );
}
