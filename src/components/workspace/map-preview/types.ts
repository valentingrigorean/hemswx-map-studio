import type { LayerConfig } from '../../../lib/types';

export interface PreviewLayerEntry {
  key: string;
  config: LayerConfig;
  opacity: number;
  zIndex: number;
  originalIndex: number;
}

export const DEFAULT_ARCGIS_BASEMAP = { id: 'gray-vector', name: 'Light Gray' };
