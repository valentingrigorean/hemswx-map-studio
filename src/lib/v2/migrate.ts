import type { MapFeature, MapLayerItem, LayerEntry } from '../types';
import { deepClone, slug } from '../utils';
import builtins from '../catalog/builtins.generated.json';
import { emptyConfig } from './core';
import type { Item, Legend, MapConfigV2, Node, Override, Sublayer } from './types';

const RECOGNIZED_OVERRIDE_IDS = Object.keys(builtins.recognizedOverrides || {});
const DEFAULT_CUSTOM_LOGIC_IDS = new Set(RECOGNIZED_OVERRIDE_IDS);

export function looksLikeV1(raw: any): boolean {
  if (!raw || typeof raw !== 'object') return false;
  return Array.isArray(raw.weatherFeatures) || Array.isArray(raw.layers);
}

export function looksLikeV2(raw: any): boolean {
  if (!raw || typeof raw !== 'object') return false;
  if (raw.schemaVersion === 2) return true;
  if (looksLikeV1(raw)) return false;
  return Array.isArray(raw.weather) || Array.isArray(raw.overrides);
}

function legendFromItem(item: MapLayerItem, intlEn: Record<string, string>): Legend | undefined {
  if (item.legendUrl) return { url: item.legendUrl };
  if (item.legendDescription) {
    return { text: intlEn[item.legendDescription] || item.legendDescription };
  }
  if (item.showLegend) return true;
  return undefined;
}

function subsForItem(item: MapLayerItem, layersById: Map<string, LayerEntry>): Sublayer[] {
  const subs: Sublayer[] = [];
  for (const lid of item.layersIds || []) {
    const entry = layersById.get(lid);
    if (entry) {
      for (const l of entry.layers) subs.push(deepClone(l));
    }
  }
  return subs;
}

function convertFeature(
  f: MapFeature,
  layersById: Map<string, LayerEntry>,
  intlEn: Record<string, string>,
  customLogicIds: Set<string>
): { node?: Node; override?: Override } {
  const items = f.items || [];

  if (f.id && customLogicIds.has(f.id)) {
    return { override: { id: f.id, sublayers: items.flatMap((it) => subsForItem(it, layersById)) } };
  }

  const isGroup = f.presentation === 'multiple' || items.length > 1;
  if (isGroup) {
    const node: Node = {
      id: f.id || slug(f.name || 'group'),
      name: f.name || f.id || '',
      select: f.mutuallyExclusive ? 'one' : 'many',
      items: items.map((it): Item => {
        const legend = legendFromItem(it, intlEn);
        const item: Item = { id: it.id, name: it.name || it.id, sublayers: subsForItem(it, layersById) };
        if (legend !== undefined) item.legend = legend;
        return item;
      }),
    };
    return { node };
  }

  const it = items[0];
  const legend = it ? legendFromItem(it, intlEn) : undefined;
  const node: Node = {
    id: f.id || it?.id || slug(f.name || 'feature'),
    name: f.name || it?.name || f.id || '',
    sublayers: it ? subsForItem(it, layersById) : [],
  };
  if (legend !== undefined) node.legend = legend;
  return { node };
}

export function convertV1ToV2(
  v1: any,
  customLogicIds: Set<string> = DEFAULT_CUSTOM_LOGIC_IDS
): MapConfigV2 {
  const layersById = new Map<string, LayerEntry>();
  for (const l of v1.layers || []) layersById.set(l.id, l);
  const intlEn: Record<string, string> = v1.intl?.en || {};

  const cfg = emptyConfig();
  const handle = (arr: MapFeature[] | undefined, target: Node[]) => {
    for (const f of arr || []) {
      const { node, override } = convertFeature(f, layersById, intlEn, customLogicIds);
      if (override) cfg.overrides.push(override);
      else if (node) target.push(node);
    }
  };
  handle(v1.weatherFeatures, cfg.weather);
  handle(v1.features, cfg.features);

  for (const id of new Set([...customLogicIds, ...RECOGNIZED_OVERRIDE_IDS])) {
    if (cfg.overrides.some((o) => o.id === id)) continue;
    const entry = layersById.get(id);
    if (entry) {
      cfg.overrides.push({ id, sublayers: entry.layers.map((l) => deepClone(l)) });
    }
  }

  if (Array.isArray(v1.baseMaps)) cfg.baseMaps = v1.baseMaps;
  return cfg;
}

function normalizeV2Shape(data: any): MapConfigV2 {
  const cfg: MapConfigV2 = {
    schemaVersion: 2,
    weather: Array.isArray(data.weather) ? data.weather : [],
    features: Array.isArray(data.features) ? data.features : [],
    overrides: Array.isArray(data.overrides) ? data.overrides : [],
  };
  if (Array.isArray(data.baseMaps)) cfg.baseMaps = data.baseMaps;
  return cfg;
}

export function coerceToV2(
  raw: any,
  customLogicIds?: Set<string>
): { config: MapConfigV2; converted: boolean } {
  const data = raw?.map_layers && typeof raw.map_layers === 'object' ? raw.map_layers : raw;
  if (looksLikeV2(data)) return { config: normalizeV2Shape(data), converted: false };
  if (looksLikeV1(data)) return { config: convertV1ToV2(data, customLogicIds), converted: true };
  const cfg = emptyConfig();
  if (Array.isArray(data?.baseMaps)) cfg.baseMaps = data.baseMaps;
  return { config: cfg, converted: false };
}
