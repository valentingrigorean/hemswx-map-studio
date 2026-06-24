import { computed } from '@preact/signals';
import builtins from './builtins.generated.json';
import { mapConfig } from '../v2/store';

export interface PoiTypeEntry {
  name: string;
  id: number;
}

export interface LayerKeyEntry {
  key: string;
  constant: string;
}

export interface BuiltinFeature {
  id: string;
  storageKey: string;
  legacyJsonKey: string | null;
  overridableRemoteId: string | null;
  displayName: string;
  group: string;
  dimension: 'map' | 'scene' | 'both';
  config: 'basic' | 'safeSky' | 'notam' | 'weatherStation' | 'vfrRoutes';
  defaultEnabled: boolean;
  defaultOpacity: number | null;
}

export interface BuiltinCatalog {
  mapLayerIds: string[];
  poiTypes: PoiTypeEntry[];
  routeForecastSources: string[];
  layerKeys: LayerKeyEntry[];
  recognizedOverrides: Record<string, string>;
  builtinFeatures: BuiltinFeature[];
}

export const BUILTINS = builtins as BuiltinCatalog;

export const recognizedOverrideIds = Object.keys(BUILTINS.recognizedOverrides);

export const ROUTE_LABEL: Record<string, string> = {
  iga: 'IGA', smhi: 'SMHI', offShore: 'Offshore', nla: 'NLA',
};

export function humanize(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}

export function isRecognizedOverride(id: string): boolean {
  return id in BUILTINS.recognizedOverrides;
}

export const builtinFeatures = BUILTINS.builtinFeatures;

export const overridableFeatures = BUILTINS.builtinFeatures.filter(
  (f) => f.overridableRemoteId
);

export interface CatalogEntry {
  id: string;
  label?: string;
}

export interface CatalogFeatureItem {
  id: string;
  label?: string;
}

export interface CatalogFeature {
  section: 'weather' | 'features';
  id: string;
  label?: string;
  select: 'one' | 'many' | null;
  items: CatalogFeatureItem[];
}

export const liveFeatures = computed<CatalogFeature[]>(() => {
  const cfg = mapConfig.value;
  const out: CatalogFeature[] = [];
  for (const section of ['weather', 'features'] as const) {
    for (const node of cfg[section] ?? []) {
      const items = node.items?.length
        ? node.items.filter((i) => i.id).map((i) => ({ id: i.id, label: i.name }))
        : node.id ? [{ id: node.id, label: node.name }] : [];
      if (!items.length) continue;
      out.push({
        section,
        id: node.id || items[0].id,
        label: node.name,
        select: node.items?.length ? (node.select === 'one' ? 'one' : 'many') : null,
        items,
      });
    }
  }
  return out;
});

export const liveCatalog = computed<{ nodes: CatalogEntry[]; items: CatalogEntry[] }>(() => {
  const cfg = mapConfig.value;
  const nodes: CatalogEntry[] = [];
  const items: CatalogEntry[] = [];
  for (const section of [cfg.weather, cfg.features]) {
    for (const node of section ?? []) {
      if (node.id) nodes.push({ id: node.id, label: node.name });
      for (const item of node.items ?? []) {
        if (item.id) items.push({ id: item.id, label: item.name });
      }
    }
  }
  return { nodes, items };
});
