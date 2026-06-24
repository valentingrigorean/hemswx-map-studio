import { useEffect, useRef } from 'preact/hooks';
import { useComputed, useSignal } from '@preact/signals';
import TimeExtent from '@arcgis/core/time/TimeExtent';
import TimeInterval from '@arcgis/core/time/TimeInterval';
import { arcgisCredentials } from '../../lib/credentials';
import { arcgisState, initializeArcGIS, isOAuthConfigured, signInWithOAuth } from '../../lib/arcgis';
import type { LayerConfig } from '../../lib/types';
import { C, legendKind, shortSource } from '../../lib/v2/core';
import type { Legend, Section, Sublayer } from '../../lib/v2/types';
import { useMapLayers } from '../workspace/map-preview/useMapLayers';
import { useBasemap } from '../workspace/map-preview/useBasemap';
import { DEFAULT_ARCGIS_BASEMAP } from '../workspace/map-preview/types';
import { ICONS } from './Icons';
import { TypeChip } from './primitives';

interface PreviewPanelProps {
  subs: Sublayer[];
  name: string;
  section: Section | null;
  legend?: Legend;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function PreviewPanel({ subs, name, section, legend, open, setOpen }: PreviewPanelProps) {
  const mapElementRef = useRef<any>(null);
  const mapInstanceRef = useRef<__esri.Map | null>(null);
  const viewReady = useSignal(false);
  const isSigningIn = useSignal(false);
  const legendOpen = useSignal(false);

  const layerConfigs = useSignal<LayerConfig[]>(subs as LayerConfig[]);
  useEffect(() => {
    const timer = setTimeout(() => {
      layerConfigs.value = subs as LayerConfig[];
    }, 400);
    return () => clearTimeout(timer);
  }, [subs]);

  const needsAuth = useComputed(() =>
    layerConfigs.value.some((s) => s.type === 'portalItem') && isOAuthConfigured() && !arcgisState.value.portalAuthenticated
  );

  const handleSignIn = async () => {
    isSigningIn.value = true;
    try {
      await signInWithOAuth();
    } catch (e) {
      console.error('Sign-in failed:', e);
    } finally {
      isSigningIn.value = false;
    }
  };

  useEffect(() => {
    if (!arcgisState.value.initialized) {
      initializeArcGIS(arcgisCredentials.value || {}).catch((e) => console.error('Failed to initialize ArcGIS:', e));
    }
  }, []);

  const { isLoading, loadedLayerCount, hasTimeAwareLayers, cleanup } = useMapLayers({ layerConfigs, mapInstance: mapInstanceRef, viewReady });
  useBasemap({ mapInstance: mapInstanceRef, viewReady });

  const timeSliderRef = useRef<any>(null);
  const wmsTimeRef = useRef<Date | null>(null);

  const applyWmsTime = (instant: Date | null) => {
    const map = mapInstanceRef.current;
    if (!map || !instant) return;
    const TIME = instant.toISOString().replace('.000Z', 'Z');
    map.layers.forEach((l: any) => {
      if (l.type !== 'wms' || l.timeInfo) return;
      l.customLayerParameters = { ...l.customLayerParameters, TIME };
      l.refresh?.();
    });
  };

  useEffect(() => {
    const el = timeSliderRef.current;
    if (!el) return;
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const HOUR = 3_600_000;
    el.fullTimeExtent = new TimeExtent({ start: new Date(now.getTime() - 12 * HOUR), end: new Date(now.getTime() + 12 * HOUR) });
    el.timeExtent = new TimeExtent({ start: now, end: now });
    el.mode = 'instant';
    el.stops = { interval: new TimeInterval({ value: 1, unit: 'hours' }) };
    const onChange = (e: any) => {
      if (e.detail?.name !== 'timeExtent') return;
      wmsTimeRef.current = el.timeExtent?.start ?? null;
      applyWmsTime(wmsTimeRef.current);
    };
    el.addEventListener('arcgisPropertyChange', onChange);
    return () => el.removeEventListener('arcgisPropertyChange', onChange);
  }, [hasTimeAwareLayers.value, open]);

  useEffect(() => {
    applyWmsTime(wmsTimeRef.current);
  }, [loadedLayerCount.value]);

  const lk = legendKind(legend);
  const legendUrl = legend && typeof legend === 'object' && 'url' in legend ? legend.url : '';
  const legendText = legend && typeof legend === 'object' && 'text' in legend ? legend.text : '';
  const legendImage = legend && typeof legend === 'object' && 'image' in legend ? legend.image : '';
  const isB64 = legendUrl.startsWith('data:');
  const legendKindLabel = lk === 'auto' ? 'from service' : lk === 'text' ? 'text description' : lk === 'image' || isB64 ? 'base64 image' : 'image url';

  const legendElRef = useRef<any>(null);
  useEffect(() => {
    if (legendElRef.current && mapElementRef.current) legendElRef.current.referenceElement = mapElementRef.current;
  }, [legendOpen.value, lk, open]);

  const handleViewReadyRef = useRef<(e: any) => void>(() => {});
  handleViewReadyRef.current = (event: any) => {
    const mapElement = event.target;
    if (mapElement?.map) {
      if (mapInstanceRef.current !== mapElement.map) cleanup();
      mapInstanceRef.current = mapElement.map;
      viewReady.value = true;
    }
  };

  useEffect(() => {
    const mapElement = mapElementRef.current;
    if (!mapElement) return;
    const stableHandler = (event: any) => handleViewReadyRef.current(event);
    mapElement.addEventListener('arcgisViewReadyChange', stableHandler);
    return () => {
      mapElement.removeEventListener('arcgisViewReadyChange', stableHandler);
      cleanup();
      mapInstanceRef.current = null;
      viewReady.value = false;
    };
  }, [open]);

  if (!open) {
    return (
      <div style={{ width: 40, flexShrink: 0, background: C.panelBg, borderLeft: `1px solid ${C.bd2}`, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12 }}>
        <button onClick={() => setOpen(true)} title="Show preview" style={{ width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', color: C.fg3, background: 'transparent', border: `1px solid ${C.bd}`, cursor: 'pointer' }}>
          <span style={{ width: 15, height: 15 }}>{ICONS.map}</span>
        </button>
        <div style={{ writingMode: 'vertical-rl', fontSize: 11, fontWeight: 600, color: C.mut2, marginTop: 14, letterSpacing: 0.5 }}>PREVIEW</div>
      </div>
    );
  }

  const chip = section === 'overrides' ? 'OVERRIDE' : section === 'weather' ? 'WEATHER' : 'FEATURE';

  return (
    <div style={{ width: 380, flexShrink: 0, background: C.panelBg, borderLeft: `1px solid ${C.bd2}`, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ height: 44, borderBottom: `1px solid ${C.bd2}`, display: 'flex', alignItems: 'center', gap: 9, padding: '0 14px', flexShrink: 0 }}>
        <span style={{ width: 14, height: 14, color: C.accentText }}>{ICONS.map}</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.fg2 }}>Preview</span>
        {name && <span style={{ fontSize: 11.5, color: C.mut2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>· {name}</span>}
        <div style={{ flex: 1 }} />
        <button onClick={() => setOpen(false)} title="Hide" style={{ width: 26, height: 26, borderRadius: 6, display: 'grid', placeItems: 'center', color: C.fg3, background: 'transparent', border: `1px solid ${C.bd}`, cursor: 'pointer' }}>
          <span style={{ width: 13, height: 13 }}>{ICONS.close}</span>
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden' }} data-calcite-mode="dark">
        <arcgis-map ref={mapElementRef} basemap={DEFAULT_ARCGIS_BASEMAP.id} center="10.5,59.9" zoom="5" style={{ width: '100%', height: '100%' }}>
          <arcgis-zoom position="top-left" />
          {hasTimeAwareLayers.value && <arcgis-time-slider ref={timeSliderRef} position="bottom-left" />}
        </arcgis-map>

        {section && (
          <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10.5, fontWeight: 700, color: '#fff', background: 'rgba(58,92,255,0.92)', borderRadius: 6, padding: '3px 9px', pointerEvents: 'none' }}>{chip}</div>
        )}

        {isLoading.value && (
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', fontSize: 11, color: C.fg2, background: 'rgba(13,15,20,0.85)', border: `1px solid ${C.bd}`, borderRadius: 999, padding: '4px 11px' }}>Loading…</div>
        )}

        {needsAuth.value && (
          <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, background: 'rgba(46,40,21,0.95)', border: '1px solid #5a4a1c' }}>
            <div style={{ flex: 1, fontSize: 11.5, color: '#ffd27a', lineHeight: 1.4 }}>Sign in to load portal items from snla.maps.arcgis.com</div>
            <button onClick={handleSignIn} disabled={isSigningIn.value} style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', background: C.accent, border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {isSigningIn.value ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        )}

        {lk !== 'none' && (
          <button
            onClick={() => { legendOpen.value = !legendOpen.value; }}
            title={`Legend · ${legendKindLabel}`}
            style={{ position: 'absolute', top: section ? 42 : 12, right: 12, display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, padding: '0 9px', borderRadius: 6, fontSize: 10.5, fontWeight: 700, color: legendOpen.value ? '#fff' : C.fg3, background: legendOpen.value ? C.accent : 'rgba(13,15,20,0.9)', border: `1px solid ${legendOpen.value ? C.accent : C.bd}`, cursor: 'pointer' }}
          >
            <span style={{ width: 12, height: 12 }}>{ICONS.image}</span>
            Legend
          </button>
        )}

        {legendOpen.value && lk !== 'none' && (
          <div style={{ position: 'absolute', top: section ? 74 : 44, right: 12, width: 252, maxHeight: '62%', display: 'flex', flexDirection: 'column', background: 'rgba(13,15,20,0.95)', border: `1px solid ${C.bd}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 11px', borderBottom: `1px solid ${C.bd2}`, flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, color: C.mut, textTransform: 'uppercase' }}>Legend</span>
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: C.accentText, background: 'rgba(58,92,255,0.14)', border: '1px solid rgba(58,92,255,0.35)', borderRadius: 5, padding: '1px 6px' }}>{legendKindLabel}</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => { legendOpen.value = false; }} title="Close" style={{ width: 20, height: 20, borderRadius: 5, display: 'grid', placeItems: 'center', color: C.fg3, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <span style={{ width: 11, height: 11 }}>{ICONS.close}</span>
              </button>
            </div>
            <div style={{ padding: '9px 11px', overflowY: 'auto', minHeight: 0 }}>
              {lk === 'url' && (
                <>
                  <img src={legendUrl} alt="" style={{ maxWidth: '100%', objectFit: 'contain', borderRadius: 6, background: '#fff', padding: 4 }} />
                  {!isB64 && (
                    <a href={legendUrl} target="_blank" rel="noreferrer" title={legendUrl} style={{ display: 'block', marginTop: 7, fontSize: 10, color: C.accentText, fontFamily: 'ui-monospace,monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: 'none' }}>{legendUrl}</a>
                  )}
                </>
              )}
              {lk === 'image' && (
                <img src={legendImage.startsWith('data:') ? legendImage : `data:image/png;base64,${legendImage}`} alt="" style={{ maxWidth: '100%', objectFit: 'contain', borderRadius: 6, background: '#fff', padding: 4 }} />
              )}
              {lk === 'text' && <div style={{ fontSize: 11.5, color: C.fg2, lineHeight: 1.5 }}>{legendText}</div>}
              {lk === 'auto' && <arcgis-legend ref={legendElRef} style={{ display: 'block' }} />}
            </div>
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, borderTop: `1px solid ${C.bd2}`, padding: '11px 14px', maxHeight: 180, overflowY: 'auto' }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, color: C.mut2, textTransform: 'uppercase', marginBottom: 9 }}>
          {section ? `Rendered layers · ${subs.length}` : 'Nothing selected'}
          {loadedLayerCount.value > 0 && <span style={{ color: '#7ee2a8', marginLeft: 8 }}>{loadedLayerCount.value} loaded</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {subs.map((sl, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TypeChip type={sl.type} mini />
              <span style={{ flex: 1, fontSize: 11, color: C.mut, fontFamily: 'ui-monospace,monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shortSource(sl.source)}</span>
              <span style={{ fontSize: 9.5, color: C.faint }}>z{sl.zIndex ?? 0}</span>
            </div>
          ))}
          {section && subs.length === 0 && <div style={{ fontSize: 11.5, color: C.faint }}>No renderable sublayers.</div>}
        </div>
      </div>
    </div>
  );
}
