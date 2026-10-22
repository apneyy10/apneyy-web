import { Directive, ElementRef, PLATFORM_ID, afterNextRender, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

let observer: IntersectionObserver | null = null;

function sharedObserver(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('is-revealed');
            observer!.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
  }
  return observer;
}

/**
 * Fades and lifts an element in the first time it scrolls into view.
 * Content is fully visible without JavaScript and for reduced-motion users (see styles.css).
 */
@Directive({ selector: '[appReveal]', standalone: true, host: { class: 'reveal' } })
export class RevealDirective {
  /** Stagger, in steps of 70ms. */
  readonly appReveal = input<number | ''>('');
  private readonly el = inject(ElementRef<HTMLElement>);

  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    afterNextRender(() => {
      if (!browser || !('IntersectionObserver' in window)) return;
      const node = this.el.nativeElement as HTMLElement;
      // Only animate what's below the fold; things already on screen stay put.
      if (node.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      const delay = Number(this.appReveal()) || 0;
      if (delay) node.style.transitionDelay = `${Math.min(delay, 8) * 70}ms`;
      node.classList.add('reveal-armed');
      sharedObserver().observe(node);
    });
  }
}
