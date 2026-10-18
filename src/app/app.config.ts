import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { provideIcons } from '@ng-icons/core';
import { firstValueFrom } from 'rxjs';
import {
  lucideCalendar,
  lucideChevronDown,
  lucideChevronsDownUp,
  lucideChevronsUpDown,
  lucideCircleHelp,
  lucideClock,
  lucideCode,
  lucideCookie,
  lucideCopy,
  lucideCornerDownRight,
  lucideDatabase,
  lucideDatabaseZap,
  lucideDownload,
  lucideEraser,
  lucideFolder,
  lucideGlobe,
  lucideInfo,
  lucideLock,
  lucideLockOpen,
  lucideLogOut,
  lucideMonitor,
  lucideMoon,
  lucidePencil,
  lucidePlus,
  lucideSearch,
  lucideSettings,
  lucideShieldAlert,
  lucideShieldCheck,
  lucideShieldX,
  lucideSun,
  lucideTarget,
  lucideTrash2,
  lucideTriangleAlert,
  lucideUpload,
  lucideX,
  lucideZap,
} from '@ng-icons/lucide';

import { routes } from './app.routes';
import { TranslocoHttpLoader } from './transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: ['es', 'en'],
        defaultLang: 'es',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    // Loads the default dictionary before the first render, so the popup never shows raw keys.
    // Phase 2 reads the stored language from the PreferencesStore here instead.
    provideAppInitializer(() => firstValueFrom(inject(TranslocoService).load('es'))),
    // Every icon of the app, registered once. Components only import NgIcon.
    provideIcons({
      lucideCalendar,
      lucideChevronDown,
      lucideChevronsDownUp,
      lucideChevronsUpDown,
      lucideCircleHelp,
      lucideClock,
      lucideCode,
      lucideCookie,
      lucideCopy,
      lucideCornerDownRight,
      lucideDatabase,
      lucideDatabaseZap,
      lucideDownload,
      lucideEraser,
      lucideFolder,
      lucideGlobe,
      lucideInfo,
      lucideLock,
      lucideLockOpen,
      lucideLogOut,
      lucideMonitor,
      lucideMoon,
      lucidePencil,
      lucidePlus,
      lucideSearch,
      lucideSettings,
      lucideShieldAlert,
      lucideShieldCheck,
      lucideShieldX,
      lucideSun,
      lucideTarget,
      lucideTrash2,
      lucideTriangleAlert,
      lucideUpload,
      lucideX,
      lucideZap,
    }),
  ]
};
