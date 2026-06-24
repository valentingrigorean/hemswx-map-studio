import { useRef, useCallback } from 'preact/hooks';
import { useSignal, useSignalEffect, useComputed, batch, type Signal, type ReadonlySignal } from '@preact/signals';
import { createLayerFromConfig, arcgisState, layerRequestErrors, layerTag, clearLayerRequestError } from '../../../lib/arcgis';
import type { LayerConfig } from '../../../lib/types';
import { buildPreviewLayerEntries, safeDestroyLayer } from './utils';
import type { PreviewLayerEntry } from './types';

interface UseMapLayersOptions {
  layerConfigs: ReadonlySignal<LayerConfig[]>;
  mapInstance: { current: __esri.Map | null };
  viewReady: Signal<boolean>;
}

export interface LayerFailure {
  config: LayerConfig;
  error: string;
}

interface UseMapLayersResult {
  isLoading: Signal<boolean>;
  loadedLayerCount: Signal<number>;
  hasTimeAwareLayers: Signal<boolean>;
  error: Signal<string | null>;
  failures: ReadonlySignal<LayerFailure[]>;
  cleanup: () => void;
}

export function useMapLayers({
  layerConfigs,
  mapInstance,
  viewReady
}: UseMapLayersOptions): UseMapLayersResult {
  const isLoading = useSignal(false);
  const loadedLayerCount = useSignal(0);
  const hasTimeAwareLayers = useSignal(false);
  const error = useSignal<string | null>(null);
  const creationErrors = useSignal<Record<string, string>>({});

  const layerRegistryRef = useRef<Map<string, __esri.Layer>>(new Map());

  const failures = useComputed<LayerFailure[]>(() => {
    const created = creationErrors.value;
    const runtime = layerRequestErrors.value;
    return buildPreviewLayerEntries(layerConfigs.value).flatMap(entry => {
      const message = created[entry.key] ?? runtime[layerTag(entry.key)];
      return message ? [{ config: entry.config, error: message }] : [];
    });
  });

  const forgetErrors = useCallback((key: string) => {
    clearLayerRequestError(layerTag(key));
    if (key in creationErrors.value) {
      const next = { ...creationErrors.value };
      delete next[key];
      creationErrors.value = next;
    }
  }, []);

  const cleanup = useCallback(() => {
    layerRegistryRef.current.forEach(layer => safeDestroyLayer(layer));
    layerRegistryRef.current.clear();
  }, []);

  useSignalEffect(() => {
    const configs = layerConfigs.value;
    const initialized = arcgisState.value.initialized;
    const ready = viewReady.value;
    const map = mapInstance.current;

    if (!map || !ready || !initialized) return;

    const desiredEntries = buildPreviewLayerEntries(configs);
    const desiredKeys = new Set(desiredEntries.map(e => e.key));

    for (const [key, layer] of Array.from(layerRegistryRef.current.entries())) {
      if (!desiredKeys.has(key)) {
        map.layers.remove(layer);
        safeDestroyLayer(layer);
        layerRegistryRef.current.delete(key);
        forgetErrors(key);
      }
    }

    desiredEntries.forEach((entry) => {
      const layer = layerRegistryRef.current.get(entry.key);
      if (layer && layer.opacity !== entry.opacity) {
        layer.opacity = entry.opacity;
      }
    });

    const missingEntries = desiredEntries.filter(entry => !layerRegistryRef.current.has(entry.key));

    const reorderAndFinish = (entries: PreviewLayerEntry[]) => {
      entries.forEach((entry, index) => {
        const layer = layerRegistryRef.current.get(entry.key);
        if (layer) {
          map.layers.reorder(layer, index);
        }
      });
      batch(() => {
        isLoading.value = false;
        loadedLayerCount.value = map.layers.length;
      });
    };

    if (missingEntries.length > 0) {
      batch(() => {
        isLoading.value = true;
        error.value = null;
      });

      Promise.all(missingEntries.map(async entry => {
        try {
          const result = await createLayerFromConfig(entry.config, layerTag(entry.key));
          if (result.success && result.layer) {
            await result.layer.load();
            result.layer.opacity = entry.opacity;
            return { key: entry.key, layer: result.layer };
          }
          if (result.error) console.warn(`Layer error ${entry.key}:`, result.error);
          return { key: entry.key, failure: result.error ?? 'Failed to create layer' };
        } catch (e) {
          console.warn(`Layer exception ${entry.key}:`, e);
          return { key: entry.key, failure: e instanceof Error ? e.message : String(e) };
        }
      })).then(results => {
        if (!mapInstance.current) return;

        const currentEntries = buildPreviewLayerEntries(layerConfigs.value);
        const currentKeys = new Set(currentEntries.map(e => e.key));

        const nextErrors = { ...creationErrors.value };
        results.forEach(res => {
          if ('layer' in res && res.layer) {
            delete nextErrors[res.key];
            if (currentKeys.has(res.key)) {
              map.layers.add(res.layer);
              layerRegistryRef.current.set(res.key, res.layer);
            } else {
              safeDestroyLayer(res.layer);
            }
          } else if ('failure' in res && currentKeys.has(res.key)) {
            nextErrors[res.key] = res.failure as string;
          }
        });
        creationErrors.value = nextErrors;

        reorderAndFinish(currentEntries);
      });
    } else {
      reorderAndFinish(desiredEntries);
    }

    const wmsConfigs = desiredEntries.filter(e => e.config.type === 'wms');
    hasTimeAwareLayers.value = wmsConfigs.length > 0;
  });

  return {
    isLoading,
    loadedLayerCount,
    hasTimeAwareLayers,
    error,
    failures,
    cleanup
  };
}
