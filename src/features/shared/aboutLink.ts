import { Capacitor } from '@capacitor/core';
import type { BrandTarget } from '../../components';
import type { Locale } from '../../components/core/LanguageToggle';
import { useI18n } from '../../i18n';
import { PUBLIC_ORIGIN } from '../focus/shareSnapshot';

/**
 * The logo and wordmark lead to the about page (the landing site served at
 * /about/, #252), in the app's language. The Android app has no about page of
 * its own, so it opens the website.
 */
export function aboutTarget(locale: Locale, native: boolean): BrandTarget {
  const path = locale === 'de' ? '/about/de/' : '/about/';
  return {
    href: native ? `${PUBLIC_ORIGIN}${path}` : path,
    label: locale === 'de' ? 'Über THD Room Finder' : 'About THD Room Finder',
    external: native,
  };
}

export function useAboutTarget(): BrandTarget {
  const { locale } = useI18n();
  return aboutTarget(locale, Capacitor.isNativePlatform());
}
