import PortalQueryParams from '@arcgis/core/portal/PortalQueryParams';
import type PortalItem from '@arcgis/core/portal/PortalItem';
import type { LayerType } from '../types';
import { currentUsername, getPortal } from '../basemaps/portal';

export interface SupportedItemType {
  v2: LayerType;
  itemType: string;
  label: string;
}

export const SUPPORTED_ITEM_TYPES: SupportedItemType[] = [
  { v2: 'feature', itemType: 'Feature Service', label: 'Feature' },
  { v2: 'mapImage', itemType: 'Map Service', label: 'Map Service' },
  { v2: 'vectorTiled', itemType: 'Vector Tile Service', label: 'Vector tile' },
  { v2: 'sceneLayer', itemType: 'Scene Service', label: 'Scene' },
  { v2: 'wms', itemType: 'WMS', label: 'WMS' },
];

export const PORTAL_ITEM_TO_V2: Record<string, LayerType> = Object.fromEntries(
  SUPPORTED_ITEM_TYPES.map((t) => [t.itemType, t.v2])
);

export type BrowseFilter = LayerType | 'all';

export interface PortalLayerItem {
  id: string;
  title: string;
  owner: string;
  modified: string;
  thumbnailUrl: string | null;
  itemType: string;
  v2Type: LayerType;
  item: PortalItem;
}

function typeClause(filter: BrowseFilter): string {
  const match = filter === 'all' ? null : SUPPORTED_ITEM_TYPES.find((t) => t.v2 === filter);
  const types = match ? [match] : SUPPORTED_ITEM_TYPES;
  return `(${types.map((t) => `type:"${t.itemType}"`).join(' OR ')})`;
}

export async function searchPortalItems(
  text: string,
  mineOnly: boolean,
  filter: BrowseFilter
): Promise<PortalLayerItem[]> {
  const portal = await getPortal();
  const username = currentUsername();
  const orgId = (portal.user as any)?.orgId as string | undefined;

  const clauses = [typeClause(filter)];
  const q = text.trim();
  if (q) clauses.push(q);
  if (mineOnly && username) clauses.push(`owner:"${username}"`);
  else if (orgId) clauses.push(`orgid:${orgId}`);

  const result = await portal.queryItems(
    new PortalQueryParams({
      query: clauses.join(' '),
      num: 50,
      sortField: 'modified',
      sortOrder: 'desc',
    })
  );

  return (result.results as PortalItem[])
    .map((i) => ({ i, itemType: i.type ?? '', v2Type: PORTAL_ITEM_TO_V2[i.type ?? ''] }))
    .filter((x): x is { i: PortalItem; itemType: string; v2Type: LayerType } => !!x.v2Type)
    .map(({ i, itemType, v2Type }) => ({
      id: i.id ?? '',
      title: i.title || i.id || '',
      owner: i.owner || '—',
      modified: i.modified ? i.modified.toISOString().slice(0, 10) : '—',
      thumbnailUrl: i.thumbnailUrl || null,
      itemType,
      v2Type,
      item: i,
    }));
}
