import Layer from '@arcgis/core/layers/Layer';
import WMSLayer from '@arcgis/core/layers/WMSLayer';
import type { LayerType } from '../types';
import type { Sublayer } from '../v2/types';

export type DetectResult =
  | { ok: true; config: Sublayer; v2Type: LayerType; title: string }
  | { ok: false; error: string };

const ITEM_ID_RE = /^[0-9a-f]{32}$/i;

function portalItemId(input: string): string | null {
  if (ITEM_ID_RE.test(input)) return input;
  const m = /[?&]id=([0-9a-f]{32})\b/i.exec(input);
  return m ? m[1] : null;
}

function looksLikeWms(url: string): boolean {
  return /service=wms/i.test(url) || /request=getcapabilities/i.test(url) || /\/wms\b/i.test(url);
}

const ESRI_TYPE_TO_V2: Record<string, LayerType> = {
  feature: 'feature',
  'map-image': 'mapImage',
  tile: 'tiled',
  'vector-tile': 'vectorTiled',
  scene: 'sceneLayer',
  wms: 'wms',
  wmts: 'wmts',
};

function sublayerNames(layer: any): string[] {
  const coll = layer?.allSublayers ?? layer?.sublayers;
  const arr: any[] = coll?.toArray?.() ?? (Array.isArray(coll) ? coll : []);
  return arr.map((s) => s?.name).filter((n): n is string => typeof n === 'string' && n.length > 0);
}

export async function detectFromUrl(input: string): Promise<DetectResult> {
  const raw = input.trim();
  if (!raw) return { ok: false, error: 'Enter a service URL or a portal item id.' };

  const id = portalItemId(raw);
  if (id) {
    return {
      ok: true,
      v2Type: 'portalItem',
      title: `Portal item · ${id}`,
      config: { type: 'portalItem', source: id, sourceKind: 'portalItem', zIndex: 0, options: { opacity: 1 } },
    };
  }

  if (looksLikeWms(raw)) {
    const base = raw.split('?')[0];
    const wms = new WMSLayer({ url: base });
    try {
      await wms.load();
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Could not load WMS capabilities from that URL.' };
    }
    return {
      ok: true,
      v2Type: 'wms',
      title: wms.title || base,
      config: { type: 'wms', source: base, zIndex: 0, options: { opacity: 1, layerNames: sublayerNames(wms) } },
    };
  }

  let layer: any;
  try {
    layer = await Layer.fromArcGISServerUrl({ url: raw } as any);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not load a layer from that URL.' };
  }
  if (!layer) return { ok: false, error: 'No layer could be created from that URL.' };

  const esriType = String(layer.type || '');
  if (esriType === 'group') {
    return { ok: false, error: 'That points at a whole service — paste a specific layer URL (e.g. …/FeatureServer/0).' };
  }
  const v2Type = ESRI_TYPE_TO_V2[esriType];
  if (!v2Type) {
    return { ok: false, error: `Unsupported layer type "${esriType || 'unknown'}".` };
  }

  const source = String(layer.url || raw);
  const title = layer.title || layer.portalItem?.title || source;
  const config: Sublayer = { type: v2Type, source, zIndex: 0, options: { opacity: 1 } };
  if (v2Type === 'wms') config.options!.layerNames = sublayerNames(layer);

  return { ok: true, config, v2Type, title };
}
