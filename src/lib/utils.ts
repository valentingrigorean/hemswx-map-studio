import { MapLayersData } from './types';

export const slug = (s: string): string => 
  s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

export const deepClone = <T>(v: T): T => structuredClone(v);

export const safeParse = (text: string): [any, string | null] => {
  try {
    return [JSON.parse(text), null];
  } catch (e) {
    return [null, e instanceof Error ? e.message : 'Parse error'];
  }
};

export const readJsonFile = (file: File, onJson: (data: any) => void) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target?.result as string;
    if (!text) return;
    const [data, err] = safeParse(text);
    if (err) {
      console.error('Invalid JSON:', err);
      return;
    }
    onJson(data);
  };
  reader.readAsText(file);
};

export const downloadBlob = (filename: string, content: string, mimeType = 'application/json') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const getDefaultData = (): MapLayersData => ({
  weatherFeatures: [],
  features: [],
  layers: [],
  intl: {
    en: {},
    da: {},
    nb: {},
    sv: {}
  }
});

export const extractMapLayersData = (data: any): MapLayersData => {
  if (!data || typeof data !== 'object') {
    return getDefaultData();
  }

  return sanitizeMapLayersData({
    weatherFeatures: data.weatherFeatures || [],
    features: data.features || [],
    layers: data.layers || [],
    baseMaps: data.baseMaps,
    intl: data.intl || { en: {}, da: {}, nb: {}, sv: {} }
  });
};

const VALID_ITEM_KEYS = new Set(['id', 'name', 'showLegend', 'legendUrl', 'legendDescription', 'layersIds']);
const VALID_FEATURE_KEYS = new Set(['id', 'name', 'presentation', 'mutuallyExclusive', 'items']);
const VALID_LAYER_ENTRY_KEYS = new Set(['id', 'layers', 'category', 'copyright', 'country']);
const VALID_SUBLAYER_KEYS = new Set([
  'type', 'source', 'sourceKind', 'zIndex', 'refreshInterval', 'options',
  'supportedDimensions', 'sceneProperties',
]);

function sanitizeItem(item: any): any {
  const clean: any = {};
  for (const key of Object.keys(item)) {
    if (VALID_ITEM_KEYS.has(key)) {
      clean[key] = item[key];
    }
  }
  return clean;
}

function sanitizeFeature(feature: any): any {
  const clean: any = {};
  for (const key of Object.keys(feature)) {
    if (VALID_FEATURE_KEYS.has(key)) {
      if (key === 'items' && Array.isArray(feature.items)) {
        clean.items = feature.items.map(sanitizeItem);
      } else {
        clean[key] = feature[key];
      }
    }
  }
  return clean;
}

function sanitizeSublayer(sublayer: any): any {
  const clean: any = {};
  for (const key of Object.keys(sublayer)) {
    if (VALID_SUBLAYER_KEYS.has(key)) {
      clean[key] = sublayer[key];
    }
  }
  return clean;
}

function sanitizeLayerEntry(layer: any): any {
  const clean: any = {};
  for (const key of Object.keys(layer)) {
    if (VALID_LAYER_ENTRY_KEYS.has(key)) {
      if (key === 'layers' && Array.isArray(layer.layers)) {
        clean.layers = layer.layers.map(sanitizeSublayer);
      } else {
        clean[key] = layer[key];
      }
    }
  }
  return clean;
}

export const sanitizeMapLayersData = (data: MapLayersData): MapLayersData => {
  const result: MapLayersData = {
    weatherFeatures: (data.weatherFeatures || []).map(sanitizeFeature),
    features: (data.features || []).map(sanitizeFeature),
    layers: (data.layers || []).map(sanitizeLayerEntry),
    intl: data.intl || { en: {}, da: {}, nb: {}, sv: {} }
  };

  if (data.baseMaps && Array.isArray(data.baseMaps)) {
    result.baseMaps = data.baseMaps;
  }

  return result;
};