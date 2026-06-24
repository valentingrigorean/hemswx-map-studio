import { updateJsonData } from '../jsonStore';
import { extractMapLayersData, getDefaultData } from '../utils';
import { clearEnvelope, splitDocument } from '../envelope/store';
import { emptyConfig } from './core';
import { mapConfig, openRaw, setConfig } from './store';

export function ingestRaw(raw: any): boolean {
  const mapLayers = splitDocument(raw);
  const converted = openRaw(mapLayers);
  const v1 = extractMapLayersData(mapLayers);
  if (mapConfig.value.baseMaps && !v1.baseMaps) v1.baseMaps = mapConfig.value.baseMaps;
  updateJsonData(v1);
  return converted;
}

export function startEmpty() {
  setConfig(emptyConfig());
  updateJsonData(getDefaultData());
  clearEnvelope();
}
