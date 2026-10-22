import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  text: string;
  kind: 'success' | 'error' | 'info';
  action?: { label: string; link: string };
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private seq = 0;

  show(text: string, kind: Toast['kind'] = 'info', action?: Toast['action']): void {
    const id = ++this.seq;
    this.toasts.update(t => [...t.slice(-2), { id, text, kind, action }]);
    setTimeout(() => this.dismiss(id), kind === 'error' ? 6000 : 3800);
  }

  dismiss(id: number): void {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }
}
