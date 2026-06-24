import { signal } from '@preact/signals';
import type { LayerType } from '../types';
import type { Section, Sublayer } from '../v2/types';
import { addSublayer, addSublayerConfig } from '../v2/store';
import { arcgisCredentials } from '../credentials';
import {
  arcgisState,
  initializeArcGIS,
  refreshPortalAuthStatus,
  signInWithOAuth,
} from '../arcgis';
import { loadPortal } from '../basemaps/portal';
import { searchPortalItems } from './portal';
import type { BrowseFilter, PortalLayerItem } from './portal';
import { detectFromUrl } from './detect';
import type { DetectResult } from './detect';

export interface AddLayerPath {
  section: Section;
  index: number;
  itemIndex: number | null;
}

export type AddTab = 'browse' | 'url' | 'manual';
export type PortalConn = 'idle' | 'connecting' | 'connected' | 'error';

export const addLayerOpen = signal(false);
export const addLayerPath = signal<AddLayerPath | null>(null);
export const addTab = signal<AddTab>('browse');
export const addedCount = signal(0);

export const portalConn = signal<PortalConn>('idle');
export const portalError = signal<string | null>(null);
export const portalUser = signal<string | null>(null);

export const browseQuery = signal('');
export const browseMineOnly = signal(true);
export const browseFilter = signal<BrowseFilter>('all');
export const browseResults = signal<PortalLayerItem[]>([]);
export const browseLoading = signal(false);

export const urlInput = signal('');
export const urlDetecting = signal(false);
export const urlResult = signal<DetectResult | null>(null);

export function openAddLayer(path: AddLayerPath) {
  addLayerPath.value = path;
  addedCount.value = 0;
  addTab.value = 'browse';
  urlResult.value = null;
  addLayerOpen.value = true;
  void ensurePortal();
}

export function closeAddLayer() {
  addLayerOpen.value = false;
}

async function ensureInit() {
  if (!arcgisState.value.initialized) {
    await initializeArcGIS(arcgisCredentials.value || {});
  }
}

async function ensurePortal() {
  try {
    await ensureInit();
    await refreshPortalAuthStatus();
  } catch {
    /* surfaced via the Connect button */
  }
  if (arcgisState.value.portalAuthenticated) await connectPortal();
  else portalConn.value = 'idle';
}

export async function connectPortal() {
  portalConn.value = 'connecting';
  portalError.value = null;
  try {
    await ensureInit();
    if (!arcgisState.value.portalAuthenticated) await signInWithOAuth();
    const info = await loadPortal();
    portalUser.value = info.username;
    portalConn.value = 'connected';
    await runBrowseSearch();
  } catch (e) {
    portalError.value = e instanceof Error ? e.message : String(e);
    portalConn.value = 'error';
  }
}

export async function runBrowseSearch() {
  browseLoading.value = true;
  portalError.value = null;
  try {
    browseResults.value = await searchPortalItems(browseQuery.value, browseMineOnly.value, browseFilter.value);
  } catch (e) {
    portalError.value = e instanceof Error ? e.message : String(e);
    browseResults.value = [];
  } finally {
    browseLoading.value = false;
  }
}

export function addPortalItem(item: PortalLayerItem, layerId?: number) {
  const p = addLayerPath.value;
  if (!p) return;
  const options: Record<string, any> = { opacity: 1 };
  if (layerId !== undefined) options.layerId = layerId;
  const config: Sublayer = { type: 'portalItem', source: item.id, sourceKind: 'portalItem', zIndex: 0, options };
  addSublayerConfig(p.section, p.index, p.itemIndex, config);
  addedCount.value += 1;
}

export async function detectUrl() {
  urlDetecting.value = true;
  urlResult.value = null;
  try {
    urlResult.value = await detectFromUrl(urlInput.value);
  } finally {
    urlDetecting.value = false;
  }
}

export function addDetected() {
  const p = addLayerPath.value;
  const r = urlResult.value;
  if (!p || !r || !r.ok) return;
  addSublayerConfig(p.section, p.index, p.itemIndex, r.config);
  addedCount.value += 1;
  urlResult.value = null;
  urlInput.value = '';
}

export function addManual(type: LayerType) {
  const p = addLayerPath.value;
  if (!p) return;
  addSublayer(p.section, p.index, p.itemIndex, type);
  addedCount.value += 1;
}
