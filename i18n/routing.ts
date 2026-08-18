import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['th', 'en'],
  defaultLocale: 'th',
  localePrefix: 'as-needed', // Hides locale prefix on default locale ('th')
  // The app writes its own locale cookie only after Functional consent.
  localeCookie: false
});

export const {Link, redirect, usePathname, useRouter, getPathname} = createNavigation(routing);
