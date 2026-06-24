import Portal from '@arcgis/core/portal/Portal';
import PortalQueryParams from '@arcgis/core/portal/PortalQueryParams';
import type PortalItem from '@arcgis/core/portal/PortalItem';
import { PORTAL_URL } from '../arcgis';

export const PORTAL_HOST = 'snla.maps.arcgis.com';

export interface CountryDef {
  code: string;
  label: string;
  short: string;
}

export const COUNTRIES: CountryDef[] = [
  { code: 'world', label: 'World', short: 'World' },
  { code: 'nor', label: 'Norway', short: 'NOR' },
  { code: 'swe', label: 'Sweden', short: 'SWE' },
  { code: 'dnk', label: 'Denmark', short: 'DNK' },
  { code: 'fin', label: 'Finland', short: 'FIN' },
];

export type BasemapStatus = 'ok' | 'warn' | 'draft';

export interface PresentationTags {
  country: string[];
  sort: number | null;
  theme: 'dark' | null;
  elev: string | null;
  env: 'test' | null;
  rest: string[];
}

export interface PortalBasemap {
  id: string;
  title: string;
  owner: string;
  modified: string;
  snippet: string;
  thumbnailUrl: string | null;
  wkid: number | null;
  baseLayerTypes: string[];
  baseLayerCount: number;
  tags: string[];
  item: PortalItem;
}

const LAYER_TYPE_LABEL: Record<string, string> = {
  VectorTileLayer: 'Vector tiles',
  ArcGISTiledMapServiceLayer: 'Raster tiles',
  WebTiledLayer: 'Web tiles',
  WMTS: 'WMTS',
  WMS: 'WMS',
  OpenStreetMap: 'OSM tiles',
  ArcGISImageServiceLayer: 'Imagery',
  ArcGISMapServiceLayer: 'Map service',
};

export function baseLayersLabel(types: string[]): string {
  const labels = [...new Set(types.map((t) => LAYER_TYPE_LABEL[t] ?? t))];
  return labels.join(' + ');
}

const COUNTRY_CODES = new Set(COUNTRIES.map((c) => c.code));

export function parseTags(raw: string[]): PresentationTags {
  const p: PresentationTags = { country: [], sort: null, theme: null, elev: null, env: null, rest: [] };
  for (const tag of raw) {
    const lower = tag.toLowerCase();
    if (lower.startsWith('country:')) {
      const code = lower.slice('country:'.length);
      if (COUNTRY_CODES.has(code)) p.country.push(code);
      else p.rest.push(tag);
    } else if (lower.startsWith('sort:')) {
      const n = parseInt(lower.slice('sort:'.length), 10);
      if (!Number.isNaN(n)) p.sort = n;
      else p.rest.push(tag);
    } else if (lower === 'theme:dark') {
      p.theme = 'dark';
    } else if (lower.startsWith('elevation-unit:')) {
      p.elev = lower.slice('elevation-unit:'.length);
    } else if (lower === 'env:test') {
      p.env = 'test';
    } else {
      p.rest.push(tag);
    }
  }
  return p;
}

export function effectiveCountries(p: PresentationTags): string[] {
  return p.country.length ? p.country : ['world'];
}

export function statusOf(p: PresentationTags, wkid: number | null): BasemapStatus {
  if (p.env === 'test') return 'draft';
  if (wkid == null) return 'warn';
  return 'ok';
}

async function fetchMapData(item: PortalItem): Promise<{ wkid: number | null; baseLayerTypes: string[]; baseLayerCount: number }> {
  try {
    const data: any = await item.fetchData('json');
    const sr = data?.spatialReference;
    const wkid = typeof sr?.latestWkid === 'number' ? sr.latestWkid : typeof sr?.wkid === 'number' ? sr.wkid : null;
    const layers: any[] = Array.isArray(data?.baseMap?.baseMapLayers) ? data.baseMap.baseMapLayers : [];
    return {
      wkid,
      baseLayerCount: layers.length,
      baseLayerTypes: layers.map((l) => String(l?.layerType ?? '')).filter(Boolean),
    };
  } catch {
    return { wkid: null, baseLayerTypes: [], baseLayerCount: 0 };
  }
}

export async function toModel(item: PortalItem): Promise<PortalBasemap> {
  const { wkid, baseLayerTypes, baseLayerCount } = await fetchMapData(item);
  return {
    id: item.id ?? '',
    title: item.title || item.id || '',
    owner: item.owner || '—',
    modified: item.modified ? item.modified.toISOString().slice(0, 10) : '—',
    snippet: item.snippet || '',
    thumbnailUrl: item.thumbnailUrl || null,
    wkid,
    baseLayerTypes,
    baseLayerCount,
    tags: item.tags || [],
    item,
  };
}

export interface PortalInfo {
  username: string | null;
  fullName: string | null;
}

let portalInstance: Portal | null = null;

export async function loadPortal(): Promise<PortalInfo> {
  portalInstance = new Portal({ url: PORTAL_URL });
  await portalInstance.load();
  const user: any = portalInstance.user;
  return { username: user?.username || null, fullName: user?.fullName || null };
}

export async function getPortal(): Promise<Portal> {
  if (!portalInstance) await loadPortal();
  return portalInstance!;
}

export function currentUsername(): string | null {
  return ((portalInstance?.user as any)?.username as string) ?? null;
}

export async function loadBasemapItems(): Promise<PortalBasemap[]> {
  if (!portalInstance) await loadPortal();
  const portal = portalInstance!;
  const orgId = (portal.user as any)?.orgId as string | undefined;
  const clauses = ['type:"Web Map"'];
  if (orgId) clauses.push(`orgid:${orgId}`);
  const result = await portal.queryItems(
    new PortalQueryParams({
      query: clauses.join(' '),
      num: 100,
      sortField: 'title',
    })
  );
  const items = (result.results as PortalItem[]).filter((i) => i.type === 'Web Map');
  return Promise.all(items.map(toModel));
}

export function arcgisItemUrl(id: string): string {
  return `${PORTAL_URL}home/item.html?id=${id}`;
}
