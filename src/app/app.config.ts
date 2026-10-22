import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { ActivatedRouteSnapshot, provideRouter, withComponentInputBinding, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { CategoryService } from './core/data/category.service';

function leafPath(s: ActivatedRouteSnapshot): string {
  let r = s;
  while (r.firstChild) r = r.firstChild;
  return r.pathFromRoot.map(x => x.url.map(u => u.path).join('/')).join('/');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      // Animate page changes, but not filter/query updates on the same page.
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition, from, to }) => {
          if (leafPath(from) === leafPath(to)) transition.skipTransition();
        },
      })
    ),
    provideHttpClient(withFetch()),
    // Data fetched while prerendering ships inside the page, so hydration doesn't
    // refetch it. The full directory is excluded: it's big and only search needs it.
    provideClientHydration(withHttpTransferCacheOptions({ filter: req => !req.url.endsWith('/directory.json') && !req.url.endsWith('/cities.json') })),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (cats: CategoryService) => () => cats.load(),
      deps: [CategoryService],
    },
  ],
};
