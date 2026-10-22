import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SITE } from '../../../environments/site.generated';

export interface PageMeta {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'business.business' | 'profile';
  noindex?: boolean;
  jsonLd?: object | object[];
}

const DEFAULT_IMAGE = '/og-image.png';

/** Title, description, canonical, Open Graph, Twitter and JSON-LD for each page. */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  readonly siteUrl = SITE.url;

  set(p: PageMeta): void {
    const fullTitle = p.title.includes('Apneyy') ? p.title : `${p.title} · Apneyy`;
    const url = this.siteUrl + (p.path === '/' ? '/' : p.path.replace(/\/+$/, ''));
    const image = p.image ? (p.image.startsWith('http') ? p.image : this.siteUrl + p.image) : this.siteUrl + DEFAULT_IMAGE;
    const description = p.description.length > 160 ? p.description.slice(0, 157).replace(/\s+\S*$/, '') + '…' : p.description;

    this.title.setTitle(fullTitle);
    this.tag('name', 'description', description);
    this.tag('name', 'robots', p.noindex || SITE.sample ? 'noindex, follow' : 'index, follow, max-image-preview:large');
    this.tag('property', 'og:title', fullTitle);
    this.tag('property', 'og:description', description);
    this.tag('property', 'og:url', url);
    this.tag('property', 'og:type', p.type ?? 'website');
    this.tag('property', 'og:image', image);
    this.tag('property', 'og:site_name', 'Apneyy');
    this.tag('property', 'og:locale', 'en_US');
    this.tag('name', 'twitter:card', 'summary_large_image');
    this.tag('name', 'twitter:title', fullTitle);
    this.tag('name', 'twitter:description', description);
    this.tag('name', 'twitter:image', image);
    this.canonical(url);
    this.jsonLd(p.jsonLd);
  }

  absolute(path: string): string {
    return this.siteUrl + path;
  }

  breadcrumbs(items: { name: string; path: string }[]): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: this.siteUrl + it.path })),
    };
  }

  private tag(attr: 'name' | 'property', key: string, content: string): void {
    this.meta.updateTag({ [attr]: key, content } as never, `${attr}="${key}"`);
  }

  private canonical(url: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private jsonLd(data: object | object[] | undefined): void {
    this.doc.head.querySelectorAll('script[data-seo="ld"]').forEach(s => s.remove());
    if (!data) return;
    for (const d of Array.isArray(data) ? data : [data]) {
      const s = this.doc.createElement('script');
      s.setAttribute('type', 'application/ld+json');
      s.setAttribute('data-seo', 'ld');
      s.textContent = JSON.stringify(d).replace(/</g, '\\u003c');
      this.doc.head.appendChild(s);
    }
  }
}
