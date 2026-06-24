import { useEffect, useRef, useState } from 'preact/hooks';
import { useComputed, useSignal } from '@preact/signals';
import PortalItem from '@arcgis/core/portal/PortalItem';
import { arcgisCredentials } from '../../lib/credentials';
import { arcgisState, initializeArcGIS, Basemap, PORTAL_URL } from '../../lib/arcgis';
import { C } from '../../lib/v2/core';
import { ICONS } from '../editor/Icons';
import { mapConfig } from '../../lib/v2/store';
import {
  readToggle, unifiedToggleEntries, type Legacy,
} from '../../lib/catalog/mapOptions';
import {
  basemapTitle, countsOf, dimensionOf,
  featureItemsById, featureTreeOf, resolveJsBasemap,
} from '../../lib/preview/options';
import { previewOpts as opts } from '../../lib/preview/state';
import { useMapLayers } from '../workspace/map-preview/useMapLayers';
import { DEFAULT_ARCGIS_BASEMAP } from '../workspace/map-preview/types';
import type { LayerConfig } from '../../lib/types';
import ControlPanel from './ControlPanel';
import { BasemapFlyout, Fab } from './controls';

const PANEL_W = 396;

export default function PreviewView() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [bmFabOpen, setBmFabOpen] = useState(false);
  const [bmFabAnchor, setBmFabAnchor] = useState<{ top: number; left: number } | null>(null);
  const bmFabRef = useRef<HTMLDivElement | null>(null);

  const counts = countsOf(opts.value);
  const dim = dimensionOf(opts.value);
  const is3D = dim === 'scene';

  const update = (fn: (prev: Legacy) => Legacy) => { opts.value = fn(opts.value); };

  const mapElRef = useRef<any>(null);
  const mapInstanceRef = useRef<__esri.Map | null>(null);
  const viewRef = useRef<__esri.MapView | __esri.SceneView | null>(null);
  const lastBasemapRef = useRef<string>('');
  const viewReady = useSignal(false);

  useEffect(() => {
    if (!arcgisState.value.initialized) {
      initializeArcGIS(arcgisCredentials.value || {}).catch((e) => console.error('Failed to initialize ArcGIS:', e));
    }
  }, []);

  const tree = useComputed(() => featureTreeOf(mapConfig.value));
  const itemsById = useComputed(() => featureItemsById(tree.value));

  const layerConfigs = useComputed<LayerConfig[]>(() => {
    const byId = itemsById.value;
    const on = unifiedToggleEntries.value.filter(
      (e) => e.kind === 'custom' && readToggle(opts.value, e.loc) === true
    );
    return on.flatMap((e) => byId.get(e.key.slice('custom:'.length))?.sublayers ?? []);
  });

  const { isLoading, failures, cleanup } = useMapLayers({ layerConfigs, mapInstance: mapInstanceRef, viewReady });

  const failedItems = useComputed(() => {
    const out = new Map<string, { name: string; error: string }>();
    if (!failures.value.length) return out;
    for (const f of failures.value) {
      for (const it of itemsById.value.values()) {
        if (it.sublayers.includes(f.config)) {
          if (!out.has(it.id)) out.set(it.id, { name: it.name, error: f.error });
          break;
        }
      }
    }
    return out;
  });

  const applyBasemap = async (id: string | undefined) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const resolved = resolveJsBasemap(id);
    const key = `${resolved.kind}:${resolved.id}`;
    if (key === lastBasemapRef.current) return;
    lastBasemapRef.current = key;
    if (resolved.kind === 'portalItem') {
      map.basemap = new Basemap({ portalItem: new PortalItem({ id: resolved.id, portal: { url: PORTAL_URL } }) });
    } else {
      map.basemap = Basemap.fromId(resolved.id) ?? Basemap.fromId(DEFAULT_ARCGIS_BASEMAP.id);
    }
  };

  useEffect(() => {
    const el = mapElRef.current;
    if (!el) return;
    const handler = (event: any) => {
      const target = event.target;
      if (!target?.map) return;
      if (mapInstanceRef.current !== target.map) cleanup();
      mapInstanceRef.current = target.map;
      viewRef.current = target.view ?? null;
      lastBasemapRef.current = '';
      viewReady.value = true;
      applyBasemap(opts.value.selectedBasemapId || undefined);
      const view: any = viewRef.current;
      if (view?.popup) view.popup.defaultPopupTemplateEnabled = true;
      else if (view) view.popup = { defaultPopupTemplateEnabled: true };
    };
    el.addEventListener('arcgisViewReadyChange', handler);
    return () => {
      el.removeEventListener('arcgisViewReadyChange', handler);
      cleanup();
      mapInstanceRef.current = null;
      viewRef.current = null;
      viewReady.value = false;
    };
  }, [dim]);

  useEffect(() => {
    if (viewReady.value) applyBasemap(opts.value.selectedBasemapId || undefined);
  }, [opts.value.selectedBasemapId, viewReady.value]);

  const rightInset = panelOpen ? PANEL_W : 0;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#070a0e' }} data-calcite-mode="dark">
      {is3D ? (
        <arcgis-scene key="scene" ref={mapElRef} basemap={DEFAULT_ARCGIS_BASEMAP.id} center="10.5,64.5" zoom="4" style={{ position: 'absolute', inset: 0 }} />
      ) : (
        <arcgis-map key="map" ref={mapElRef} basemap={DEFAULT_ARCGIS_BASEMAP.id} center="10.5,64.5" zoom="4" style={{ position: 'absolute', inset: 0 }} />
      )}

      {isLoading.value && (
        <div style={{ position: 'absolute', top: 60, left: panelOpen ? `calc(50% - ${PANEL_W / 2}px)` : '50%', transform: 'translateX(-50%)', fontSize: 11, color: C.fg2, background: 'rgba(13,15,20,0.85)', border: `1px solid ${C.bd}`, borderRadius: 999, padding: '4px 11px' }}>Loading layers…</div>
      )}

      {failedItems.value.size > 0 && (
        <div style={{ position: 'absolute', top: isLoading.value ? 94 : 60, left: panelOpen ? `calc(50% - ${PANEL_W / 2}px)` : '50%', transform: 'translateX(-50%)', maxWidth: 420, background: 'rgba(26,20,10,0.92)', border: '1px solid #5a4a1c', borderRadius: 11, padding: '9px 13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 13, height: 13, color: '#ffd27a', flexShrink: 0 }}>{ICONS.alert}</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#ffd27a' }}>
              {failedItems.value.size} layer{failedItems.value.size > 1 ? 's' : ''} failing to load
            </span>
          </div>
          <div style={{ marginTop: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[...failedItems.value.values()].map((f) => (
              <div key={f.name} title={f.error} style={{ fontSize: 11, color: '#d8c9a4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ fontWeight: 600, color: '#f2e3bb' }}>{f.name}</span>
                <span style={{ color: '#a8946a' }}> — {f.error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', top: 66, right: 16 + rightInset, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 11 }}>
        {!panelOpen && (() => {
          const total = tree.value.reduce((n, f) => n + f.items.length, 0);
          const on = tree.value.reduce(
            (n, f) => n + f.items.filter((it) => readToggle(opts.value, { kind: 'map', mapKey: 'mapFeatures', entryKey: it.id }) === true).length,
            0
          );
          return (
            <button
              onClick={() => setPanelOpen(true)}
              title="Show controls"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 9, height: 44, padding: '0 15px', borderRadius: 12, cursor: 'pointer', background: 'rgba(18,22,32,0.92)', border: '1px solid rgba(120,140,180,0.25)', color: '#dfe6f2', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
            >
              <span style={{ width: 18, height: 18 }}>{ICONS.layers}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>Layers</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#9fb6e6', fontVariantNumeric: 'tabular-nums' }}>{on ? `${on}/${total}` : total}</span>
            </button>
          );
        })()}
        <Fab
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>}
          on={is3D}
          title="2D / 3D"
          onClick={() => update((o) => {
            const next = { ...o };
            if (is3D) delete next.dimension;
            else next.dimension = 'scene';
            return next;
          })}
        />
        <div ref={bmFabRef}>
          <Fab
            icon={ICONS.map}
            on={bmFabOpen}
            title={`Basemap · ${basemapTitle(opts.value.selectedBasemapId as string | undefined)}`}
            onClick={() => {
              const r = bmFabRef.current?.getBoundingClientRect();
              if (r) setBmFabAnchor({ top: r.top, left: r.left });
              setBmFabOpen((o) => !o);
            }}
          />
        </div>
      </div>

      {bmFabOpen && (
        <BasemapFlyout
          anchor={bmFabAnchor}
          currentId={(opts.value.selectedBasemapId as string | undefined) || undefined}
          defaultId={undefined}
          onPick={(id) => update((o) => ({ ...o, selectedBasemapId: id }))}
          onClose={() => setBmFabOpen(false)}
        />
      )}

      {panelOpen && (
        <div style={{ position: 'absolute', top: 12, right: 12, bottom: 12, width: 372, display: 'flex' }}>
          <ControlPanel
            opts={opts.value}
            update={update}
            tree={tree.value}
            counts={counts}
            failedItems={failedItems.value}
            onClose={() => setPanelOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
