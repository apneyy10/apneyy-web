import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CATEGORIES, CATEGORY_GROUPS, CategoryGroupId, CategoryOption } from '../constants/listing-options.constant';
import { CatalogItem } from '../models/directory.model';

export interface CategoryGroup {
  id: CategoryGroupId;
  label: string;
  icon: string;
  categories: CategoryOption[];
}

const GROUP_IDS = CATEGORY_GROUPS.map(g => g.id) as string[];

/**
 * Categories = the built-in list, with the admin-managed catalog (categories/catalog,
 * snapshotted at build time into /data/catalog.json) merged over it.
 */
@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly catalog = signal<CatalogItem[] | null>(null);

  readonly all = computed<CategoryOption[]>(() => {
    const byId = new Map<string, CategoryOption>(CATEGORIES.map(c => [c.id, { ...c }]));
    for (const item of this.catalog() ?? []) {
      if (!item?.id) continue;
      if (item.active === false) {
        byId.delete(item.id);
        continue;
      }
      const base = byId.get(item.id);
      byId.set(item.id, {
        id: item.id,
        label: item.label || base?.label || item.id,
        icon: item.icon || base?.icon || '🏪',
        group: (GROUP_IDS.includes(item.group) ? item.group : base?.group || 'services') as CategoryGroupId,
        suggestedTags: item.suggestedTags ?? base?.suggestedTags ?? [],
        requiresLicense: item.requiresLicense ?? base?.requiresLicense,
      });
    }
    return [...byId.values()];
  });

  readonly groups = computed<CategoryGroup[]>(() =>
    CATEGORY_GROUPS.map(g => ({ ...g, categories: this.all().filter(c => c.group === g.id) }))
  );

  load(): Promise<void> {
    return firstValueFrom(this.http.get<{ items: CatalogItem[] | null }>('/data/catalog.json'))
      .then(r => this.catalog.set(Array.isArray(r?.items) ? r.items : null))
      .catch(() => undefined);
  }

  get(id: string): CategoryOption | undefined {
    return this.all().find(c => c.id === id) ?? CATEGORIES.find(c => c.id === id);
  }

  label(id: string): string {
    return this.get(id)?.label ?? id.replace(/_/g, ' ');
  }

  icon(id: string): string {
    return this.get(id)?.icon ?? '🏪';
  }

  group(id: string): CategoryGroupId {
    return this.get(id)?.group ?? 'services';
  }
}
