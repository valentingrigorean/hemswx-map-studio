import { computed } from '@preact/signals';
import { items as basemapItems } from '../basemaps/store';
import {
  baseLayersLabel, effectiveCountries, parseTags, type PortalBasemap,
} from '../basemaps/portal';
import {
  clearToggle,
  readToggle,
  setToggle,
  unifiedToggleEntries,
  type Legacy,
  type ToggleEntry,
} from '../catalog/mapOptions';
import { humanize, isRecognizedOverride } from '../catalog';
import type { AppConfiguration } from '../template/types';
import type { LayerConfig } from '../types';
import type { MapConfigV2 } from '../v2/types';

export type Dimension = 'map' | 'scene';

export interface PreviewFeatureItem {
  id: string;
  name: string;
  sublayers: LayerConfig[];
}

export interface PreviewFeature {
  section: 'weather' | 'features';
  id: string;
  name: string;
  select: 'one' | 'many' | null;
  items: PreviewFeatureItem[];
}

export function featureTreeOf(cfg: MapConfigV2): PreviewFeature[] {
  const out: PreviewFeature[] = [];
  for (const section of ['weather', 'features'] as const) {
    for (const node of cfg[section] ?? []) {
      const items: PreviewFeatureItem[] = node.items?.length
        ? node.items
            .filter((i) => i.id && !isRecognizedOverride(i.id))
            .map((i) => ({ id: i.id, name: i.name || humanize(i.id), sublayers: i.sublayers ?? [] }))
        : node.id && !isRecognizedOverride(node.id)
          ? [{ id: node.id, name: node.name || humanize(node.id), sublayers: node.sublayers ?? [] }]
          : [];
      if (!items.length) continue;
      out.push({
        section,
        id: node.id || items[0].id,
        name: node.name || humanize(node.id || items[0].id),
        select: node.items?.length ? (node.select === 'one' ? 'one' : 'many') : null,
        items,
      });
    }
  }
  return out;
}

export function featureItemsById(tree: PreviewFeature[]): Map<string, PreviewFeatureItem> {
  const map = new Map<string, PreviewFeatureItem>();
  for (const f of tree) for (const it of f.items) if (!map.has(it.id)) map.set(it.id, it);
  return map;
}

export function dimensionOf(mo: Legacy): Dimension {
  return mo.dimension === 'scene' ? 'scene' : 'map';
}

export interface BasemapChoice {
  id: string;
  title: string;
  subtitle: string;
  thumbnailUrl: string | null;
  builtin: boolean;
  countries: string[];
  wkid: number | null;
  tiles: string;
  layerCount: number;
  draft: boolean;
  modified: string | null;
  sort: number | null;
}

export const BUILTIN_BASEMAPS: { id: string; title: string; wellKnownId: string; tiles: string }[] = [
  { id: 'builtin:worldStandard', title: 'Standard', wellKnownId: 'topo-vector', tiles: 'Vector tiles' },
  { id: 'builtin:worldSatellite', title: 'Satellite', wellKnownId: 'satellite', tiles: 'Raster tiles' },
];

export const basemapChoices = computed<BasemapChoice[]>(() => [
  ...basemapItems.value
    .map((b: PortalBasemap): BasemapChoice => {
      const p = parseTags(b.tags);
      return {
        id: b.id, title: b.title, subtitle: b.owner, thumbnailUrl: b.thumbnailUrl, builtin: false,
        countries: effectiveCountries(p), wkid: b.wkid, tiles: baseLayersLabel(b.baseLayerTypes),
        layerCount: b.baseLayerCount, draft: p.env === 'test', modified: b.modified, sort: p.sort,
      };
    })
    .sort((a, b) => (a.sort ?? 1e9) - (b.sort ?? 1e9) || a.title.localeCompare(b.title)),
  ...BUILTIN_BASEMAPS.map((b): BasemapChoice => ({
    id: b.id, title: b.title, subtitle: 'Built-in basemap', thumbnailUrl: null, builtin: true,
    countries: ['world'], wkid: 3857, tiles: b.tiles, layerCount: 1, draft: false, modified: null, sort: null,
  })),
]);

export function basemapTitle(id: string | undefined | null): string {
  if (!id) return 'Default';
  const c = basemapChoices.value.find((b) => b.id === id);
  return c ? c.title : id;
}

export function resolveJsBasemap(id: string | undefined | null):
  | { kind: 'wellKnown'; id: string }
  | { kind: 'portalItem'; id: string } {
  if (!id) return { kind: 'wellKnown', id: 'gray-vector' };
  const builtin = BUILTIN_BASEMAPS.find((b) => b.id === id);
  if (builtin) return { kind: 'wellKnown', id: builtin.wellKnownId };
  return { kind: 'portalItem', id };
}

export function onToggles(mo: Legacy): ToggleEntry[] {
  return unifiedToggleEntries.value.filter((e) => readToggle(mo, e.loc) === true);
}

export interface PreviewCounts {
  layers: number;
  poi: number;
}

export function countsOf(mo: Legacy): PreviewCounts {
  const on = onToggles(mo);
  return {
    layers: on.filter((e) => e.kind === 'builtin' || e.kind === 'custom').length,
    poi: on.filter((e) => e.kind === 'poi').length,
  };
}

export interface DiffChip {
  k: string;
  label: string;
  tone?: 'add' | 'rem';
  from?: string;
  to?: string;
  detail?: string;
}

export function diffOf(mo: Legacy, base: Legacy): DiffChip[] {
  const d: DiffChip[] = [];
  if ((mo.selectedBasemapId ?? '') !== (base.selectedBasemapId ?? '')) {
    d.push({ k: 'bm', label: 'Basemap', from: basemapTitle(base.selectedBasemapId), to: basemapTitle(mo.selectedBasemapId) });
  }
  if (dimensionOf(mo) !== dimensionOf(base)) {
    d.push({ k: 'dim', label: 'Dimension', from: dimensionOf(base) === 'scene' ? '3D' : '2D', to: dimensionOf(mo) === 'scene' ? '3D' : '2D' });
  }
  const add: string[] = [];
  const rem: string[] = [];
  let poiAdd = 0;
  let poiRem = 0;
  for (const e of unifiedToggleEntries.value) {
    const a = readToggle(mo, e.loc) === true;
    const b = readToggle(base, e.loc) === true;
    if (a === b) continue;
    if (e.kind === 'poi') {
      if (a) poiAdd++; else poiRem++;
    } else if (e.kind !== 'routeForecast') {
      (a ? add : rem).push(e.displayName);
    }
  }
  if (add.length) d.push({ k: 'la', tone: 'add', label: `+${add.length} layer${add.length > 1 ? 's' : ''}`, detail: add.join(', ') });
  if (rem.length) d.push({ k: 'lr', tone: 'rem', label: `−${rem.length} layer${rem.length > 1 ? 's' : ''}`, detail: rem.join(', ') });
  if (poiAdd) d.push({ k: 'pa', tone: 'add', label: `+${poiAdd} POI` });
  if (poiRem) d.push({ k: 'pr', tone: 'rem', label: `−${poiRem} POI` });
  if (!!mo.useOfflineMap !== !!base.useOfflineMap) {
    d.push({ k: 'off', label: 'Offline map', from: base.useOfflineMap ? 'on' : 'off', to: mo.useOfflineMap ? 'on' : 'off' });
  }
  return d;
}

export function recursiveMerge(target: Legacy, source: Legacy): Legacy {
  const out: Legacy = { ...target };
  for (const [k, v] of Object.entries(source)) {
    const cur = out[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && cur && typeof cur === 'object' && !Array.isArray(cur)) {
      out[k] = recursiveMerge(cur, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function clearAllToggles(mo: Legacy): Legacy {
  let out: Legacy = { ...mo };
  for (const e of unifiedToggleEntries.value) {
    if (readToggle(out, e.loc) !== undefined) out = clearToggle(out, e.loc);
  }
  return out;
}

const enabledEntries = (mo: Legacy): ToggleEntry[] =>
  unifiedToggleEntries.value.filter((e) => readToggle(mo, e.loc) === true);

export function applyTemplateTo(
  current: Legacy,
  cfg: AppConfiguration | null | undefined,
  opts?: { otherActive?: (AppConfiguration | null | undefined)[]; isAlreadyActive?: boolean },
): Legacy {
  const mo = cfg?.mapOptions ?? {};
  const strategy = cfg?.mergeStrategy ?? 'merge';
  if (strategy === 'replace') return recursiveMerge(clearAllToggles(current), mo);
  if (strategy === 'toggle') {
    const enabled = enabledEntries(mo);
    if (!enabled.length) return current;
    const isActive = opts?.isAlreadyActive ?? enabled.every((e) => readToggle(current, e.loc) === true);
    let out = { ...current };
    if (!isActive) {
      for (const e of enabled) out = setToggle(out, e.loc, true);
      return out;
    }
    const keepOn = new Set(
      (opts?.otherActive ?? []).flatMap((o) => enabledEntries(o?.mapOptions ?? {}).map((e) => e.key))
    );
    for (const e of enabled) if (!keepOn.has(e.key)) out = setToggle(out, e.loc, false);
    return out;
  }
  return recursiveMerge(current, mo);
}
