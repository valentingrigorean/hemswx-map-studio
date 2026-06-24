import type {
  LayerType,
} from '../types';
import type {
  Item,
  Legend,
  LegendKind,
  MapConfigV2,
  Node,
  NodeStatus,
  Override,
  Section,
  Sublayer,
  Tree,
  TreeItem,
  TreeNode,
} from './types';

export const C = {
  pageBg: '#0f1115',
  railBg: '#0a0c10',
  panelBg: '#0d0f14',
  card: '#12141c',
  cardHi: '#141a2b',
  inset: '#0b0d12',
  bd: '#22273a',
  bdHi: '#2d3650',
  bd2: '#1a1f30',
  line: '#3a4460',
  accent: '#3a5cff',
  accentText: '#5b9cff',
  fg: '#e6e8ee',
  fg2: '#aeb8c8',
  fg3: '#9aa4b2',
  mut: '#7c879b',
  mut2: '#5b6b85',
  faint: '#4a566e',
} as const;

export interface StatusCfg {
  label: string;
  dot: string;
  fg: string;
  bg: string;
  bd: string;
}

export const STATUS: Record<NodeStatus, StatusCfg> = {
  ok: { label: 'OK', dot: '#2ecc71', fg: '#7ee2a8', bg: '#11331f', bd: '#1d5235' },
  warn: { label: 'CHECK', dot: '#ffb020', fg: '#ffd27a', bg: '#2e2815', bd: '#5a4a1c' },
  empty: { label: 'EMPTY', dot: '#7c879b', fg: '#aeb8c8', bg: '#171a22', bd: '#2a3146' },
};

export interface LayerTypeMeta {
  label: string;
  short: string;
  fg: string;
  bg: string;
  bd: string;
  need: 'layerNames' | 'layerId' | null;
}

export const LAYER_TYPES: Record<string, LayerTypeMeta> = {
  wms: { label: 'WMS', short: 'WMS', fg: '#7ee2d0', bg: '#0e2a28', bd: '#1c4a45', need: 'layerNames' },
  portalItem: { label: 'Portal Item', short: 'PORTAL', fg: '#8db4ff', bg: '#101a30', bd: '#23375e', need: 'layerId' },
  tiled: { label: 'Tiled', short: 'TILED', fg: '#ffcf8a', bg: '#2a2113', bd: '#5a4520', need: null },
  vectorTiled: { label: 'Vector Tiled', short: 'VTILE', fg: '#9fd0ff', bg: '#0f2030', bd: '#1f3e5a', need: null },
  feature: { label: 'Feature', short: 'FEAT', fg: '#9be6a8', bg: '#102a18', bd: '#1f4d2e', need: null },
  mapImage: { label: 'Map Image', short: 'MAPIMG', fg: '#cdb6ff', bg: '#1c1633', bd: '#392c5e', need: null },
  wmts: { label: 'WMTS', short: 'WMTS', fg: '#7ee2d0', bg: '#0e2a28', bd: '#1c4a45', need: null },
  sceneLayer: { label: 'Scene Layer', short: '3D', fg: '#ffb0c8', bg: '#2e1620', bd: '#5a2638', need: null },
};

export const ADDABLE_LAYER_TYPES: LayerType[] = [
  'wms', 'portalItem', 'tiled', 'feature', 'mapImage', 'vectorTiled',
];

export const SECTIONS: { key: Section; label: string; sub: string }[] = [
  { key: 'weather', label: 'Weather', sub: 'Aviation weather layers' },
  { key: 'features', label: 'Features', sub: 'Navigation & safety' },
  { key: 'overrides', label: 'Overrides', sub: 'Patches to app-defined features' },
];

export const SECTION_BADGE: Record<Section, { label: string; fg: string; bg: string; bd: string }> = {
  weather: { label: 'Weather Feature', fg: '#8db4ff', bg: '#101a30', bd: '#23375e' },
  features: { label: 'General Feature', fg: '#9be6a8', bg: '#102a18', bd: '#1f4d2e' },
  overrides: { label: 'Override', fg: '#ffb0c8', bg: '#2e1620', bd: '#5a2638' },
};

export function isPlaceholder(src: string | undefined): boolean {
  return !src || /example\.com/i.test(src) || src.trim() === '';
}

export function sublayerIssues(sl: Sublayer): string[] {
  const issues: string[] = [];
  const meta = LAYER_TYPES[sl.type];
  if (isPlaceholder(sl.source)) issues.push('Source looks like a placeholder');
  if (meta && meta.need === 'layerNames') {
    const ln = sl.options && sl.options.layerNames;
    if (!ln || !ln.length) issues.push('WMS requires layerNames');
  }
  if (meta && meta.need === 'layerId') {
    const li = sl.options && sl.options.layerId;
    if (li === undefined || li === null) issues.push('Portal item requires layerId');
  }
  return issues;
}

export function allSubs(node: { sublayers?: Sublayer[]; items?: Item[] | null }): Sublayer[] {
  if (node.items) return node.items.flatMap((i) => i.sublayers || []);
  return node.sublayers || [];
}

export function nodeStatus(node: { sublayers?: Sublayer[]; items?: Item[] | null }): NodeStatus {
  const subs = allSubs(node);
  if (!subs.length) return 'empty';
  for (const sl of subs) if (sublayerIssues(sl).length) return 'warn';
  return 'ok';
}

export function legendKind(legend: Legend | undefined): LegendKind {
  if (legend === true) return 'auto';
  if (legend && typeof legend === 'object') {
    if ('url' in legend && legend.url) return 'url';
    if ('text' in legend && legend.text) return 'text';
    if ('image' in legend && legend.image) return 'image';
  }
  return 'none';
}

export function shortSource(src: string | undefined): string {
  if (!src) return '(no source)';
  if (/^https?:\/\//.test(src)) {
    try {
      const u = new URL(src);
      return u.host + u.pathname;
    } catch {
      return src;
    }
  }
  return src;
}

export function optSummary(sl: Sublayer): string {
  const o = sl.options || {};
  const bits: string[] = [];
  if (o.layerNames && o.layerNames.length) {
    bits.push(`${o.layerNames.length} layer name${o.layerNames.length === 1 ? '' : 's'}`);
  }
  if (o.layerId !== undefined && o.layerId !== null) bits.push(`layerId ${o.layerId}`);
  if (o.opacity !== undefined && o.opacity !== 1) bits.push(`${Math.round(o.opacity * 100)}% opacity`);
  const extras = Object.keys(o).filter((k) => !['layerNames', 'layerId', 'opacity'].includes(k));
  if (extras.length) bits.push(`+${extras.length} param`);
  return bits.length ? bits.join(' · ') : 'no options';
}

export function normalize(cfg: MapConfigV2): Tree {
  const mkNode = (section: Section) => (raw: Node | Override, index: number): TreeNode => {
    const asNode = raw as Node;
    const isGroup = Array.isArray(asNode.items);
    const name = section === 'overrides' ? null : asNode.name || raw.id;
    return {
      section,
      index,
      id: raw.id,
      name,
      kind: isGroup ? 'group' : 'leaf',
      select: isGroup ? asNode.select || 'many' : null,
      legend: asNode.legend,
      sublayers: raw.sublayers || [],
      items: isGroup
        ? (asNode.items || []).map((it: Item, itemIndex: number): TreeItem => ({
            section,
            parent: raw.id,
            index,
            itemIndex,
            id: it.id,
            name: it.name || it.id,
            kind: 'leaf',
            legend: it.legend,
            sublayers: it.sublayers || [],
          }))
        : null,
      raw,
    };
  };

  return {
    weather: (cfg.weather || []).map(mkNode('weather')),
    features: (cfg.features || []).map(mkNode('features')),
    overrides: (cfg.overrides || []).map(mkNode('overrides')),
  };
}

export function emptyConfig(): MapConfigV2 {
  return { schemaVersion: 2, weather: [], features: [], overrides: [] };
}

export function configSummary(cfg: MapConfigV2) {
  const all: (Node | Override)[] = [...cfg.weather, ...cfg.features, ...cfg.overrides];
  const subs = all.reduce((a, n) => a + allSubs(n as Node).length, 0);
  const warn =
    all.filter((n) => nodeStatus(n as Node) === 'warn').length +
    all.flatMap((n) => (n as Node).items || []).filter((it) => nodeStatus(it) === 'warn').length;
  return {
    weather: cfg.weather.length,
    features: cfg.features.length,
    overrides: cfg.overrides.length,
    subs,
    warn,
  };
}
