import { computed } from '@preact/signals';
import { BUILTINS, humanize, isRecognizedOverride, liveFeatures, ROUTE_LABEL } from './index';

export type ToggleKind = 'builtin' | 'poi' | 'routeForecast' | 'custom';

export type LegacyMapKey = 'poiFilter' | 'routeForecastFilter' | 'mapFeatures';

export type LegacyLoc =
  | { kind: 'flag'; flagKey: string; opacityKey?: string }
  | { kind: 'map'; mapKey: LegacyMapKey; entryKey: string };

export interface ToggleEntry {
  key: string;
  kind: ToggleKind;
  displayName: string;
  group: string;
  loc: LegacyLoc;
  config?: string;
}

export type Legacy = Record<string, any>;

export const GROUP_ORDER = [
  'weather', 'aviation', 'traffic', 'helicopter', 'base', 'threeD',
  'poi', 'routeForecast', 'custom', 'dispatch', 'other',
];

export const GROUP_LABEL: Record<string, string> = {
  weather: 'Weather', aviation: 'Aviation', traffic: 'Traffic', helicopter: 'Helicopter',
  base: 'Base map', threeD: '3D', poi: 'Points of interest', routeForecast: 'Route forecast',
  custom: 'Custom features', dispatch: 'Dispatch', other: 'Other',
};

export const OPACITY_KEY: Record<string, string> = {
  relief: 'reliefOpacity',
  vfrRoutes: 'vfrRouteOpacity',
};

const builtinToggleEntries: ToggleEntry[] = BUILTINS.builtinFeatures
  .filter((f) => f.legacyJsonKey)
  .map((f) => ({
    key: f.storageKey,
    kind: 'builtin',
    displayName: f.displayName,
    group: f.group,
    config: f.config,
    loc: { kind: 'flag', flagKey: f.legacyJsonKey as string, opacityKey: OPACITY_KEY[f.id] },
  }));

const poiToggleEntries: ToggleEntry[] = BUILTINS.poiTypes
  .filter((p) => p.id >= 0)
  .map((p) => ({
    key: `poi:${p.name}`,
    kind: 'poi',
    displayName: humanize(p.name),
    group: 'poi',
    loc: { kind: 'map', mapKey: 'poiFilter', entryKey: p.name },
  }));

const routeToggleEntries: ToggleEntry[] = BUILTINS.routeForecastSources.map((s) => ({
  key: `route:${s}`,
  kind: 'routeForecast',
  displayName: ROUTE_LABEL[s] ?? humanize(s),
  group: 'routeForecast',
  loc: { kind: 'map', mapKey: 'routeForecastFilter', entryKey: s },
}));

export const customToggleEntries = computed<ToggleEntry[]>(() =>
  liveFeatures.value.flatMap((f) => {
    const grouped = f.items.length > 1;
    return f.items
      .filter((it) => !isRecognizedOverride(it.id))
      .map((it): ToggleEntry => {
        const itemLabel = it.label || humanize(it.id);
        return {
          key: `custom:${it.id}`,
          kind: 'custom',
          displayName: grouped && f.label ? `${f.label} · ${itemLabel}` : it.label || f.label || it.id,
          group: 'custom',
          loc: { kind: 'map', mapKey: 'mapFeatures', entryKey: it.id },
        };
      });
  })
);

export const staticToggleEntries: ToggleEntry[] = [
  ...builtinToggleEntries, ...poiToggleEntries, ...routeToggleEntries,
];

export const unifiedToggleEntries = computed<ToggleEntry[]>(() => [
  ...staticToggleEntries, ...customToggleEntries.value,
]);

export function readToggle(legacy: Legacy, loc: LegacyLoc): boolean | undefined {
  if (loc.kind === 'flag') {
    const v = legacy[loc.flagKey];
    return typeof v === 'boolean' ? v : undefined;
  }
  const m = legacy[loc.mapKey];
  if (!m || typeof m !== 'object') return undefined;
  const v = m[loc.entryKey];
  return typeof v === 'boolean' ? v : undefined;
}

export function setToggle(legacy: Legacy, loc: LegacyLoc, enabled: boolean): Legacy {
  const next: Legacy = { ...legacy };
  if (loc.kind === 'flag') {
    next[loc.flagKey] = enabled;
    return next;
  }
  next[loc.mapKey] = { ...(next[loc.mapKey] ?? {}), [loc.entryKey]: enabled };
  return next;
}

export function clearToggle(legacy: Legacy, loc: LegacyLoc): Legacy {
  const next: Legacy = { ...legacy };
  if (loc.kind === 'flag') {
    delete next[loc.flagKey];
    if (loc.opacityKey) delete next[loc.opacityKey];
    return next;
  }
  const m = { ...(next[loc.mapKey] ?? {}) };
  delete m[loc.entryKey];
  if (Object.keys(m).length === 0) delete next[loc.mapKey];
  else next[loc.mapKey] = m;
  return next;
}

export function readOpacity(legacy: Legacy, loc: LegacyLoc): number | undefined {
  if (loc.kind !== 'flag' || !loc.opacityKey) return undefined;
  const v = legacy[loc.opacityKey];
  return typeof v === 'number' ? v : undefined;
}

export function setOpacity(legacy: Legacy, loc: LegacyLoc, value: number): Legacy {
  if (loc.kind !== 'flag' || !loc.opacityKey) return legacy;
  return { ...legacy, [loc.opacityKey]: value };
}

export interface ToggleGroup {
  group: string;
  label: string;
  entries: ToggleEntry[];
}

export function groupToggles(entries: ToggleEntry[]): ToggleGroup[] {
  const byGroup = new Map<string, ToggleEntry[]>();
  for (const e of entries) {
    const list = byGroup.get(e.group) ?? [];
    list.push(e);
    byGroup.set(e.group, list);
  }
  return GROUP_ORDER.filter((g) => byGroup.has(g)).map((g) => ({
    group: g,
    label: GROUP_LABEL[g] ?? g,
    entries: byGroup.get(g) as ToggleEntry[],
  }));
}

export function countSetToggles(legacy: Legacy): number {
  return unifiedToggleEntries.value.reduce(
    (n, e) => (readToggle(legacy, e.loc) === undefined ? n : n + 1),
    0
  );
}
