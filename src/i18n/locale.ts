import type { Locale } from './translations';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'fr', 'es'];

export const LOCALE_LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
};

let currentLocale: Locale = 'en';

/** Reads the `lang` URL parameter (like the `theme` parameter) and applies it. */
export function initLocale(): Locale {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('lang');
  if (isSupportedLocale(requested)) {
    currentLocale = requested;
  }
  document.documentElement.lang = currentLocale;
  return currentLocale;
}

export function getLocale(): Locale {
  return currentLocale;
}

/** Sets the active locale directly, without touching `document`. Used by the `<conversia-app>` web component. */
export function setLocale(locale: Locale): void {
  currentLocale = isSupportedLocale(locale) ? locale : 'en';
}

export function isSupportedLocale(value: string | null): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}
