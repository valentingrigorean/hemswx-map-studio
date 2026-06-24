export interface MapLayerItem {
  id: string;
  name: string;
  showLegend?: boolean;
  legendUrl?: string;
  legendDescription?: string;
  layersIds?: string[];
}

export interface MapFeature {
  id?: string;
  name?: string;
  presentation: 'single' | 'multiple';
  mutuallyExclusive?: boolean;
  items: MapLayerItem[];
}

export type LayerType = 'wms' | 'tiled' | 'mapImage' | 'portalItem' | 'vectorTiled' | 'feature' | 'wmts' | 'sceneLayer' | 'unknown';

export type LayerSourceKind = 'uri' | 'portalItem';

export type MapDimension = 'map' | 'scene';

export interface LayerConfig {
  type: LayerType;
  source: string;
  sourceKind?: LayerSourceKind;
  zIndex?: number;
  refreshInterval?: number;
  supportedDimensions?: MapDimension[];
  sceneProperties?: Record<string, any>;
  options?: {
    layerId?: string | number;
    layerNames?: string[];
    opacity?: number;
    [key: string]: any;
  };
}

export interface MapLayerEntity {
  type: LayerType;
  source: string;
  sourceKind?: LayerSourceKind;
  zIndex?: number;
  refreshInterval?: number;
  supportedDimensions?: MapDimension[];
  sceneProperties?: Record<string, any>;
  options?: {
    layerId?: string | number;
    layerNames?: string[];
    opacity?: number;
    [key: string]: any;
  };
}

export type MapCountry = 'world' | 'no' | 'se' | 'dk' | 'fi';

export type UnitType = 'metric' | 'aviation' | 'nautical';

export type ElevationSourceType = 'tiledElevation' | 'portalItemElevation';

export interface ElevationSourceEntity {
  id: string;
  type: ElevationSourceType;
  source: string;
  options?: Record<string, any>;
}

export interface SceneConfigurationEntity {
  elevationSources?: ElevationSourceEntity[];
  atmosphereEffect?: string;
  sunLightingEnabled?: boolean;
}

export interface BaseMapEntity {
  id: string;
  name: string;
  thumbnailUrl?: string;
  thumbnailBase64?: string;
  countries?: MapCountry[];
  unitType?: UnitType;
  baseLayers: MapLayerEntity[];
  referenceLayers: MapLayerEntity[];
  scene?: SceneConfigurationEntity;
}

export interface LayerEntry {
  id: string;
  layers: LayerConfig[];
}

export interface IntlDict {
  [key: string]: string;
}

export interface MapLayersData {
  weatherFeatures: MapFeature[];
  features: MapFeature[];
  layers: LayerEntry[];
  baseMaps?: BaseMapEntity[];
  intl: {
    en: IntlDict;
    da: IntlDict;
    nb: IntlDict;
    sv: IntlDict;
    [key: string]: IntlDict;
  };
}
