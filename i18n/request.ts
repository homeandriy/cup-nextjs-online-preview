import {getRequestConfig} from "next-intl/server";
import {hasLocale} from "next-intl";

import {routing} from "@/i18n/routing";

const messageLoaders = {
  uk: () => import("@/messages/uk.json"),
  en: () => import("@/messages/en.json"),
  pl: () => import("@/messages/pl.json")
} as const;

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await messageLoaders[locale]()).default
  };
});
