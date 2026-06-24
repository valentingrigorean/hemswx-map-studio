import { LayerConfig, LayerType } from './types';

export const getDefaultLayerConfig = (type: LayerType): LayerConfig => {
  const base: LayerConfig = { type, source: '', zIndex: 0, options: { opacity: 1 } };
  switch (type) {
    case 'wms':
      return { ...base, source: 'https://example.com/wms', options: { layerNames: ['layer1'], opacity: 1 } };
    case 'tiled':
      return { ...base, source: 'https://example.com/tiles/{z}/{y}/{x}.png' };
    case 'vectorTiled':
      return { ...base, source: 'https://example.com/vectortiles/{z}/{y}/{x}.pbf' };
    case 'mapImage':
      return { ...base, source: 'https://example.com/arcgis/rest/services/MapServer' };
    case 'feature':
      return { ...base, source: 'https://example.com/arcgis/rest/services/FeatureServer/0' };
    case 'portalItem':
      return { ...base, source: 'portal-item-id', options: { layerId: 0, opacity: 1 } };
    case 'wmts':
      return { ...base, source: 'https://example.com/wmts', sourceKind: 'uri' };
    case 'sceneLayer':
      return { ...base, source: 'https://example.com/SceneServer', supportedDimensions: ['scene'] };
    default:
      return base;
  }
};
