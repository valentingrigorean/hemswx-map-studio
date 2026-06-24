import { signal, computed } from '@preact/signals';
import type { LayerType } from '../types';
import { deepClone } from '../utils';
import { getDefaultLayerConfig } from '../layers';
import { LAST_JSON_KEY } from '../jsonStore';
import { envKey, readScoped } from '../studio';
import { configSummary, emptyConfig, normalize } from './core';
import { coerceToV2 } from './migrate';
import type { Item, Legend, MapConfigV2, Node, Override, Section, Sublayer } from './types';

export const V2_KEY = 'hemswx-map-config-v2';
const PREVIEW_VISIBLE_KEY = 'hemswx-v2-preview-visible';

export type EditorView = 'form' | 'json';
export interface Selection {
  section: Section;
  index: number;
  itemIndex?: number;
}

export const mapConfig = signal<MapConfigV2>(emptyConfig());
export const hasConfig = signal(false);
export const selection = signal<Selection | null>(null);
export const editorView = signal<EditorView>('form');
export const previewOpen = signal<boolean>(loadPreviewVisible());
export interface ConvertedNotice {
  weather: number;
  features: number;
  overrides: string[];
}
export const convertedNotice = signal<ConvertedNotice | null>(null);
export function dismissConverted() {
  convertedNotice.value = null;
}

export const tree = computed(() => normalize(mapConfig.value));
export const summary = computed(() => configSummary(mapConfig.value));

function loadPreviewVisible(): boolean {
  try {
    const v = localStorage.getItem(PREVIEW_VISIBLE_KEY);
    if (v !== null) return v === 'true';
  } catch {}
  return true;
}

export function setPreviewOpen(open: boolean) {
  previewOpen.value = open;
  try {
    localStorage.setItem(PREVIEW_VISIBLE_KEY, String(open));
  } catch {}
}

function persist() {
  clearTimeout(persistTimer);
  persistTimer = undefined;
  try {
    localStorage.setItem(envKey(V2_KEY), JSON.stringify(mapConfig.value));
  } catch (e) {
    console.warn('Failed to persist v2 config:', e);
  }
}

let persistTimer: ReturnType<typeof setTimeout> | undefined;
function persistSoon() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(persist, 400);
}

export function persistConfig() {
  persist();
}

export function setConfig(cfg: MapConfigV2, opts: { persist?: boolean; select?: boolean } = {}) {
  mapConfig.value = cfg;
  hasConfig.value = true;
  if (opts.persist !== false) persist();
  if (opts.select !== false) selectFirst();
}

export function selectFirst() {
  const cfg = mapConfig.value;
  if (cfg.weather.length) selection.value = { section: 'weather', index: 0 };
  else if (cfg.features.length) selection.value = { section: 'features', index: 0 };
  else if (cfg.overrides.length) selection.value = { section: 'overrides', index: 0 };
  else selection.value = null;
}

export function openRaw(raw: any): boolean {
  const { config, converted } = coerceToV2(raw);
  setConfig(config);
  convertedNotice.value = converted
    ? {
        weather: config.weather.length,
        features: config.features.length,
        overrides: config.overrides.map((o) => o.id),
      }
    : null;
  return converted;
}

export function loadStoredConfig(): boolean {
  try {
    const storedV2 = readScoped(V2_KEY);
    if (storedV2) {
      const { config } = coerceToV2(JSON.parse(storedV2));
      setConfig(config, { persist: false });
      return true;
    }
  } catch (e) {
    console.warn('Failed to load v2 config:', e);
  }
  try {
    const legacy = readScoped(LAST_JSON_KEY);
    if (legacy) {
      openRaw(JSON.parse(legacy));
      return true;
    }
  } catch (e) {
    console.warn('Failed to load legacy v1 config:', e);
  }
  return false;
}

export function reloadForEnv() {
  if (loadStoredConfig()) return;
  mapConfig.value = emptyConfig();
  hasConfig.value = false;
  selection.value = null;
}

export function select(section: Section, index: number, itemIndex?: number) {
  selection.value = { section, index, itemIndex };
  editorView.value = 'form';
}

function mutate(fn: (draft: MapConfigV2) => void) {
  const draft = deepClone(mapConfig.value);
  fn(draft);
  mapConfig.value = draft;
  persistSoon();
}

type SubHost = { sublayers?: Sublayer[] };

function subHost(draft: MapConfigV2, section: Section, index: number, itemIndex?: number | null): SubHost | null {
  const node = draft[section][index] as Node | Override | undefined;
  if (!node) return null;
  if (itemIndex != null && (node as Node).items) {
    return (node as Node).items![itemIndex] || null;
  }
  return node;
}

export function updateNodeField(section: Section, index: number, changes: Partial<Node>) {
  mutate((d) => {
    const node = d[section][index] as Node | undefined;
    if (node) Object.assign(node, changes);
  });
}

export function updateItemField(section: Section, index: number, itemIndex: number, changes: Partial<Item>) {
  mutate((d) => {
    const node = d[section][index] as Node | undefined;
    const item = node?.items?.[itemIndex];
    if (item) Object.assign(item, changes);
  });
}

export function setLegend(section: Section, index: number, itemIndex: number | null, legend: Legend | undefined) {
  mutate((d) => {
    const host = subHost(d, section, index, itemIndex) as Node | Item | null;
    if (!host) return;
    if (legend === undefined) delete (host as any).legend;
    else (host as any).legend = legend;
  });
}

export function setSelectMode(section: Section, index: number, mode: 'one' | 'many') {
  mutate((d) => {
    const node = d[section][index] as Node | undefined;
    if (node) node.select = mode;
  });
}

export function addSublayer(section: Section, index: number, itemIndex: number | null, type: LayerType) {
  mutate((d) => {
    const host = subHost(d, section, index, itemIndex);
    if (!host) return;
    if (!host.sublayers) host.sublayers = [];
    host.sublayers.push(getDefaultLayerConfig(type));
  });
}

export function addSublayerConfig(section: Section, index: number, itemIndex: number | null, config: Sublayer) {
  mutate((d) => {
    const host = subHost(d, section, index, itemIndex);
    if (!host) return;
    if (!host.sublayers) host.sublayers = [];
    host.sublayers.push(deepClone(config));
  });
}

export function updateSublayer(
  section: Section,
  index: number,
  itemIndex: number | null,
  subIndex: number,
  changes: Partial<Sublayer>
) {
  mutate((d) => {
    const host = subHost(d, section, index, itemIndex);
    const sl = host?.sublayers?.[subIndex];
    if (sl) Object.assign(sl, changes);
  });
}

export function setSublayerOption(
  section: Section,
  index: number,
  itemIndex: number | null,
  subIndex: number,
  key: string,
  value: any
) {
  mutate((d) => {
    const host = subHost(d, section, index, itemIndex);
    const sl = host?.sublayers?.[subIndex];
    if (!sl) return;
    if (!sl.options) sl.options = {};
    if (value === undefined) delete (sl.options as any)[key];
    else (sl.options as any)[key] = value;
  });
}

export function removeSublayer(section: Section, index: number, itemIndex: number | null, subIndex: number) {
  mutate((d) => {
    const host = subHost(d, section, index, itemIndex);
    if (host?.sublayers) host.sublayers.splice(subIndex, 1);
  });
}

export function changeSublayerType(
  section: Section,
  index: number,
  itemIndex: number | null,
  subIndex: number,
  type: LayerType
) {
  mutate((d) => {
    const host = subHost(d, section, index, itemIndex);
    const sl = host?.sublayers?.[subIndex];
    if (!sl) return;
    const fresh = getDefaultLayerConfig(type);
    const keepOpacity = sl.options?.opacity;
    sl.type = type;
    sl.source = sl.source || fresh.source;
    sl.options = { ...fresh.options };
    if (keepOpacity !== undefined) sl.options!.opacity = keepOpacity;
  });
}

export function addNode(section: Section): Selection {
  let newIndex = 0;
  mutate((d) => {
    if (section === 'overrides') {
      const ov: Override = { id: '', sublayers: [] };
      d.overrides.push(ov);
      newIndex = d.overrides.length - 1;
    } else {
      const node: Node = { id: '', name: '', sublayers: [] };
      d[section].push(node);
      newIndex = d[section].length - 1;
    }
  });
  const sel: Selection = { section, index: newIndex };
  selection.value = sel;
  editorView.value = 'form';
  return sel;
}

export function deleteNode(section: Section, index: number) {
  mutate((d) => {
    (d[section] as any[]).splice(index, 1);
  });
  const arr = mapConfig.value[section];
  if (!arr.length) selection.value = null;
  else selection.value = { section, index: Math.min(index, arr.length - 1) };
}

export function addItem(section: Section, index: number): number {
  let itemIndex = 0;
  mutate((d) => {
    const node = d[section][index] as Node | undefined;
    if (!node) return;
    if (!node.items) node.items = [];
    node.items.push({ id: '', name: 'New item', sublayers: [] });
    itemIndex = node.items.length - 1;
  });
  return itemIndex;
}

export function deleteItem(section: Section, index: number, itemIndex: number) {
  mutate((d) => {
    const node = d[section][index] as Node | undefined;
    node?.items?.splice(itemIndex, 1);
  });
}
