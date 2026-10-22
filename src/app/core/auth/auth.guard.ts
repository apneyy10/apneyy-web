import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Pages that need a signed-in shopper. Never prerendered with private data. */
export const authGuard: CanActivateFn = async (_route, state) => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.start();
  return auth.signedIn() ? true : router.createUrlTree(['/login'], { queryParams: { next: state.url } });
};
