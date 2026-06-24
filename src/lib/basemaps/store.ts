import { signal } from '@preact/signals';
import { arcgisCredentials } from '../credentials';
import {
  arcgisState,
  initializeArcGIS,
  refreshPortalAuthStatus,
  signInWithOAuth,
  signOutFromOAuth,
} from '../arcgis';
import { loadBasemapItems, loadPortal } from './portal';
import type { PortalBasemap, PortalInfo } from './portal';

export type Connection = 'idle' | 'connecting' | 'connected' | 'error' | 'empty';
export type AuthPhase = 'idle' | 'authenticating' | 'loading';

export const connection = signal<Connection>('idle');
export const authPhase = signal<AuthPhase>('idle');
export const items = signal<PortalBasemap[]>([]);
export const selectedId = signal<string | null>(null);
export const query = signal('');
export const view = signal<'grid' | 'list'>('grid');
export const errorMsg = signal<string | null>(null);
export const lastSync = signal<string | null>(null);
export const portalInfo = signal<PortalInfo>({ username: null, fullName: null });

async function ensureInit() {
  if (!arcgisState.value.initialized) {
    await initializeArcGIS(arcgisCredentials.value || {});
  }
}

export async function init() {
  await ensureInit();
  await refreshPortalAuthStatus();
  if (arcgisState.value.portalAuthenticated) await connect();
  else connection.value = 'idle';
}

export async function connect() {
  connection.value = 'connecting';
  errorMsg.value = null;
  try {
    await ensureInit();
    if (!arcgisState.value.portalAuthenticated) {
      authPhase.value = 'authenticating';
      await signInWithOAuth();
    }
    authPhase.value = 'loading';
    portalInfo.value = await loadPortal();
    const list = await loadBasemapItems();
    items.value = list;
    lastSync.value = 'just now';
    connection.value = list.length ? 'connected' : 'empty';
  } catch (e) {
    console.error('Failed to load basemaps:', e);
    errorMsg.value = e instanceof Error ? e.message : String(e);
    connection.value = 'error';
  } finally {
    authPhase.value = 'idle';
  }
}

export function refresh() {
  return connect();
}

export function cancelSignIn() {
  authPhase.value = 'idle';
  connection.value = 'idle';
}

export function signOut() {
  signOutFromOAuth();
  items.value = [];
  selectedId.value = null;
  connection.value = 'idle';
}
