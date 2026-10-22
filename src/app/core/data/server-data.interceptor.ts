import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { of, throwError } from 'rxjs';

/** Folders that may hold the generated /data files, in order. */
const ROOTS = [join(process.cwd(), 'public'), join(process.cwd(), 'dist', 'apneyy-web', 'browser')];

/**
 * Server only. While prerendering there is no web server to fetch /data/*.json
 * from, so read the generated files from disk instead.
 */
export const serverDataInterceptor: HttpInterceptorFn = (req, next) => {
  const path = req.url.startsWith('/data/') ? req.url : null;
  if (!path || req.method !== 'GET') return next(req);
  const rel = decodeURIComponent(path.split('?')[0]);
  if (rel.includes('..')) return throwError(() => new Error('bad path'));
  for (const root of ROOTS) {
    const file = join(root, rel);
    if (existsSync(file)) {
      return of(new HttpResponse({ status: 200, url: req.url, body: JSON.parse(readFileSync(file, 'utf8')) }));
    }
  }
  return throwError(() => new HttpErrorResponse({ status: 404, url: req.url }));
};
